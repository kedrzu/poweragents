import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { MemoryRevealEndpoint } from '@poweragents/common/api/MemoryRevealEndpoint.js';
import type { MemoryRevealResult } from '@poweragents/common/api/MemoryTypes.js';

import { RevealInFileManagerCommand } from '../host/RevealInFileManagerCommand.js';
import { MemoryService } from '../memory/MemoryService.js';

/** Serves `MemoryRevealEndpoint`: only a path `MemoryService` locates inside the Memory folder reaches the file manager. */
export const MemoryRevealEndpointHandler = defineEndpointHandler({
    endpoint: MemoryRevealEndpoint,
    deps: { memory: MemoryService, reveal: RevealInFileManagerCommand },
    setup({ memory, reveal }) {
        return async (input): Promise<MemoryRevealResult> => {
            const located = await memory.locate(input.path);
            if (located === null) {
                return { notFound: true };
            }
            const result = await reveal({ path: located });
            return result === 'revealed' ? { revealed: true } : { unsupported: true };
        };
    },
});
