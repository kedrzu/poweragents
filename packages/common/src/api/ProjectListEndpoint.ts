import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { Project } from './ProjectTypes.js';

/** The person's projects, sorted by name. */
export const ProjectListEndpoint = defineEndpoint<void, Project[]>({ name: 'projects/list' });
