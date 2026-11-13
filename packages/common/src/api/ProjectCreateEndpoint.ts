import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { ProjectCreateInput, ProjectCreateResult } from './ProjectTypes.js';
import { createInputSchema } from './utils/createInputSchema.js';

const input = createInputSchema<ProjectCreateInput>('{ name: string }', value =>
    'name' in value && typeof value.name === 'string' ? { name: value.name } : undefined,
);

/** Creates a project and its folder in the profile's data root. */
export const ProjectCreateEndpoint = defineEndpoint<ProjectCreateInput, ProjectCreateResult>({
    name: 'projects/create',
    input,
});
