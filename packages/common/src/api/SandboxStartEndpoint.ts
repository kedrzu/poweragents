import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { SandboxStatus } from './SandboxTypes.js';

/**
 * Starts the sandbox (or retries a failed start) without waiting for it, and returns the status it moved to; poll
 * `sandbox/status` for the rest. Joins a start already running; does nothing to a ready sandbox.
 */
export const SandboxStartEndpoint = defineEndpoint<void, SandboxStatus>({ name: 'sandbox/start' });
