import { defineCommand } from '@nzyme/ioc/Command.js';

import { OpencodeClient } from './OpencodeClient.js';
import { createOpencodeStatusError } from './utils/createOpencodeStatusError.js';

/** How to answer a permission request: allow this once, allow it from now on, or refuse. */
export type OpencodePermissionDecision = 'once' | 'always' | 'reject';

/** Params of `OpencodePermissionReplyCommand`. */
export interface OpencodePermissionReplyCommandParams {
    sessionId: string;
    permissionId: string;
    decision: OpencodePermissionDecision;
}

/** Answers a permission request the agent raised (a `permissionAsked` event). */
export interface OpencodePermissionReplyCommandShape {
    (params: OpencodePermissionReplyCommandParams): Promise<void>;
}

/** Answers a permission request. */
export const OpencodePermissionReplyCommand = defineCommand({
    name: 'OpencodePermissionReplyCommand',
    deps: { client: OpencodeClient },
    setup({ client }): OpencodePermissionReplyCommandShape {
        return async params => {
            const response = await client({
                method: 'POST',
                path: '/api/session/{sessionID}/permission/{requestID}/reply',
                pathParams: { sessionID: params.sessionId, requestID: params.permissionId },
                contentType: 'application/json',
                body: { decision: params.decision },
            });
            if (response.status !== 204) {
                throw createOpencodeStatusError('replyPermission', response);
            }
        };
    },
});
