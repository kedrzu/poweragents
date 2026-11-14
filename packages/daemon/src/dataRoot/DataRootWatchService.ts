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
 * first listener and closed when the last one leaves. A watcher that fails is closed and started again after
 * `RESTART_DELAY_MS`, while anyone listens. Changes are gathered for `DEBOUNCE_MS` from the first one, then each kind is
 * sent once, so an agent writing many files sends a few events, not one per file.
 */
export interface DataRootWatchServiceShape {
    /** Calls `listener` with every change from now on, until the returned function is called. */
    listen(listener: (event: DataRootEvent) => void): () => void;
}

/** How long changes are gathered before they are sent. */
const DEBOUNCE_MS = 300;
/** How long after a failure the watcher is started again. */
const RESTART_DELAY_MS = 1000;
const PROJECT_MARKER = '.project.json';

/** The profile's data root, watched. */
export const DataRootWatchService = defineService({
    name: 'DataRootWatchService',
    deps: { logger: Logger, dataRoot: POWERAGENTS_DATA_ROOT },
    setup({ logger, dataRoot }): DataRootWatchServiceShape {
        const root = path.resolve(dataRoot);
        const emitter = createEventEmitter<[event: DataRootEvent]>();
        const pending = new Set<DataRootEvent['type']>();
        let listenerCount = 0;
        let watcher: FSWatcher | undefined;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let restartTimer: ReturnType<typeof setTimeout> | undefined;
        /** Whether the last start failed: only the first failure in a row is a warning. */
        let failing = false;

        return { listen };

        function listen(listener: (event: DataRootEvent) => void) {
            emitter.event.on(listener);
            listenerCount++;
            startWatching();
            let listening = true;
            return () => {
                if (!listening) {
                    return;
                }
                listening = false;
                emitter.event.off(listener);
                listenerCount--;
                if (listenerCount === 0) {
                    stopWatching();
                }
            };
        }

        function startWatching() {
            if (watcher || listenerCount === 0) {
                return;
            }
            clearTimeout(restartTimer);
            restartTimer = undefined;
            try {
                // A missing data root cannot be watched; the daemon creates it with the Memory folder anyway.
                mkdirSync(root, { recursive: true });
                const started = watch(root, { recursive: true }, (_type, file) => onChange(file));
                started.on('error', error => {
                    if (watcher === started) {
                        onFailure(error);
                    }
                });
                watcher = started;
            } catch (error) {
                onFailure(error);
                return;
            }
            failing = false;
            logger.debug('Data root watched');
        }

        function onFailure(error: unknown) {
            if (failing) {
                logger.debug('Data root watcher failed again', { error });
            } else {
                logger.warn('Data root watcher failed, restarting', { error });
            }
            failing = true;
            watcher?.close();
            watcher = undefined;
            restartTimer ??= setTimeout(startWatching, RESTART_DELAY_MS);
        }

        function stopWatching() {
            watcher?.close();
            watcher = undefined;
            clearTimeout(restartTimer);
            restartTimer = undefined;
            clearTimeout(timer);
            timer = undefined;
            pending.clear();
            logger.debug('Data root no longer watched');
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
