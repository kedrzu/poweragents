import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { ClaudeLoginCompleteInput, ClaudeLoginResult } from './ClaudeTypes.js';
import { createInputSchema } from './utils/createInputSchema.js';

const input = createInputSchema<ClaudeLoginCompleteInput>('{ code: string }', value =>
    'code' in value && typeof value.code === 'string' ? { code: value.code } : undefined,
);

/** Gives the waiting Claude sign-in the code the person pasted, and reports how it ended. */
export const ClaudeLoginCompleteEndpoint = defineEndpoint<ClaudeLoginCompleteInput, ClaudeLoginResult>({
    name: 'claude/login/complete',
    input,
});
