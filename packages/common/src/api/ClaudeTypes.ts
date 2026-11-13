/**
 * The Claude plans (`subscriptionType` of Claude Code's login) the agent may run on; any other plan, a free one
 * included, cannot be used for Claude Code.
 */
export const CLAUDE_ALLOWED_PLANS = ['pro', 'max', 'team', 'enterprise'] as const;

/** Whether Claude Code in the sandbox is signed in, and with which account. */
export type ClaudeStatus =
    | { connected: false }
    | {
          connected: true;
          email: string | null;
          /** Claude's `subscriptionType` as reported (`max`, `pro`, …); `null` when it reports none. */
          plan: string | null;
          /** Whether `plan` is one of {@link CLAUDE_ALLOWED_PLANS}; the agent works only when it is. */
          planAllowed: boolean;
      };

/** A Claude sign-in the daemon started. */
export interface ClaudeLoginStartResult {
    /** Claude's sign-in page; the app opens it in the system browser. It shows the code to paste back. */
    url: string;
}

/** The code the person pasted from Claude's sign-in page. */
export interface ClaudeLoginCompleteInput {
    /** As Claude shows it: `<code>#<state>`. */
    code: string;
}

/** How a pasted code ended. */
export type ClaudeLoginResult =
    | { outcome: 'connected'; email: string | null; plan: string | null }
    /** Signed in, but with a plan the agent cannot use; the app offers to sign in with another account. */
    | { outcome: 'planNotAllowed'; email: string | null; plan: string | null }
    /**
     * Claude did not accept the code. `url` is the sign-in to use from now on: the same one when Claude still waits for
     * a code (the code was malformed), a new one when Claude ended the sign-in, so the page must be opened again.
     */
    | { outcome: 'codeRejected'; url: string }
    /** No sign-in is waiting for a code (cancelled, timed out, or the daemon restarted): start a new one. */
    | { outcome: 'expired' };
