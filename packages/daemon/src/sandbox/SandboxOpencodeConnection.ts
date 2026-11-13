import { defineService } from '@nzyme/ioc/Service.js';
import { ApplicationError } from '@nzyme/logging/ApplicationError.js';
import { OpencodeConnection } from '@poweragents/opencode/OpencodeConnection.js';

import { Sandbox } from './Sandbox.js';

/** OpenCode as the sandbox runs it: the endpoint of the sandbox's current start, while it is ready. */
export const SandboxOpencodeConnection = defineService({
    name: 'SandboxOpencodeConnection',
    implements: OpencodeConnection,
    deps: { sandbox: Sandbox },
    setup({ sandbox }): OpencodeConnection {
        return { getEndpoint };

        function getEndpoint() {
            const state = sandbox.getState();
            if (state.status !== 'ready') {
                throw new ApplicationError('Sandbox is not ready', { status: state.status });
            }
            return state.endpoint;
        }
    },
});
