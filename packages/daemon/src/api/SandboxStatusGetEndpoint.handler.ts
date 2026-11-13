import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { SandboxStatusGetEndpoint } from '@poweragents/common/api/SandboxStatusGetEndpoint.js';

import { Sandbox } from '../sandbox/Sandbox.js';
import { toSandboxStatus } from './utils/toSandboxStatus.js';

/** Serves `SandboxStatusGetEndpoint`. */
export const SandboxStatusGetEndpointHandler = defineEndpointHandler({
    endpoint: SandboxStatusGetEndpoint,
    deps: { sandbox: Sandbox },
    setup({ sandbox }) {
        return async () => toSandboxStatus(await sandbox.getVerifiedState());
    },
});
