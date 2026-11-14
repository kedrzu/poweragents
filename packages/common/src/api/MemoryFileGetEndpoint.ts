import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { MemoryFileGetInput, MemoryFileGetResult } from './MemoryTypes.js';
import { createInputSchema } from './utils/createInputSchema.js';

const input = createInputSchema<MemoryFileGetInput>('{ path: string }', value =>
    'path' in value && typeof value.path === 'string' ? { path: value.path } : undefined,
);

/** One Markdown file of the person's Memory, with its text. Only files inside the Memory folder are served. */
export const MemoryFileGetEndpoint = defineEndpoint<MemoryFileGetInput, MemoryFileGetResult>({
    name: 'memory/file',
    input,
});
