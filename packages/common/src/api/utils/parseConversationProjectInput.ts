import { readString } from '../../utils/readString.js';
import type { ConversationProjectInput } from '../ConversationTypes.js';

/**
 * The project a request body points at, or `undefined` when it does not hold its id as a string.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function parseConversationProjectInput(value: object): ConversationProjectInput | undefined {
    const projectId = readString(value, 'projectId');
    return projectId === undefined ? undefined : { projectId };
}
