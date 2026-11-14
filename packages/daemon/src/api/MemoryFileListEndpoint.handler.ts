import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { MemoryFileListEndpoint } from '@poweragents/common/api/MemoryFileListEndpoint.js';

import { MemoryService } from '../memory/MemoryService.js';

/** Serves `MemoryFileListEndpoint`. */
export const MemoryFileListEndpointHandler = defineEndpointHandler({
    endpoint: MemoryFileListEndpoint,
    deps: { memory: MemoryService },
    setup({ memory }) {
        return () => memory.list();
    },
});
