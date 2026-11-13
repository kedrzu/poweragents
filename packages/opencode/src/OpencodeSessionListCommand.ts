import { defineCommand } from '@nzyme/ioc/Command.js';

import { OpencodeClient } from './OpencodeClient.js';
import type { OpencodeSession } from './OpencodeTypes.js';
import { createOpencodeStatusError } from './utils/createOpencodeStatusError.js';
import { mapOpencodeSession } from './utils/mapOpencodeSession.js';

/**
 * Every top-level session whose working directory is `directory` (as the container sees it), newest first, every page.
 * Sub-sessions (an agent's helpers) and archived sessions are left out.
 */
export interface OpencodeSessionListCommandShape {
    (directory: string): Promise<OpencodeSession[]>;
}

/** The API's page size for this call; it has no documented maximum, so a modest page. */
const PAGE_SIZE = '100';

/** Lists the sessions of a working directory. */
export const OpencodeSessionListCommand = defineCommand({
    name: 'OpencodeSessionListCommand',
    deps: { client: OpencodeClient },
    setup({ client }): OpencodeSessionListCommandShape {
        return async directory => {
            const sessions: OpencodeSession[] = [];
            // The filters go with every page; the order only with the first, as a cursor carries it.
            const filters: OpencodeSessionQuery = { directory, parentID: 'null', archived: 'false', limit: PAGE_SIZE };
            let query: OpencodeSessionQuery = { ...filters, order: 'desc' };

            while (true) {
                const response = await client({ method: 'GET', path: '/api/session', query });
                if (response.status !== 200) {
                    throw createOpencodeStatusError('listSessions', response);
                }

                for (const session of response.data.data) {
                    sessions.push(mapOpencodeSession(session));
                }
                const next = response.data.cursor.next;
                if (next == null) {
                    return sessions;
                }
                query = { ...filters, cursor: next };
            }
        };
    },
});

interface OpencodeSessionQuery {
    directory: string;
    parentID: 'null';
    archived: 'false';
    limit: string;
    order?: 'desc';
    cursor?: string;
}
