import { defineCommand } from '@nzyme/ioc/Command.js';
import { Logger } from '@nzyme/logging/Logger.js';

import { OpencodeClient } from './OpencodeClient.js';
import { createOpencodeStatusError } from './utils/createOpencodeStatusError.js';

/**
 * Stops the session's run; resolves `true` when a run was stopped and `false` when the session was idle. Prompts still
 * waiting in the session's inbox are not started.
 */
export interface OpencodeSessionInterruptCommandShape {
    (sessionId: string): Promise<boolean>;
}

/** Interrupts a session's run. */
export const OpencodeSessionInterruptCommand = defineCommand({
    name: 'OpencodeSessionInterruptCommand',
    deps: { client: OpencodeClient, logger: Logger },
    setup({ client, logger }): OpencodeSessionInterruptCommandShape {
        return async sessionId => {
            const response = await client({
                method: 'POST',
                path: '/api/session/{sessionID}/interrupt',
                pathParams: { sessionID: sessionId },
                query: { resume: 'false' },
            });
            if (response.status !== 200) {
                throw createOpencodeStatusError('interrupt', response);
            }
            const interrupted = response.data.interrupted;
            logger.info('OpenCode session interrupted', { sessionId, interrupted });
            return interrupted;
        };
    },
});
