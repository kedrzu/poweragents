import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { ClaudeStatusGetEndpoint } from '@poweragents/common/api/ClaudeStatusGetEndpoint.js';

import { ClaudeSignInService } from '../claude/ClaudeSignInService.js';

/** Serves `ClaudeStatusGetEndpoint`. */
export const ClaudeStatusGetEndpointHandler = defineEndpointHandler({
    endpoint: ClaudeStatusGetEndpoint,
    deps: { claude: ClaudeSignInService },
    setup({ claude }) {
        return () => claude.getStatus();
    },
});
