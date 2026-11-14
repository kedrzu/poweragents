import { createContainer } from '@nzyme/ioc/Container.js';
import { Logger } from '@nzyme/logging/Logger.js';
import { DAEMON_EVENTS_PATH } from '@poweragents/common/api/DaemonEventTypes.js';
import { DAEMON_API_PATH, DAEMON_PORT } from '@poweragents/common/daemonAddress.js';
import type { DaemonStatus } from '@poweragents/common/daemonAddress.js';

import { ApiService } from './api/ApiService.js';
import { DaemonLoggerTransport } from './logging/DaemonLoggerTransport.js';
import { MemoryService } from './memory/MemoryService.js';
import { LimaSandbox } from './sandbox/LimaSandbox.js';
import { Sandbox } from './sandbox/Sandbox.js';
import { SandboxOpencodeConnection } from './sandbox/SandboxOpencodeConnection.js';

// The daemon's entry point: one container for the whole process.
const container = createContainer();
container.register(DaemonLoggerTransport);
container.register(LimaSandbox);
container.register(SandboxOpencodeConnection);
const logger = container.resolve(Logger);

// Bun prints these to stderr, which the packaged app discards: the log is the only record. They are registered before
// anything else starts, so a failure while the daemon starts is recorded too. The transport writes
// synchronously, so the entry is on disk before an uncaught exception ends the process. A rejection nobody handled
// is logged and the daemon keeps serving, like a failed sandbox start.
process.on('uncaughtException', error => {
    logger.error('Uncaught exception', { error });
    process.exit(1);
});
process.on('unhandledRejection', error => {
    logger.error('Unhandled rejection', { error });
});

const api = container.resolve(ApiService);

// The Memory folder exists before the agent starts, so the agent finds it where its instructions say (design D9). A
// failure is logged and the daemon keeps serving: the agent can still create the folder itself.
await container
    .resolve(MemoryService)
    .ensureFolder()
    .catch((error: unknown) => logger.error('Memory folder could not be created', { error }));

// The sandbox comes up in the background while the daemon already answers. A failure is logged by the sandbox and
// leaves it `failed`; the daemon keeps serving. The VM is deliberately not stopped on exit: the daemon is long-lived,
// and `bun --watch` restarts it on every edit, where a VM stop and start would cost ~14 s each time.
container
    .resolve(Sandbox)
    .start()
    .catch(() => undefined);

// It listens on loopback only: the desktop app reaches it on this machine, and remote clients (the phone) will come
// through the relay, never through an open port. `/status` stays open to any caller: it reveals only that the daemon
// runs. The API admits only the app (`ApiService`).
const server = Bun.serve({
    hostname: '127.0.0.1',
    port: Number(process.env.POWERAGENTS_DAEMON_PORT ?? DAEMON_PORT),
    routes: {
        '/status': () => Response.json({ status: 'ok' } satisfies DaemonStatus),
        // An event stream stays open for as long as the app does: Bun's idle timeout (10 s) must not close it.
        [DAEMON_EVENTS_PATH]: (request, self) => {
            self.timeout(request, 0);
            return api.handle(request);
        },
        [`${DAEMON_API_PATH}*`]: request => api.handle(request),
    },
    fetch: () => new Response('Not found', { status: 404 }),
});

logger.info('Daemon listening', { url: server.url.href });
