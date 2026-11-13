import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { Conversation, ConversationProjectInput } from './ConversationTypes.js';
import { createInputSchema } from './utils/createInputSchema.js';
import { parseConversationProjectInput } from './utils/parseConversationProjectInput.js';

const input = createInputSchema('{ projectId: string }', parseConversationProjectInput);

/** Starts an empty conversation in a project; `404 ProjectNotFound` for an unknown project. */
export const ConversationCreateEndpoint = defineEndpoint<ConversationProjectInput, Conversation>({
    name: 'conversations/create',
    input,
});
