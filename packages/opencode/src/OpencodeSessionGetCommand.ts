import { defineCommand } from '@nzyme/ioc/Command.js';

import { OpencodeClient } from './OpencodeClient.js';
import type { OpencodeSession } from './OpencodeTypes.js';
import { createOpencodeStatusError } from './utils/createOpencodeStatusError.js';
import { mapOpencodeSession } from './utils/mapOpencodeSession.js';

/** The session with this id, or `null` when OpenCode has none. */
export interface OpencodeSessionGetCommandShape {
    (sessionId: string): Promise<OpencodeSession | null>;
}

/** Reads a session. */
export const OpencodeSessionGetCommand = defineCommand({
    name: 'OpencodeSessionGetCommand',
    deps: { client: OpencodeClient },
    setup({ client }): OpencodeSessionGetCommandShape {
        return async sessionId => {
            const response = await client({
                method: 'GET',
                path: '/api/session/{sessionID}',
                pathParams: { sessionID: sessionId },
            });
            switch (response.status) {
                case 200:
                    return mapOpencodeSession(response.data.data);
                case 404:
                    return null;
                default:
                    throw createOpencodeStatusError('getSession', response);
            }
        };
    },
});
