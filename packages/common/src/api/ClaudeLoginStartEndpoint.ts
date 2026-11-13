import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { ClaudeLoginStartResult } from './ClaudeTypes.js';

/**
 * Starts a Claude sign-in and returns its page. Always a new sign-in: one already waiting is ended, so "open again"
 * should reopen the URL it has rather than call this. A sign-in waits for its code for 10 minutes.
 */
export const ClaudeLoginStartEndpoint = defineEndpoint<void, ClaudeLoginStartResult>({ name: 'claude/login/start' });
