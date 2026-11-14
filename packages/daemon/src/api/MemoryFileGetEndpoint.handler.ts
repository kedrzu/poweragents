import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { MemoryFileGetEndpoint } from '@poweragents/common/api/MemoryFileGetEndpoint.js';

import { MemoryService } from '../memory/MemoryService.js';

/** Serves `MemoryFileGetEndpoint`. */
export const MemoryFileGetEndpointHandler = defineEndpointHandler({
    endpoint: MemoryFileGetEndpoint,
    deps: { memory: MemoryService },
    setup({ memory }) {
        return input => memory.get(input.path);
    },
});
