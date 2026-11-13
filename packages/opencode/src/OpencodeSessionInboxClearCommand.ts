import { defineCommand } from '@nzyme/ioc/Command.js';
import { Logger } from '@nzyme/logging/Logger.js';

import { OpencodeClient } from './OpencodeClient.js';
import { createOpencodeStatusError } from './utils/createOpencodeStatusError.js';

/** A prompt taken back from a session's inbox. */
export interface OpencodeInboxPrompt {
    /** The prompt's id: the receipt's `messageId`, which the message would have been listed under once delivered. */
    id: string;
    text: string;
}

/**
 * Cancels the person's prompts still waiting in the session's inbox (sent while a run was busy and not yet given to the
 * agent) and resolves them, in the order they were sent. OpenCode's own items (synthetic, compaction, move) stay.
 * Call it on an idle session: a running one may deliver a prompt between the listing and its cancel, which OpenCode
 * then ignores, and it would be returned although the agent got it.
 */
export interface OpencodeSessionInboxClearCommandShape {
    (sessionId: string): Promise<OpencodeInboxPrompt[]>;
}

/** Takes back the prompts waiting in a session's inbox. */
export const OpencodeSessionInboxClearCommand = defineCommand({
    name: 'OpencodeSessionInboxClearCommand',
    deps: { client: OpencodeClient, logger: Logger },
    setup({ client, logger }): OpencodeSessionInboxClearCommandShape {
        return async sessionId => {
            const listed = await client({
                method: 'GET',
                path: '/api/session/{sessionID}/inbox',
                pathParams: { sessionID: sessionId },
            });
            if (listed.status !== 200) {
                throw createOpencodeStatusError('listInbox', listed);
            }

            const prompts: OpencodeInboxPrompt[] = [];
            for (const item of listed.data.data) {
                if (item.type !== 'user') {
                    continue;
                }
                const cancelled = await client({
                    method: 'DELETE',
                    path: '/api/session/{sessionID}/inbox/{inboxID}',
                    pathParams: { sessionID: sessionId, inboxID: item.id },
                });
                if (cancelled.status !== 204) {
                    throw createOpencodeStatusError('cancelInbox', cancelled);
                }
                prompts.push({ id: item.id, text: item.payload.text });
            }

            if (prompts.length > 0) {
                logger.info('OpenCode inbox prompts cancelled', { sessionId, count: prompts.length });
            }
            return prompts;
        };
    },
});
