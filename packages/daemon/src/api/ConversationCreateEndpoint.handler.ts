import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { ConversationCreateEndpoint } from '@poweragents/common/api/ConversationCreateEndpoint.js';

import { ConversationService } from '../conversations/ConversationService.js';

/** Serves `ConversationCreateEndpoint`. */
export const ConversationCreateEndpointHandler = defineEndpointHandler({
    endpoint: ConversationCreateEndpoint,
    deps: { conversations: ConversationService },
    setup({ conversations }) {
        return input => conversations.create(input.projectId);
    },
});
