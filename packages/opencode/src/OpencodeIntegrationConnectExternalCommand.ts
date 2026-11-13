import { defineCommand } from '@nzyme/ioc/Command.js';
import { Logger } from '@nzyme/logging/Logger.js';

import { OpencodeClient } from './OpencodeClient.js';
import { createOpencodeStatusError } from './utils/createOpencodeStatusError.js';

/** Params of `OpencodeIntegrationConnectExternalCommand`. */
export interface OpencodeIntegrationConnectExternalCommandParams {
    integrationId: string;
    /** The integration's `external` method, e.g. `claude-login`. */
    methodId: string;
}

/**
 * Connects an integration whose sign-in happens outside OpenCode (Claude Code's own login, for `claude-agent`). Not
 * idempotent: each call adds a connection, so check `OpencodeIntegration.connected` first.
 */
export interface OpencodeIntegrationConnectExternalCommandShape {
    (params: OpencodeIntegrationConnectExternalCommandParams): Promise<void>;
}

/** Connects an integration through its external sign-in. */
export const OpencodeIntegrationConnectExternalCommand = defineCommand({
    name: 'OpencodeIntegrationConnectExternalCommand',
    deps: { client: OpencodeClient, logger: Logger },
    setup({ client, logger }): OpencodeIntegrationConnectExternalCommandShape {
        return async params => {
            const response = await client({
                method: 'POST',
                path: '/api/integration/{integrationID}/connect/external',
                pathParams: { integrationID: params.integrationId },
                contentType: 'application/json',
                body: { methodID: params.methodId },
            });
            if (response.status !== 204) {
                throw createOpencodeStatusError('connectExternalIntegration', response);
            }
            logger.info('OpenCode integration connected', { integrationId: params.integrationId });
        };
    },
});
