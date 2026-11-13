import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { Conversation, ConversationProjectInput } from './ConversationTypes.js';
import { createInputSchema } from './utils/createInputSchema.js';
import { parseConversationProjectInput } from './utils/parseConversationProjectInput.js';

const input = createInputSchema('{ projectId: string }', parseConversationProjectInput);

/** A project's conversations, newest first; `404 ProjectNotFound` for an unknown project. */
export const ConversationListEndpoint = defineEndpoint<ConversationProjectInput, Conversation[]>({
    name: 'conversations/list',
    input,
});
