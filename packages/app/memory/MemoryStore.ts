import { defineService } from '@nzyme/ioc/Service.js';
import { Logger } from '@nzyme/logging/Logger.js';
import { assertNever } from '@nzyme/utils/assertNever.js';
import { computed, reactive, ref } from 'vue';

import type { DaemonEvent } from '@poweragents/common/api/DaemonEventTypes.js';
import { MemoryFileListEndpoint } from '@poweragents/common/api/MemoryFileListEndpoint.js';
import type { MemoryFile } from '@poweragents/common/api/MemoryTypes.js';

import { DaemonClient } from '@/daemon/DaemonClient.js';
import { DaemonEventStream } from '@/daemon/DaemonEventStream.js';

/**
 * The person's Memory files as the daemon lists them, newest first, kept current by the daemon's events: each change in
 * the Memory folder lists them again and counts up `revision`, so whoever shows a file's text reads it again.
 */
export const MemoryStore = defineService({
    name: 'MemoryStore',
    deps: { daemon: DaemonClient, events: DaemonEventStream, logger: Logger },
    setup({ daemon, events, logger }) {
        /** `null` until loaded. */
        const files = ref<MemoryFile[] | null>(null);
        const loadError = ref<string | null>(null);
        const revision = ref(0);
        /** Counts loads, so the answer of a load started before a newer one never replaces the newer list. */
        let loadSeq = 0;

        const state = reactive({
            /** Newest first; `null` until loaded. */
            files: computed(() => files.value),
            /** Why the files could not be listed; `null` once they were, or before the first try. */
            loadError: computed(() => loadError.value),
            /** Counts the changes in the Memory folder the app has heard of. */
            revision: computed(() => revision.value),
        });

        events.event.on(onEvent);

        return { state, load };

        /** Lists the files (again); a failure is kept in `state.loadError`, and a list shown already stays. */
        async function load() {
            const seq = ++loadSeq;
            try {
                const list = await daemon(MemoryFileListEndpoint);
                if (seq === loadSeq) {
                    files.value = list.toSorted((a, b) => b.updatedAt - a.updatedAt || a.path.localeCompare(b.path));
                    loadError.value = null;
                }
            } catch (error) {
                logger.warn('Memory files could not be listed', { error });
                if (seq === loadSeq) {
                    loadError.value = error instanceof Error ? error.message : String(error);
                }
            }
        }

        function onEvent(event: DaemonEvent) {
            switch (event.type) {
                case 'memoryChanged':
                case 'streamRestored':
                    revision.value++;
                    // Only a list asked for already: the Memory screen loads the first.
                    if (files.value !== null || loadError.value !== null) {
                        void load();
                    }
                    break;
                case 'projectsChanged':
                case 'conversationCreated':
                case 'conversationRenamed':
                case 'runningChanged':
                case 'textDelta':
                case 'stepStarted':
                case 'stepFinished':
                case 'stepFailed':
                case 'runFinished':
                    break;
                default:
                    assertNever(event);
            }
        }
    },
});
