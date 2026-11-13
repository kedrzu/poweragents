import { readString } from '../../utils/readString.js';
import type { ConversationRef } from '../ConversationTypes.js';
import { parseConversationProjectInput } from './parseConversationProjectInput.js';

/**
 * The conversation a request body points at, or `undefined` when it does not hold both ids as strings.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function parseConversationRef(value: object): ConversationRef | undefined {
    const project = parseConversationProjectInput(value);
    const conversationId = readString(value, 'conversationId');
    return project && conversationId !== undefined ? { ...project, conversationId } : undefined;
}
