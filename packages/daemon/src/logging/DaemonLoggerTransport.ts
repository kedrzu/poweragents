import fs from 'node:fs';
import path from 'node:path';
import { inspect } from 'node:util';

import { defineService } from '@nzyme/ioc/Service.js';
import type { LoggerObject } from '@nzyme/logging/Logger.js';
import type { LoggerLevel } from '@nzyme/logging/LoggerLevel.js';
import { consoleLog, LoggerTransport } from '@nzyme/logging/LoggerTransport.js';

import { POWERAGENTS_LIMA_HOME } from '../env.js';

/** A log that grows past this, at start or while running, is moved to `daemon.log.1`, replacing the previous one. */
const MAX_LOG_BYTES = 10 * 1024 * 1024;

/**
 * The daemon's log: every entry goes to the console, as in development, and to `logs/daemon.log` in the folder above
 * `POWERAGENTS_LIMA_HOME` (`~/.poweragents/logs/daemon.log`), the only record when the desktop app runs the daemon with
 * its output discarded. One line per entry, the time and level first; a caught error is written whole, stack included.
 * The folder is private to the user (0700) and the file too (0600). A log that cannot be opened or written leaves only the console: logging never takes the daemon down.
 */
export const DaemonLoggerTransport = defineService({
    name: 'DaemonLoggerTransport',
    implements: LoggerTransport,
    deps: { limaHome: POWERAGENTS_LIMA_HOME },
    setup({ limaHome }): LoggerTransport {
        const file = path.join(path.dirname(limaHome), 'logs', 'daemon.log');
        let log = openLog();
        if (log === null) {
            return consoleLog;
        }

        return (logger, level, message, obj) => {
            consoleLog(logger, level, message, obj);
            // A re-open that failed after a rotation is tried again on the next entry, so the log never stops for good.
            log ??= openLog();
            if (log === null) {
                return;
            }

            try {
                const line = formatLine({ logger, level, message, obj });
                fs.writeSync(log.fd, line);
                log.bytes += Buffer.byteLength(line);
                if (log.bytes > MAX_LOG_BYTES) {
                    // The daemon runs for weeks: move the full log aside while running, not only at start.
                    fs.closeSync(log.fd);
                    log = openLog();
                }
            } catch (error) {
                console.error('The daemon log could not be written', error);
            }
        };

        /** Opens the log for appending, first moving one over the limit to `daemon.log.1`; null if it cannot be opened. */
        function openLog() {
            try {
                // `mode` applies only to what is created, so an older, looser folder and file are tightened too.
                fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
                fs.chmodSync(path.dirname(file), 0o700);
                if (fs.existsSync(file)) {
                    fs.chmodSync(file, 0o600);
                    if (fs.statSync(file).size > MAX_LOG_BYTES) {
                        fs.renameSync(file, `${file}.1`);
                    }
                }
                const fd = fs.openSync(file, 'a', 0o600);
                return { fd, bytes: fs.fstatSync(fd).size };
            } catch (error) {
                console.error('The daemon log could not be opened', error);
                return null;
            }
        }
    },
});

interface LogLine {
    logger: string | undefined;
    level: LoggerLevel;
    message: string;
    obj: LoggerObject | null | undefined;
}

function formatLine({ logger, level, message, obj }: LogLine) {
    const name = logger ? ` [${logger}]` : '';
    const data = obj ? ` ${inspect(obj, { depth: 6, breakLength: Infinity })}` : '';
    return `${new Date().toISOString()} ${level.toUpperCase()}${name} ${message}${data}\n`;
}
