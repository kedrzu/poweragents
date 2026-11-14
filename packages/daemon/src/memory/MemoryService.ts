import { constants } from 'node:fs';
import { lstat, mkdir, open, readdir } from 'node:fs/promises';
import path from 'node:path';

import { defineService } from '@nzyme/ioc/Service.js';
import { Logger } from '@nzyme/logging/Logger.js';

import type { MemoryFile, MemoryFileGetResult } from '@poweragents/common/api/MemoryTypes.js';

import { MEMORY_FOLDER, POWERAGENTS_DATA_ROOT } from '../env.js';
import { isErrorCode } from '../utils/isErrorCode.js';

/**
 * The person's Memory (design D9): Markdown files in the data root's `MEMORY_FOLDER`, written by the agent. The agent
 * can write anything there, links included, and a link it makes resolves on this computer, not in the sandbox: so a
 * file is read only through real folders, never through a link, and never from a hidden file or folder.
 */
export interface MemoryServiceShape {
    /** Creates the Memory folder when it is missing; the daemon calls it at start. */
    ensureFolder(): Promise<void>;
    /** Every Markdown file in the Memory folder and its subfolders, sorted by path. */
    list(): Promise<MemoryFile[]>;
    /** One Markdown file by its path relative to the Memory folder, as `list()` gives it. */
    get(relativePath: string): Promise<MemoryFileGetResult>;
}

/** What a safe read of a Memory file gives. */
interface MemoryFileRead {
    content: string;
    updatedAt: number;
}

const MARKDOWN_EXTENSION = '.md';
/** A Markdown heading (`# Title`, `## Title ##`): its text without the closing hashes. */
const HEADING = /^#{1,6}[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
/** Opens a file without following a link in its last part; earlier parts are checked with `lstat` before. */
const OPEN_FLAGS = constants.O_RDONLY | constants.O_NOFOLLOW;

/** The person's Memory folder. */
export const MemoryService = defineService({
    name: 'MemoryService',
    deps: { logger: Logger, dataRoot: POWERAGENTS_DATA_ROOT },
    setup({ logger, dataRoot }): MemoryServiceShape {
        const root = path.resolve(dataRoot, MEMORY_FOLDER);

        return { ensureFolder, list, get };

        async function ensureFolder() {
            const created = await mkdir(root, { recursive: true });
            if (created !== undefined) {
                logger.info('Memory folder created');
            }
        }

        async function list() {
            const files: MemoryFile[] = [];
            if (!(await isRealFolder(root))) {
                logger.warn('Memory folder missing or not a folder, nothing listed');
                return files;
            }
            await collect([], files);
            return files.toSorted((a, b) => a.path.localeCompare(b.path));
        }

        async function get(relativePath: string): Promise<MemoryFileGetResult> {
            const segments = toSegments(relativePath);
            if (!segments) {
                logger.warn('Memory file path refused', { path: relativePath });
                return { notFound: true };
            }
            const read = await readFile(segments);
            if (!read) {
                return { notFound: true };
            }
            return { file: { ...toMemoryFile(segments, read), content: read.content } };
        }

        /** Adds the Markdown files of the folder at `segments` and its subfolders to `files`; links are skipped. */
        async function collect(segments: string[], files: MemoryFile[]) {
            const entries = await readdir(path.join(root, ...segments), { withFileTypes: true });
            for (const entry of entries) {
                if (entry.name.startsWith('.')) {
                    continue;
                }
                const entrySegments = [...segments, entry.name];
                if (entry.isDirectory()) {
                    await collect(entrySegments, files);
                } else if (entry.isFile() && isMarkdown(entry.name)) {
                    const read = await readFile(entrySegments);
                    if (read) {
                        files.push(toMemoryFile(entrySegments, read));
                    }
                }
            }
        }

        /**
         * Reads the file at `segments` under the Memory folder, or `null` when it is missing, not a file, or reached
         * through a link: the Memory folder and every folder on the way must be real folders, and the file a real file.
         */
        async function readFile(segments: string[]): Promise<MemoryFileRead | null> {
            const folders = [root];
            for (const segment of segments.slice(0, -1)) {
                folders.push(path.join(folders.at(-1) ?? root, segment));
            }
            for (const folder of folders) {
                if (!(await isRealFolder(folder))) {
                    logger.warn('Memory file not under real folders, refused', { path: segments.join('/') });
                    return null;
                }
            }

            const handle = await open(path.join(root, ...segments), OPEN_FLAGS).catch((error: unknown) => {
                // `ELOOP`: the file is a link.
                if (isErrorCode(error, 'ELOOP')) {
                    logger.warn('Memory file is a link, refused', { path: segments.join('/') });
                    return null;
                }
                if (isErrorCode(error, 'ENOENT') || isErrorCode(error, 'ENOTDIR')) {
                    return null;
                }
                throw error;
            });
            if (!handle) {
                return null;
            }
            try {
                const stats = await handle.stat();
                if (!stats.isFile()) {
                    return null;
                }
                return { content: await handle.readFile('utf8'), updatedAt: stats.mtimeMs };
            } finally {
                await handle.close();
            }
        }
    },
});

/** Whether `dir` is a folder itself, not a link to one; `false` when it does not exist. */
async function isRealFolder(dir: string) {
    try {
        return (await lstat(dir)).isDirectory();
    } catch (error) {
        if (isErrorCode(error, 'ENOENT') || isErrorCode(error, 'ENOTDIR')) {
            return false;
        }
        throw error;
    }
}

/**
 * A relative Memory path split into its parts, or `null` when it could lead elsewhere or to a file `list()` never gives:
 * absolute, with an empty, `.`, `..` or hidden part, or not Markdown. Both separators split it, so a Windows path is
 * checked the same way.
 * @__NO_SIDE_EFFECTS__
 */
function toSegments(relativePath: string) {
    if (relativePath.includes('\0') || path.posix.isAbsolute(relativePath) || path.win32.isAbsolute(relativePath)) {
        return null;
    }
    const segments = relativePath.split(/[\\/]/);
    if (segments.some(segment => segment.length === 0 || segment.startsWith('.'))) {
        return null;
    }
    return isMarkdown(segments.at(-1) ?? '') ? segments : null;
}

/** @__NO_SIDE_EFFECTS__ */
function isMarkdown(name: string) {
    return name.toLowerCase().endsWith(MARKDOWN_EXTENSION);
}

/** @__NO_SIDE_EFFECTS__ */
function toMemoryFile(segments: string[], read: MemoryFileRead): MemoryFile {
    const name = segments.at(-1) ?? '';
    return {
        path: segments.join('/'),
        title: readTitle(read.content) ?? name.slice(0, -MARKDOWN_EXTENSION.length),
        updatedAt: Math.round(read.updatedAt),
    };
}

/**
 * The text of the first Markdown heading, if any.
 * @__NO_SIDE_EFFECTS__
 */
function readTitle(content: string) {
    for (const line of content.split('\n')) {
        const title = HEADING.exec(line.trimEnd())?.[1]?.trim();
        if (title) {
            return title;
        }
    }
    return undefined;
}
