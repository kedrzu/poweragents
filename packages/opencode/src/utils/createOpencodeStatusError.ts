import { ApplicationError } from '@nzyme/logging/ApplicationError.js';

/** A response of `OpencodeClient` an operation does not expect. */
export interface OpencodeUnexpectedResponse {
    status: number;
    data: unknown;
}

/**
 * The error for a status an OpenCode operation does not handle. The message names only the operation and status; the
 * response body (OpenCode's error, for diagnosis) goes in the data.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function createOpencodeStatusError(operation: string, response: OpencodeUnexpectedResponse) {
    return new ApplicationError(`OpenCode ${operation} failed with status ${response.status}`, {
        operation,
        status: response.status,
        body: response.data,
    });
}
