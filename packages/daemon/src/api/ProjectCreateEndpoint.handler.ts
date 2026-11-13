import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { ProjectCreateEndpoint } from '@poweragents/common/api/ProjectCreateEndpoint.js';

import { ProjectService } from '../projects/ProjectService.js';

/** Serves `ProjectCreateEndpoint`. */
export const ProjectCreateEndpointHandler = defineEndpointHandler({
    endpoint: ProjectCreateEndpoint,
    deps: { projects: ProjectService },
    setup({ projects }) {
        return input => projects.create(input.name);
    },
});
