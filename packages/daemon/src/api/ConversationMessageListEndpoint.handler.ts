import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { ConversationMessageListEndpoint } from '@poweragents/common/api/ConversationMessageListEndpoint.js';

import { ConversationService } from '../conversations/ConversationService.js';

/** Serves `ConversationMessageListEndpoint`. */
export const ConversationMessageListEndpointHandler = defineEndpointHandler({
    endpoint: ConversationMessageListEndpoint,
    deps: { conversations: ConversationService },
    setup({ conversations }) {
        return input => conversations.listMessages(input);
    },
});
