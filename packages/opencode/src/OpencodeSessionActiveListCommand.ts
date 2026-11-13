import { defineCommand } from '@nzyme/ioc/Command.js';

import { OpencodeClient } from './OpencodeClient.js';
import { createOpencodeStatusError } from './utils/createOpencodeStatusError.js';

/** The ids of the sessions with a run in progress; every other session is idle. */
export interface OpencodeSessionActiveListCommandShape {
    (): Promise<Set<string>>;
}

/** Lists the sessions that are running. */
export const OpencodeSessionActiveListCommand = defineCommand({
    name: 'OpencodeSessionActiveListCommand',
    deps: { client: OpencodeClient },
    setup({ client }): OpencodeSessionActiveListCommandShape {
        return async () => {
            const response = await client({ method: 'GET', path: '/api/session/active' });
            if (response.status !== 200) {
                throw createOpencodeStatusError('listActiveSessions', response);
            }
            return new Set(Object.keys(response.data.data));
        };
    },
});
