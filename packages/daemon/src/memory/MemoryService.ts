import { constants } from 'node:fs';
import type { Stats } from 'node:fs';
import { lstat, mkdir, open, readdir } from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import path from 'node:path';

import { defineService } from '@nzyme/ioc/Service.js';
import { Logger } from '@nzyme/logging/Logger.js';

import type { MemoryFile, MemoryFileGetResult } from '@poweragents/common/api/MemoryTypes.js';

import { MEMORY_FOLDER, POWERAGENTS_DATA_ROOT } from '../env.js';
import { isErrorCode } from '../utils/isErrorCode.js';
import { isRealFolder } from '../utils/isRealFolder.js';

/**
 * The person's Memory (design D9): Markdown files in the data root's `MEMORY_FOLDER`, written by the agent. The agent
 * can write anything there, links included, and a link it makes resolves on this computer, not in the sandbox: so a
 * file is read only through real folders, never through a link, and never from a hidden file or folder. Only regular
 * files are opened (never a pipe or a device), and only a bounded part of one is read.
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

/** A Memory file opened after it was found a regular file. */
interface OpenedMemoryFile {
    handle: FileHandle;
    stats: Stats;
}

const MARKDOWN_EXTENSION = '.md';
/** A Markdown heading (`# Title`, `## Title ##`): its text without the closing hashes. */
const HEADING = /^#{1,6}[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
/**
 * Opens a file without following a link in its last part (earlier parts are checked with `lstat` before), and without
 * waiting for a writer when a pipe took the file's place since its `lstat`.
 */
const OPEN_FLAGS = constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK;
/** The largest file `get()` reads. */
const GET_MAX_BYTES = 1024 * 1024;
/** How much of a file `list()` reads for its title. */
const TITLE_PREFIX_BYTES = 4096;

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
            const opened = await openFile(segments);
            if (!opened) {
                return { notFound: true };
            }
            try {
                // One byte over the limit tells a file at the limit from a larger one, also one growing since `stat`.
                const bytes = await readPrefix(opened.handle, GET_MAX_BYTES + 1);
                if (bytes.length > GET_MAX_BYTES) {
                    logger.warn('Memory file too large, not read', {
                        path: segments.join('/'),
                        size: opened.stats.size,
                    });
                    return { tooLarge: true };
                }
                const read: MemoryFileRead = { content: bytes.toString('utf8'), updatedAt: opened.stats.mtimeMs };
                return { file: { ...toMemoryFile(segments, read), content: read.content } };
            } finally {
                await opened.handle.close();
            }
        }

        /**
         * Adds the Markdown files of the folder at `segments` and its subfolders to `files`; links are skipped, and so is
         * a folder removed while the listing runs.
         */
        async function collect(segments: string[], files: MemoryFile[]) {
            const entries = await readdir(path.join(root, ...segments), { withFileTypes: true }).catch(
                (error: unknown) => {
                    if (isErrorCode(error, 'ENOENT') || isErrorCode(error, 'ENOTDIR')) {
                        logger.debug('Memory folder gone while listed, skipped', { path: segments.join('/') });
                        return [];
                    }
                    throw error;
                },
            );
            for (const entry of entries) {
                if (entry.name.startsWith('.')) {
                    continue;
                }
                const entrySegments = [...segments, entry.name];
                if (entry.isDirectory()) {
                    await collect(entrySegments, files);
                } else if (entry.isFile() && isMarkdown(entry.name)) {
                    const read = await readTitleSource(entrySegments);
                    if (read) {
                        files.push(toMemoryFile(entrySegments, read));
                    }
                }
            }
        }

        /** The start of the file at `segments`, enough for its title, or `null` when `openFile()` refuses it. */
        async function readTitleSource(segments: string[]): Promise<MemoryFileRead | null> {
            const opened = await openFile(segments);
            if (!opened) {
                return null;
            }
            try {
                const bytes = await readPrefix(opened.handle, TITLE_PREFIX_BYTES);
                let content = bytes.toString('utf8');
                if (bytes.length === TITLE_PREFIX_BYTES) {
                    // The last line may be cut, mid-heading or mid-character: dropped.
                    content = content.slice(0, Math.max(content.lastIndexOf('\n'), 0));
                }
                return { content, updatedAt: opened.stats.mtimeMs };
            } finally {
                await opened.handle.close();
            }
        }

        /**
         * Opens the file at `segments` under the Memory folder, or `null` when it is missing, not a regular file, or
         * reached through a link: the Memory folder and every folder on the way must be real folders, and the file a
         * regular file before it is opened, so a pipe or a device is never opened.
         */
        async function openFile(segments: string[]): Promise<OpenedMemoryFile | null> {
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

            const file = path.join(root, ...segments);
            const linkStats = await lstat(file).catch((error: unknown) => {
                if (isErrorCode(error, 'ENOENT') || isErrorCode(error, 'ENOTDIR')) {
                    return null;
                }
                throw error;
            });
            if (!linkStats) {
                return null;
            }
            if (!linkStats.isFile()) {
                logger.warn('Memory file is not a regular file, refused', { path: segments.join('/') });
                return null;
            }

            const handle = await open(file, OPEN_FLAGS).catch((error: unknown) => {
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
            const stats = await handle.stat();
            if (!stats.isFile()) {
                await handle.close();
                return null;
            }
            return { handle, stats };
        }
    },
});

/** Reads at most `maxBytes` from the start of the file. */
async function readPrefix(handle: FileHandle, maxBytes: number) {
    const buffer = Buffer.alloc(maxBytes);
    let length = 0;
    while (length < maxBytes) {
        const { bytesRead } = await handle.read(buffer, length, maxBytes - length, length);
        if (bytesRead === 0) {
            break;
        }
        length += bytesRead;
    }
    return buffer.subarray(0, length);
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
