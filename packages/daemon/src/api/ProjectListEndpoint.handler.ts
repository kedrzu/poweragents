import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { ProjectListEndpoint } from '@poweragents/common/api/ProjectListEndpoint.js';

import { ProjectService } from '../projects/ProjectService.js';

/** Serves `ProjectListEndpoint`: a project's folder stays in the daemon. */
export const ProjectListEndpointHandler = defineEndpointHandler({
    endpoint: ProjectListEndpoint,
    deps: { projects: ProjectService },
    setup({ projects }) {
        return async () => {
            const list = await projects.list();
            return list.map(({ dir: _dir, ...project }) => project);
        };
    },
});
