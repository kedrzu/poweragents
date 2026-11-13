import { defineService } from '@nzyme/ioc/Service.js';
import { Logger } from '@nzyme/logging/Logger.js';
import { createEventEmitter } from '@nzyme/utils/createEventEmitter.js';
import type { EventEmitter } from '@nzyme/utils/createEventEmitter.js';

import { DAEMON_EVENTS_PATH } from '@poweragents/common/api/DaemonEventTypes.js';
import type { DaemonEvent } from '@poweragents/common/api/DaemonEventTypes.js';

import { DaemonUrl } from './DaemonUrl.js';
import { parseDaemonEvent } from './parseDaemonEvent.js';

/**
 * The daemon's live events, from one connection held for the app's lifetime once started. A connection that opens
 * after one dropped or an attempt failed reports `streamRestored`, as the daemon does when its own feed comes back:
 * events of the gap are lost, so whoever listens reloads what it shows.
 */
export interface DaemonEventStreamShape {
    /** Every event, from the first `start()` on. */
    readonly event: EventEmitter<[event: DaemonEvent]>;
    /** Connects, once however often it is called. */
    start(): void;
}

/** How long to wait before connecting again when the browser gave up on the connection (the daemon refused it). */
const RECONNECT_DELAY_MS = 3_000;

/** The daemon's event stream (`GET /api/events`). */
export const DaemonEventStream = defineService({
    name: 'DaemonEventStream',
    deps: { daemonUrl: DaemonUrl, logger: Logger },
    setup({ daemonUrl, logger }): DaemonEventStreamShape {
        const emitter = createEventEmitter<[event: DaemonEvent]>();
        let started = false;
        /**
         * Whether an attempt to connect failed or a connection dropped since the last open: the next open follows a
         * time without events, also when the very first attempt was refused.
         */
        let interrupted = false;

        return { event: emitter.event, start };

        function start() {
            if (started) {
                return;
            }
            started = true;
            connect();
        }

        function connect() {
            const source = new EventSource(`${daemonUrl}${DAEMON_EVENTS_PATH}`);
            source.addEventListener('open', () => {
                if (interrupted) {
                    interrupted = false;
                    logger.info('Daemon event stream reconnected');
                    emitter.emit({ type: 'streamRestored' });
                }
            });
            source.addEventListener('message', message => {
                const event = parseDaemonEvent(String(message.data));
                if (event) {
                    emitter.emit(event);
                } else {
                    logger.debug('Daemon event ignored');
                }
            });
            source.addEventListener('error', () => {
                interrupted = true;
                // The browser retries a dropped connection by itself; one it closed (an error answer) is retried here.
                if (source.readyState === EventSource.CLOSED) {
                    logger.warn('Daemon event stream closed', { retryInMs: RECONNECT_DELAY_MS });
                    setTimeout(connect, RECONNECT_DELAY_MS);
                }
            });
        }
    },
});
