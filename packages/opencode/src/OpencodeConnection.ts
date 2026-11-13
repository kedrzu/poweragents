import { defineInterface } from '@nzyme/ioc/Interface.js';

/** Where OpenCode answers and its HTTP basic-auth credentials. */
export interface OpencodeEndpoint {
    url: string;
    username: string;
    /** Never log it: the client puts it only in the `Authorization` header it builds per request. */
    password: string;
}

/**
 * How the client reaches OpenCode. The host provides it: the endpoint can change between calls (a new password on each
 * start of the server), so it is read per request.
 */
export interface OpencodeConnection {
    /** Throws when OpenCode is not reachable now. */
    getEndpoint(): OpencodeEndpoint;
}

/** The OpenCode server the client talks to. */
export const OpencodeConnection = defineInterface<OpencodeConnection>({ name: 'OpencodeConnection' });
