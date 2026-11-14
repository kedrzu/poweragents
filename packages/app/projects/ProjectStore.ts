import { defineService } from '@nzyme/ioc/Service.js';
import { assertNever } from '@nzyme/utils/assertNever.js';
import { createSingleRunner } from '@nzyme/utils/createSingleRunner.js';
import { computed, reactive, ref } from 'vue';

import { ProjectCreateEndpoint } from '@poweragents/common/api/ProjectCreateEndpoint.js';
import { ProjectListEndpoint } from '@poweragents/common/api/ProjectListEndpoint.js';
import type { DaemonEvent } from '@poweragents/common/api/DaemonEventTypes.js';
import type { Project, ProjectCreateResult } from '@poweragents/common/api/ProjectTypes.js';
import { compareProjectsByName } from '@poweragents/common/utils/compareProjectsByName.js';

import { DaemonClient } from '@/daemon/DaemonClient.js';
import { DaemonEventStream } from '@/daemon/DaemonEventStream.js';

/** Where the last opened project's id is kept, so the app reopens it after a restart. */
const LAST_OPENED_KEY = 'poweragents.lastOpenedProjectId';

/**
 * The person's projects as the daemon lists them, loaded once and kept in step with the projects the app creates and
 * with the daemon's events (a project folder made or removed outside the app, the agent creating one), and the project
 * opened last, remembered across restarts.
 */
export const ProjectStore = defineService({
    name: 'ProjectStore',
    deps: { daemon: DaemonClient, events: DaemonEventStream },
    setup({ daemon, events }) {
        /** `null` until loaded. */
        const projects = ref<Project[] | null>(null);
        const loadError = ref<string | null>(null);
        const loader = createSingleRunner({ handler: load });
        /** Counts loads, so the answer of a load started before a newer one never replaces the newer list. */
        let loadSeq = 0;

        const state = reactive({
            /** Sorted by name, as the daemon sorts them; `null` until loaded. */
            projects: computed(() => projects.value),
            /** Why the projects could not be loaded; `null` when they were, or have not been tried yet. */
            loadError: computed(() => loadError.value),
        });

        events.event.on(onEvent);

        return {
            state,
            getProjects,
            create,
            getLastOpened,
            setLastOpened,
        };

        /** The projects, loaded from the daemon on the first call. */
        async function getProjects(): Promise<readonly Project[]> {
            return projects.value ?? (await loader.execute());
        }

        /**
         * Creates a project; a created one joins the loaded list in its place by name. With no list loaded yet, the next
         * load brings it, so a failing load never turns a created project into a failure.
         */
        async function create(name: string): Promise<ProjectCreateResult> {
            const result = await daemon(ProjectCreateEndpoint, { name });
            if ('created' in result && projects.value !== null) {
                const others = projects.value.filter(project => project.id !== result.created.id);
                projects.value = [...others, result.created].toSorted(compareProjectsByName);
            } else if ('created' in result) {
                loader.execute().catch(() => {
                    // The store keeps the failure, which the shell shows.
                });
            }
            return result;
        }

        /** The project opened last, if it is still among `list`. */
        function getLastOpened(list: readonly Project[]) {
            const id = localStorage.getItem(LAST_OPENED_KEY);
            return list.find(project => project.id === id);
        }

        /** Remembers the project opened now, for the next start. */
        function setLastOpened(id: string) {
            localStorage.setItem(LAST_OPENED_KEY, id);
        }

        async function load() {
            const seq = ++loadSeq;
            try {
                const list = await daemon(ProjectListEndpoint);
                if (seq === loadSeq) {
                    projects.value = list;
                    loadError.value = null;
                }
                return list;
            } catch (error) {
                if (seq === loadSeq) {
                    loadError.value = error instanceof Error ? error.message : String(error);
                }
                throw error;
            }
        }

        /** Lists the projects again, past a load already running, which may have read the folder before the change. */
        function reload() {
            loader.reset();
            loader.execute().catch(() => {
                // The store keeps the failure; a list shown already stays.
            });
        }

        function onEvent(event: DaemonEvent) {
            switch (event.type) {
                case 'projectsChanged':
                case 'streamRestored':
                    // Only a list asked for already: the first load is the shell's.
                    if (projects.value !== null || loadError.value !== null) {
                        reload();
                    }
                    break;
                case 'memoryChanged':
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
