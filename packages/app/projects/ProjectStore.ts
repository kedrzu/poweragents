import { defineService } from '@nzyme/ioc/Service.js';
import { createSingleRunner } from '@nzyme/utils/createSingleRunner.js';
import { computed, reactive, ref } from 'vue';

import { ProjectCreateEndpoint } from '@poweragents/common/api/ProjectCreateEndpoint.js';
import { ProjectListEndpoint } from '@poweragents/common/api/ProjectListEndpoint.js';
import type { Project, ProjectCreateResult } from '@poweragents/common/api/ProjectTypes.js';
import { compareProjectsByName } from '@poweragents/common/utils/compareProjectsByName.js';

import { DaemonClient } from '@/daemon/DaemonClient.js';

/** Where the last opened project's id is kept, so the app reopens it after a restart. */
const LAST_OPENED_KEY = 'poweragents.lastOpenedProjectId';

/**
 * The person's projects as the daemon lists them, loaded once and kept in step with the projects the app creates, and
 * the project opened last, remembered across restarts.
 */
export const ProjectStore = defineService({
    name: 'ProjectStore',
    deps: { daemon: DaemonClient },
    setup({ daemon }) {
        /** `null` until loaded. */
        const projects = ref<Project[] | null>(null);
        const loadError = ref<string | null>(null);
        const loader = createSingleRunner({ handler: load });

        const state = reactive({
            /** Sorted by name, as the daemon sorts them; `null` until loaded. */
            projects: computed(() => projects.value),
            /** Why the projects could not be loaded; `null` when they were, or have not been tried yet. */
            loadError: computed(() => loadError.value),
        });

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
            try {
                const list = await daemon(ProjectListEndpoint);
                projects.value = list;
                loadError.value = null;
                return list;
            } catch (error) {
                loadError.value = error instanceof Error ? error.message : String(error);
                throw error;
            }
        }
    },
});
