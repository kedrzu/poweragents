import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { ConversationListEndpoint } from '@poweragents/common/api/ConversationListEndpoint.js';

import { ConversationService } from '../conversations/ConversationService.js';

/** Serves `ConversationListEndpoint`. */
export const ConversationListEndpointHandler = defineEndpointHandler({
    endpoint: ConversationListEndpoint,
    deps: { conversations: ConversationService },
    setup({ conversations }) {
        return input => conversations.list(input.projectId);
    },
});
