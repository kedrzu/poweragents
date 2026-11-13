import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { SandboxStartEndpoint } from '@poweragents/common/api/SandboxStartEndpoint.js';

import { Sandbox } from '../sandbox/Sandbox.js';
import { toSandboxStatus } from './utils/toSandboxStatus.js';

/** Serves `SandboxStartEndpoint`. */
export const SandboxStartEndpointHandler = defineEndpointHandler({
    endpoint: SandboxStartEndpoint,
    deps: { sandbox: Sandbox },
    setup({ sandbox }) {
        return async () => {
            const state = await sandbox.getVerifiedState();
            if (state.status !== 'ready') {
                // Not awaited: a start takes up to minutes, and the app polls its progress. A failure is logged by the
                // sandbox and leaves it `failed`.
                sandbox.start().catch(() => undefined);
            }
            return toSandboxStatus(sandbox.getState());
        };
    },
});
