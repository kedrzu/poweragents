import { defineCommand } from '@nzyme/ioc/Command.js';

import { OpencodeClient } from './OpencodeClient.js';
import { createOpencodeStatusError } from './utils/createOpencodeStatusError.js';

/** An integration: a provider's sign-in. */
export interface OpencodeIntegration {
    id: string;
    name: string;
    /** Whether a connection exists; connecting again adds another one. */
    connected: boolean;
}

/**
 * An integration by id; `undefined` when OpenCode does not know it — also for a moment after the server starts
 * answering, before it has loaded its integrations.
 */
export interface OpencodeIntegrationGetCommandShape {
    (integrationId: string): Promise<OpencodeIntegration | undefined>;
}

/** Reads an integration and its connections. */
export const OpencodeIntegrationGetCommand = defineCommand({
    name: 'OpencodeIntegrationGetCommand',
    deps: { client: OpencodeClient },
    setup({ client }): OpencodeIntegrationGetCommandShape {
        return async integrationId => {
            const response = await client({
                method: 'GET',
                path: '/api/integration/{integrationID}',
                pathParams: { integrationID: integrationId },
            });
            switch (response.status) {
                case 200: {
                    const integration = response.data.data;
                    return {
                        id: integration.id,
                        name: integration.name,
                        connected: integration.connections.length > 0,
                    };
                }
                case 404:
                    return undefined;
                default:
                    throw createOpencodeStatusError('getIntegration', response);
            }
        };
    },
});
