import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { ConversationRef, ConversationStopResult } from './ConversationTypes.js';
import { createInputSchema } from './utils/createInputSchema.js';
import { parseConversationRef } from './utils/parseConversationRef.js';

const input = createInputSchema<ConversationRef>('{ projectId: string, conversationId: string }', parseConversationRef);

/** Stops the agent's work on a conversation. `404 ConversationNotFound` for a conversation not in the project. */
export const ConversationStopEndpoint = defineEndpoint<ConversationRef, ConversationStopResult>({
    name: 'conversations/stop',
    input,
});
