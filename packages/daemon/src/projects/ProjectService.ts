import { randomUUID } from 'node:crypto';
import { lstat, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { defineService } from '@nzyme/ioc/Service.js';
import { Logger } from '@nzyme/logging/Logger.js';
import { assert } from '@nzyme/utils/assert.js';

import { PROJECT_NAME_MAX_LENGTH } from '@poweragents/common/api/ProjectTypes.js';
import type { Project, ProjectCreateResult } from '@poweragents/common/api/ProjectTypes.js';
import { compareProjectsByName } from '@poweragents/common/utils/compareProjectsByName.js';

import { POWERAGENTS_DATA_ROOT, PROJECTS_FOLDER } from '../env.js';
import { isErrorCode } from '../utils/isErrorCode.js';

/** A project with the folder that holds it. */
export interface LocalProject extends Project {
    /** The project's folder: an absolute path directly inside the data root's projects' folder. */
    dir: string;
}

/**
 * The person's projects: folders in the data root's `PROJECTS_FOLDER` that hold a marker, the hidden file
 * `.project.json`.
 */
export interface ProjectServiceShape {
    /**
     * Every project, sorted by name. A folder without a marker is not a project; an unreadable marker is skipped. A
     * folder whose marker repeats an id seen in an earlier folder (by folder name) is a copy: it gets a new id.
     */
    list(): Promise<LocalProject[]>;
    /** The project with this id, or `null` when there is none. */
    get(id: string): Promise<LocalProject | null>;
    /**
     * Creates a project in a new folder named after it. An existing folder is never reused: the next free name is taken
     * (`Name 2`, `Name 3`, …).
     */
    create(name: string): Promise<ProjectCreateResult>;
}

/** What a project's folder holds about it, in `.project.json`. */
interface ProjectMarker {
    id: string;
    name: string;
    /** ISO 8601. */
    createdAt: string;
}

const MARKER_FILE = '.project.json';
/** Removed from a name to make its folder's name: path separators, the drive and stream separator, control characters. */
const FOLDER_NAME_FORBIDDEN = /[/\\:\p{Cc}]/gu;

/** The person's projects, kept as folders in the profile's data root (`POWERAGENTS_DATA_ROOT`), under `PROJECTS_FOLDER`. */
export const ProjectService = defineService({
    name: 'ProjectService',
    deps: { logger: Logger, dataRoot: POWERAGENTS_DATA_ROOT },
    setup({ logger, dataRoot }): ProjectServiceShape {
        const root = path.resolve(dataRoot, PROJECTS_FOLDER);
        /**
         * Listings and creations run one at a time: two of the same name cannot both pass the uniqueness check, and two
         * listings cannot each give a copied folder a different new id.
         */
        let queue: Promise<unknown> = Promise.resolve();

        return { list, get, create };

        function list() {
            return exclusive(listProjects);
        }

        async function get(id: string) {
            const projects = await list();
            return projects.find(project => project.id === id) ?? null;
        }

        function create(name: string) {
            return exclusive(() => createProject(name));
        }

        /** Runs `task` after every task queued before it. */
        function exclusive<T>(task: () => Promise<T>) {
            const result = queue.then(task);
            queue = result.catch(() => undefined);
            return result;
        }

        async function listProjects() {
            const entries = await readdir(root, { withFileTypes: true }).catch((error: unknown) => {
                if (isErrorCode(error, 'ENOENT')) {
                    return [];
                }
                throw error;
            });

            const projects: LocalProject[] = [];
            const seenIds = new Set<string>();
            // Sorted, so the folder that keeps a shared id is always the same one: a copy's name (`Name copy`,
            // `Name 2`) sorts after its original's.
            const folders = entries
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name)
                .toSorted();
            for (const folder of folders) {
                const dir = path.join(root, folder);
                let marker = await readMarker(dir);
                if (!marker) {
                    continue;
                }
                if (seenIds.has(marker.id)) {
                    marker = await giveNewId(dir, marker);
                    if (!marker) {
                        continue;
                    }
                }
                seenIds.add(marker.id);
                projects.push({ id: marker.id, name: marker.name, dir });
            }

            return projects.toSorted(compareProjectsByName);
        }

        async function createProject(rawName: string): Promise<ProjectCreateResult> {
            const name = rawName.trim();
            const folderName = toFolderName(name);
            if (name.length === 0 || name.length > PROJECT_NAME_MAX_LENGTH || folderName.length === 0) {
                return { invalidName: true };
            }

            const projects = await listProjects();
            const key = name.toLocaleLowerCase();
            if (projects.some(project => project.name.toLocaleLowerCase() === key)) {
                return { nameTaken: true };
            }

            await mkdir(root, { recursive: true });
            const dir = await createFreeFolder(folderName);
            const marker: ProjectMarker = { id: randomUUID(), name, createdAt: new Date().toISOString() };
            await createMarker(dir, marker);

            logger.info('Project created', { projectId: marker.id, folder: path.basename(dir) });
            return { created: { id: marker.id, name: marker.name } };
        }

        /**
         * A folder copied with its marker (in Finder, say) shares its original's id, so it could never be opened: the
         * copy gets a new id, written to its marker, which keeps its name and creation time. `null` when the marker cannot
         * be written: the copy is skipped, so the other projects still list, and the next listing tries again.
         */
        async function giveNewId(dir: string, marker: ProjectMarker) {
            const renewed: ProjectMarker = { ...marker, id: randomUUID() };
            try {
                await replaceMarker(dir, renewed);
            } catch (error) {
                logger.warn(
                    "Project folder shares another project's id and could not be given a new one, folder skipped",
                    {
                        folder: path.basename(dir),
                        projectId: marker.id,
                        error,
                    },
                );
                return null;
            }
            logger.info("Project folder shares another project's id, given a new one", {
                folder: path.basename(dir),
                previousId: marker.id,
                projectId: renewed.id,
            });
            return renewed;
        }

        /** Creates the first folder of `Name`, `Name 2`, `Name 3`, … that does not exist yet; never enters an existing one. */
        async function createFreeFolder(folderName: string) {
            for (let suffix = 1; ; suffix++) {
                const dir = path.join(root, suffix === 1 ? folderName : `${folderName} ${suffix}`);
                // `toFolderName()` leaves no separator and no leading dot, so this holds; checked because a folder
                // outside the projects' folder would be one the agent does not see as a project, or one of the person's own.
                assert(path.dirname(dir) === root, "Project folder outside the projects' folder");
                try {
                    // Not recursive: it fails on an existing folder, also one created since the check, or a file.
                    await mkdir(dir);
                    return dir;
                } catch (error) {
                    if (!isErrorCode(error, 'EEXIST')) {
                        throw error;
                    }
                }
            }
        }

        /** Fails on an existing marker, a link included. */
        async function createMarker(dir: string, marker: ProjectMarker) {
            await writeFile(path.join(dir, MARKER_FILE), serializeMarker(marker), { flag: 'wx' });
        }

        /**
         * Replaces a marker in a folder the agent can write to: written to a new file beside it and renamed over it, so a
         * marker swapped for a link since it was read is replaced, not followed to the file it points at.
         */
        async function replaceMarker(dir: string, marker: ProjectMarker) {
            const temp = path.join(dir, `${MARKER_FILE}.${randomUUID()}.tmp`);
            try {
                await writeFile(temp, serializeMarker(marker), { flag: 'wx' });
                await rename(temp, path.join(dir, MARKER_FILE));
            } catch (error) {
                await rm(temp, { force: true });
                throw error;
            }
        }

        async function readMarker(dir: string) {
            const file = path.join(dir, MARKER_FILE);
            let content: string;
            try {
                // A link (or anything but a file) is not followed: the agent could point it at any file of the person's.
                const stats = await lstat(file);
                if (!stats.isFile()) {
                    logger.warn('Project marker is not a file, folder skipped', { folder: path.basename(dir) });
                    return null;
                }
                content = await readFile(file, 'utf8');
            } catch (error) {
                if (!isErrorCode(error, 'ENOENT')) {
                    logger.warn('Project marker unreadable, folder skipped', { folder: path.basename(dir), error });
                }
                return null;
            }

            let value: unknown;
            try {
                value = JSON.parse(content);
            } catch (error) {
                logger.warn('Project marker is not JSON, folder skipped', { folder: path.basename(dir), error });
                return null;
            }

            const marker = parseMarker(value);
            if (!marker) {
                logger.warn('Project marker malformed, folder skipped', { folder: path.basename(dir) });
            }
            return marker;
        }
    },
});

/**
 * The folder name for a project name: without separators and control characters, without leading dots (no hidden
 * folder, no `.` or `..`), trimmed. Letters of any language stay. Empty when nothing usable is left.
 * @__NO_SIDE_EFFECTS__
 */
function toFolderName(name: string) {
    return name
        .replace(FOLDER_NAME_FORBIDDEN, '')
        .trim()
        .replace(/^[.\s]+/, '')
        .trim();
}

/** @__NO_SIDE_EFFECTS__ */
function serializeMarker(marker: ProjectMarker) {
    return `${JSON.stringify(marker, null, 4)}\n`;
}

/** @__NO_SIDE_EFFECTS__ */
function parseMarker(value: unknown): ProjectMarker | null {
    if (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        typeof value.id === 'string' &&
        value.id.length > 0 &&
        'name' in value &&
        typeof value.name === 'string' &&
        'createdAt' in value &&
        typeof value.createdAt === 'string'
    ) {
        return { id: value.id, name: value.name, createdAt: value.createdAt };
    }
    return null;
}
