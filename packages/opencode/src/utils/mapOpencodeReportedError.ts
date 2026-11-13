import type { OpencodeReportedError } from '../OpencodeTypes.js';
import type { components } from '../schema.gen.js';

/**
 * An error OpenCode reports on a message, a tool call, a step or a run, in the daemon's terms.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function mapOpencodeReportedError(
    error: components['schemas']['Session.StructuredError'],
): OpencodeReportedError {
    return {
        kind: error.type,
        message: error.message,
        httpStatus: error.status,
        responseBody: error.response?.body,
        retryAfterMs: error.retryAfterMs,
    };
}
