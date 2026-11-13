import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { ClaudeLoginStartEndpoint } from '@poweragents/common/api/ClaudeLoginStartEndpoint.js';

import { ClaudeSignInService } from '../claude/ClaudeSignInService.js';

/** Serves `ClaudeLoginStartEndpoint`. */
export const ClaudeLoginStartEndpointHandler = defineEndpointHandler({
    endpoint: ClaudeLoginStartEndpoint,
    deps: { claude: ClaudeSignInService },
    setup({ claude }) {
        return () => claude.startLogin();
    },
});
