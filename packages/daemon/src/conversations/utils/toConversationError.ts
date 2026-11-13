import type { ConversationError } from '@poweragents/common/api/ConversationTypes.js';
import type { OpencodeReportedError } from '@poweragents/opencode/OpencodeTypes.js';

/** Claude Code's sign-in has ended or was never there: it asks to run `/login`, or the provider answers 401. */
const SIGNED_OUT = /not logged in|please run \/login|invalid api key|oauth token (has )?(expired|revoked)/i;
/** The plan's limit: `Claude AI usage limit reached|<reset, epoch s>`, or a 5-hour or weekly limit "reached". */
const USAGE_LIMIT = /usage limit|limit reached|limit will reset/i;
/** The reset time Claude Code appends to its usage-limit message, in epoch seconds. */
const RESET_EPOCH_SECONDS = /\|(\d{10})\b/;

/**
 * An error the agent reports, in the kinds the app acts on. Only the message travels on, never the provider's response
 * body, which can echo anything sent to it.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function toConversationError(error: OpencodeReportedError): ConversationError {
    if (error.httpStatus === 401 || SIGNED_OUT.test(error.message)) {
        return { kind: 'signedOut' };
    }
    if (USAGE_LIMIT.test(error.message)) {
        const reset = RESET_EPOCH_SECONDS.exec(error.message)?.[1];
        return reset == null ? { kind: 'usageLimit' } : { kind: 'usageLimit', resetAt: Number(reset) * 1000 };
    }
    return { kind: 'other', message: error.message };
}
