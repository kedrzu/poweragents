import { DAEMON_PORT } from '@poweragents/common/daemonAddress.js';
import type { DaemonStatus } from '@poweragents/common/daemonAddress.js';

// The daemon's entry point. It listens on loopback only: the desktop app reaches it on this machine, and
// remote clients (the phone) will come through the relay, never through an open port.
const server = Bun.serve({
    hostname: '127.0.0.1',
    port: Number(process.env.POWERAGENTS_DAEMON_PORT ?? DAEMON_PORT),
    routes: {
        '/status': () => Response.json({ status: 'ok' } satisfies DaemonStatus),
    },
    fetch: () => new Response('Not found', { status: 404 }),
});

console.log(`poweragents daemon listening on ${server.url.href}`);
