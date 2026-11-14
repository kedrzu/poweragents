import { defineCommand } from '@nzyme/ioc/Command.js';

import { OpencodeClient } from './OpencodeClient.js';
import { createOpencodeStatusError } from './utils/createOpencodeStatusError.js';

/** Params of `OpencodeSessionRenameCommand`. */
export interface OpencodeSessionRenameCommandParams {
    sessionId: string;
    title: string;
}

/** Gives a session its title. */
export interface OpencodeSessionRenameCommandShape {
    (params: OpencodeSessionRenameCommandParams): Promise<void>;
}

/** Renames a session. */
export const OpencodeSessionRenameCommand = defineCommand({
    name: 'OpencodeSessionRenameCommand',
    deps: { client: OpencodeClient },
    setup({ client }): OpencodeSessionRenameCommandShape {
        return async params => {
            const response = await client({
                method: 'PATCH',
                path: '/api/session/{sessionID}',
                pathParams: { sessionID: params.sessionId },
                contentType: 'application/json',
                body: { title: params.title },
            });
            if (response.status !== 204) {
                throw createOpencodeStatusError('rename', response);
            }
        };
    },
});
