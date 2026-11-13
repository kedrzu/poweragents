import { defineService } from '@nzyme/ioc/Service.js';
import { createClient } from '@nzyme/rpc/createClient.js';
import type { RpcCallFunction } from '@nzyme/rpc/createClient.js';

import { DAEMON_API_PATH } from '@poweragents/common/daemonAddress.js';

import { DaemonUrl } from './DaemonUrl.js';

/**
 * Calls the daemon's API: `client(Endpoint, input)`. Throws an `HttpError` (`@nzyme/fetch-utils`) on an error answer
 * and a `TypeError` when the daemon is not listening.
 */
export type DaemonClientShape = RpcCallFunction;

/** The app's client of the daemon's API; the daemon serves it for the app's origin only. */
export const DaemonClient = defineService({
    name: 'DaemonClient',
    deps: { daemonUrl: DaemonUrl },
    setup({ daemonUrl }): DaemonClientShape {
        return createClient({
            request: endpoint => ({ url: `${daemonUrl}${DAEMON_API_PATH}${endpoint.name}` }),
        });
    },
});
