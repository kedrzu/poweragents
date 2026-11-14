import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { MemoryRevealInput, MemoryRevealResult } from './MemoryTypes.js';
import { createInputSchema } from './utils/createInputSchema.js';

const input = createInputSchema<MemoryRevealInput>('{ path?: string }', value => {
    if (!('path' in value) || value.path === undefined) {
        return {};
    }
    return typeof value.path === 'string' ? { path: value.path } : undefined;
});

/**
 * Shows the Memory folder, or one of its files selected, in the computer's file manager (Finder), on the computer the
 * daemon runs on. Only paths inside the Memory folder are shown.
 */
export const MemoryRevealEndpoint = defineEndpoint<MemoryRevealInput, MemoryRevealResult>({
    name: 'memory/reveal',
    input,
});
