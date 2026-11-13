import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { ConversationMessageListInput, ConversationMessagePage } from './ConversationTypes.js';
import { readString } from '../utils/readString.js';
import { createInputSchema } from './utils/createInputSchema.js';
import { parseConversationRef } from './utils/parseConversationRef.js';

const input = createInputSchema<ConversationMessageListInput>(
    '{ projectId: string, conversationId: string, olderCursor?: string }',
    value => {
        const ref = parseConversationRef(value);
        if (!ref) {
            return undefined;
        }
        if (!('olderCursor' in value) || value.olderCursor == null) {
            return ref;
        }
        const olderCursor = readString(value, 'olderCursor');
        return olderCursor === undefined ? undefined : { ...ref, olderCursor };
    },
);

/**
 * A page of a conversation's messages, counting back from the newest. `404 ConversationNotFound` for a conversation not
 * in the project.
 */
export const ConversationMessageListEndpoint = defineEndpoint<ConversationMessageListInput, ConversationMessagePage>({
    name: 'conversations/messages',
    input,
});
