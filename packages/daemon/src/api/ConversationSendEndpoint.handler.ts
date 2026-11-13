import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { ConversationSendEndpoint } from '@poweragents/common/api/ConversationSendEndpoint.js';

import { ConversationService } from '../conversations/ConversationService.js';

/** Serves `ConversationSendEndpoint`. */
export const ConversationSendEndpointHandler = defineEndpointHandler({
    endpoint: ConversationSendEndpoint,
    deps: { conversations: ConversationService },
    setup({ conversations }) {
        return input => conversations.send(input);
    },
});
