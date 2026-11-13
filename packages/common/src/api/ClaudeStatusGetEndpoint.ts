import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { ClaudeStatus } from './ClaudeTypes.js';

/**
 * Claude Code's sign-in in the sandbox. Answers 409 (`SandboxNotReady`) while the sandbox is not ready, as every
 * `claude/*` endpoint does.
 */
export const ClaudeStatusGetEndpoint = defineEndpoint<void, ClaudeStatus>({ name: 'claude/status' });
