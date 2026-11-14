import { mkdirSync, watch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import path from 'node:path';

import { defineService } from '@nzyme/ioc/Service.js';
import { Logger } from '@nzyme/logging/Logger.js';
import { createEventEmitter } from '@nzyme/utils/createEventEmitter.js';

import type { DataRootEvent } from '@poweragents/common/api/DaemonEventTypes.js';

import { MEMORY_FOLDER, POWERAGENTS_DATA_ROOT, PROJECTS_FOLDER } from '../env.js';

/**
 * Changes in the profile's data root, for the daemon's event stream: one watcher on the whole data root, started by the
 * first listener and kept for the daemon's lifetime. Changes are gathered for `DEBOUNCE_MS` from the first one, then
 * each kind is sent once, so an agent writing many files sends a few events, not one per file.
 */
export interface DataRootWatchServiceShape {
    /** Calls `listener` with every change from now on, until the returned function is called. */
    listen(listener: (event: DataRootEvent) => void): () => void;
}

/** How long changes are gathered before they are sent. */
const DEBOUNCE_MS = 300;
const PROJECT_MARKER = '.project.json';

/** The profile's data root, watched. */
export const DataRootWatchService = defineService({
    name: 'DataRootWatchService',
    deps: { logger: Logger, dataRoot: POWERAGENTS_DATA_ROOT },
    setup({ logger, dataRoot }): DataRootWatchServiceShape {
        const root = path.resolve(dataRoot);
        const emitter = createEventEmitter<[event: DataRootEvent]>();
        const pending = new Set<DataRootEvent['type']>();
        let watcher: FSWatcher | undefined;
        let timer: ReturnType<typeof setTimeout> | undefined;

        return { listen };

        function listen(listener: (event: DataRootEvent) => void) {
            emitter.event.on(listener);
            watcher ??= startWatching();
            return () => emitter.event.off(listener);
        }

        function startWatching() {
            // A missing data root cannot be watched; the daemon creates it with the Memory folder anyway.
            mkdirSync(root, { recursive: true });
            const started = watch(root, { recursive: true }, (_type, file) => onChange(file));
            started.on('error', error => logger.warn('Data root watcher failed', { error }));
            logger.debug('Data root watched');
            return started;
        }

        function onChange(file: string | null) {
            // Without a file name the change could be anywhere.
            const changes = file === null ? (['projectsChanged', 'memoryChanged'] as const) : classify(file);
            for (const change of changes) {
                pending.add(change);
            }
            if (pending.size > 0) {
                timer ??= setTimeout(flush, DEBOUNCE_MS);
            }
        }

        function flush() {
            timer = undefined;
            const types = [...pending];
            pending.clear();
            for (const type of types) {
                emitter.emit({ type });
            }
        }
    },
});

/**
 * What a change at `file` (relative to the data root) means to the app: a project folder itself or its marker changes
 * the project list, anything in the Memory folder the Memory. Files inside a project are not the list's business.
 * @__NO_SIDE_EFFECTS__
 */
function classify(file: string): DataRootEvent['type'][] {
    const [top, folder, name, ...rest] = file.split(/[\\/]/);
    switch (top) {
        case PROJECTS_FOLDER:
            return folder === undefined || name === undefined || (name === PROJECT_MARKER && rest.length === 0)
                ? ['projectsChanged']
                : [];
        case MEMORY_FOLDER:
            return ['memoryChanged'];
        default:
            return [];
    }
}
