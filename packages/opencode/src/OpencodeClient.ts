import { defineService } from '@nzyme/ioc/Service.js';
import { createOpenApiFetch } from '@nzyme/openapi/openapi-fetch.js';

import { OpencodeConnection } from './OpencodeConnection.js';
import type { paths } from './schema.gen.js';

/**
 * OpenCode's HTTP API (`/api/*`), typed from its OpenAPI spec. Only the `Opencode*Command`s call it. The password
 * lives only in the `Authorization` header built per request: never in a URL, an error or a log entry.
 */
export const OpencodeClient = defineService({
    name: 'OpencodeClient',
    deps: { connection: OpencodeConnection },
    setup({ connection }) {
        return createOpenApiFetch<paths>({ fetch: fetchOpencode });

        function fetchOpencode(input: string | Request | URL, init?: RequestInit) {
            const endpoint = connection.getEndpoint();
            const headers = new Headers(init?.headers);
            headers.set('Authorization', `Basic ${btoa(`${endpoint.username}:${endpoint.password}`)}`);
            const path = input instanceof Request ? input.url : input;
            return fetch(new URL(path, endpoint.url), { ...init, headers });
        }
    },
});
