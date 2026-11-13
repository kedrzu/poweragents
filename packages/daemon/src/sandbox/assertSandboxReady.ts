import { HttpError } from '@nzyme/fetch-utils/HttpError.js';

import type { Sandbox } from './Sandbox.js';

/**
 * Throws an `HttpError` 409 (`SandboxNotReady`) unless the sandbox is ready: the app shows the sandbox's progress
 * instead of a failure.
 * @util
 */
export function assertSandboxReady(sandbox: Sandbox) {
    const state = sandbox.getState();
    if (state.status !== 'ready') {
        throw new HttpError(409, { error: 'SandboxNotReady', message: 'The sandbox is not ready' });
    }
}
