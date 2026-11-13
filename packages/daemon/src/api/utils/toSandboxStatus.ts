import type { SandboxStatus } from '@poweragents/common/api/SandboxTypes.js';

import type { SandboxState } from '../../sandbox/Sandbox.js';

/**
 * The sandbox's state as the API reports it: without the agent's endpoint, whose password must never leave the daemon.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function toSandboxStatus(state: SandboxState): SandboxStatus {
    switch (state.status) {
        case 'ready':
            return { status: 'ready' };
        case 'failed':
            return { status: 'failed', message: state.message };
        default:
            return { status: state.status };
    }
}
