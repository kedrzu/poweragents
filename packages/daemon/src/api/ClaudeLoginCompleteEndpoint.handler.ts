import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { ClaudeLoginCompleteEndpoint } from '@poweragents/common/api/ClaudeLoginCompleteEndpoint.js';

import { ClaudeSignInService } from '../claude/ClaudeSignInService.js';

/** Serves `ClaudeLoginCompleteEndpoint`. */
export const ClaudeLoginCompleteEndpointHandler = defineEndpointHandler({
    endpoint: ClaudeLoginCompleteEndpoint,
    deps: { claude: ClaudeSignInService },
    setup({ claude }) {
        return input => claude.completeLogin(input.code);
    },
});
