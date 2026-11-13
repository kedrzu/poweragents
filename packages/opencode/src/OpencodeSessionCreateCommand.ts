import { defineCommand } from '@nzyme/ioc/Command.js';
import { Logger } from '@nzyme/logging/Logger.js';

import { OpencodeClient } from './OpencodeClient.js';
import type { OpencodeSession } from './OpencodeTypes.js';
import { createOpencodeStatusError } from './utils/createOpencodeStatusError.js';
import { mapOpencodeSession } from './utils/mapOpencodeSession.js';

/** Params of `OpencodeSessionCreateCommand`. */
export interface OpencodeSessionCreateCommandParams {
    /** The working directory as the container sees it; OpenCode accepts one that does not exist, so create it first. */
    directory: string;
    /** Always given: a session without a model gets OpenCode's default provider, not the one the daemon connected. */
    providerId: string;
    modelId: string;
}

/** Creates a session bound to a working directory and a model. */
export interface OpencodeSessionCreateCommandShape {
    (params: OpencodeSessionCreateCommandParams): Promise<OpencodeSession>;
}

/** Creates a session. */
export const OpencodeSessionCreateCommand = defineCommand({
    name: 'OpencodeSessionCreateCommand',
    deps: { client: OpencodeClient, logger: Logger },
    setup({ client, logger }): OpencodeSessionCreateCommandShape {
        return async params => {
            const response = await client({
                method: 'POST',
                path: '/api/session',
                contentType: 'application/json',
                body: {
                    location: { directory: params.directory },
                    model: { providerID: params.providerId, id: params.modelId },
                },
            });
            if (response.status !== 200) {
                throw createOpencodeStatusError('createSession', response);
            }
            const session = mapOpencodeSession(response.data.data);
            logger.info('OpenCode session created', { sessionId: session.id, providerId: params.providerId });
            return session;
        };
    },
});
