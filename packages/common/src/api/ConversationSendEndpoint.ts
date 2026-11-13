import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { ConversationSendInput, ConversationSendResult } from './ConversationTypes.js';
import { readString } from '../utils/readString.js';
import { createInputSchema } from './utils/createInputSchema.js';
import { parseConversationRef } from './utils/parseConversationRef.js';

const input = createInputSchema<ConversationSendInput>(
    '{ projectId: string, conversationId: string, text: string }',
    value => {
        const ref = parseConversationRef(value);
        const text = readString(value, 'text');
        return ref && text !== undefined ? { ...ref, text } : undefined;
    },
);

/**
 * Sends the person's message; the agent's work on it streams as events. `404 ConversationNotFound` for a conversation
 * not in the project.
 */
export const ConversationSendEndpoint = defineEndpoint<ConversationSendInput, ConversationSendResult>({
    name: 'conversations/send',
    input,
});
