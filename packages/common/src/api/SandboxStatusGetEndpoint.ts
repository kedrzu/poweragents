import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { SandboxStatus } from './SandboxTypes.js';

/**
 * The sandbox's status; `ready` only while its agent answers (the daemon re-checks it and starts the sandbox again when
 * it does not). Polled by the app while the environment is being prepared.
 */
export const SandboxStatusGetEndpoint = defineEndpoint<void, SandboxStatus>({ name: 'sandbox/status' });
