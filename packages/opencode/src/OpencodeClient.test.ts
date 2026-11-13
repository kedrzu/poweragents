import { afterAll, expect, test } from 'bun:test';

import { createTestContainer } from '@nzyme/ioc-testing/createTestContainer.js';

import { OpencodeConnection } from './OpencodeConnection.js';
import { OpencodeIntegrationConnectExternalCommand } from './OpencodeIntegrationConnectExternalCommand.js';

// A stand-in OpenCode server on the loopback: the HTTP API is the system boundary.
const PASSWORD = 'pw-must-not-leak-3f9c1a';

const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    routes: {
        '/api/integration/claude-agent/connect/external': {
            POST: request => {
                if (request.headers.get('Authorization') !== `Basic ${btoa(`opencode:${PASSWORD}`)}`) {
                    return new Response('Unauthorized', { status: 401 });
                }
                return Response.json({ _tag: 'UnknownError', message: 'connect failed' }, { status: 500 });
            },
        },
    },
});

afterAll(() => server.stop(true));

test('a failed call names the operation and status, and the password reaches no error or log', async () => {
    const { container, logs } = createTestContainer();
    container.set(OpencodeConnection, {
        getEndpoint: () => ({ url: server.url.origin, username: 'opencode', password: PASSWORD }),
    });
    const connect = container.resolve(OpencodeIntegrationConnectExternalCommand);

    const error: unknown = await connect({ integrationId: 'claude-agent', methodId: 'claude-login' }).catch(
        (caught: unknown) => caught,
    );

    // Status 500, not 401: the password did reach the server, in the Authorization header.
    expect(error).toMatchObject({ message: 'OpenCode connectExternalIntegration failed with status 500' });
    expect(error).toMatchObject({ data: { operation: 'connectExternalIntegration', status: 500 } });
    // `JSON.stringify` of the error serializes its `data`; `String` adds its message.
    const exposed = `${String(error)} ${JSON.stringify(error)} ${JSON.stringify(logs)}`;
    expect(exposed).not.toContain(PASSWORD);
    expect(exposed).not.toContain(btoa(`opencode:${PASSWORD}`));
});
