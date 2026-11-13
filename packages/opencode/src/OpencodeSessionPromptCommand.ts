import { defineCommand } from '@nzyme/ioc/Command.js';

import { OpencodeClient } from './OpencodeClient.js';
import { createOpencodeStatusError } from './utils/createOpencodeStatusError.js';

/** Params of `OpencodeSessionPromptCommand`. */
export interface OpencodeSessionPromptCommandParams {
    sessionId: string;
    text: string;
}

/** A prompt OpenCode has admitted into a session. */
export interface OpencodePromptReceipt {
    /** The id of the prompt's message among the session's messages. */
    messageId: string;
    /** When it was admitted (server clock, epoch ms). */
    admittedAt: number;
}

/** Admits a prompt into the session and starts a run; does not wait for the agent. */
export interface OpencodeSessionPromptCommandShape {
    (params: OpencodeSessionPromptCommandParams): Promise<OpencodePromptReceipt>;
}

/** Prompts a session. */
export const OpencodeSessionPromptCommand = defineCommand({
    name: 'OpencodeSessionPromptCommand',
    deps: { client: OpencodeClient },
    setup({ client }): OpencodeSessionPromptCommandShape {
        return async params => {
            const response = await client({
                method: 'POST',
                path: '/api/session/{sessionID}/prompt',
                pathParams: { sessionID: params.sessionId },
                contentType: 'application/json',
                body: { text: params.text },
            });
            if (response.status !== 200) {
                throw createOpencodeStatusError('prompt', response);
            }
            const receipt = response.data.data;
            return { messageId: receipt.id, admittedAt: receipt.time.created };
        };
    },
});
