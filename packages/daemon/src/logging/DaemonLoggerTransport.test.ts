import { chmod, mkdir, mkdtemp, readFile, stat, truncate, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { EnvVariables } from '@nzyme/ioc/helpers/EnvVariables.js';
import { createTestContainer } from '@nzyme/ioc-testing/createTestContainer.js';

import { DaemonLoggerTransport } from './DaemonLoggerTransport.js';

test('writes each entry to the log beside the Lima home, a caught error with its stack', async () => {
    const { transport, logFile } = await setup();
    const error = new TypeError('limactl: no such instance');

    transport('LimaSandbox', 'error', 'Sandbox start failed', { instance: 'poweragents-default', error });
    transport('ApiService', 'info', 'Request served');

    const log = await readFile(logFile, 'utf8');
    expect(log).toMatch(/^\d{4}-\d\d-\d\dT[\d:.]+Z ERROR \[LimaSandbox\] Sandbox start failed \{/);
    expect(log).toContain("instance: 'poweragents-default'");
    expect(log).toContain('TypeError: limactl: no such instance');
    expect(log).toContain(`(${import.meta.path}:`);
    expect(log).toMatch(/\n\S+ INFO \[ApiService\] Request served\n$/);
});

test('moves a log over 10 MB aside on start, and keeps a smaller one', async () => {
    const big = await setup(log => truncate(log, 10 * 1024 * 1024 + 1));
    big.transport(undefined, 'info', 'Daemon listening');

    expect((await readFile(`${big.logFile}.1`)).byteLength).toBe(10 * 1024 * 1024 + 1);
    expect(await readFile(big.logFile, 'utf8')).toMatch(/^\S+ INFO Daemon listening\n$/);

    const small = await setup(log => writeFile(log, 'earlier\n'));
    small.transport(undefined, 'info', 'Daemon listening');

    expect(await readFile(small.logFile, 'utf8')).toMatch(/^earlier\n\S+ INFO Daemon listening\n$/);
});

test('moves the log aside while running once it passes 10 MB', async () => {
    const { transport, logFile } = await setup();

    transport(undefined, 'info', 'x'.repeat(10 * 1024 * 1024));
    transport(undefined, 'info', 'After rotation');

    expect((await readFile(`${logFile}.1`, 'utf8')).length).toBeGreaterThan(10 * 1024 * 1024);
    expect(await readFile(logFile, 'utf8')).toMatch(/^\S+ INFO After rotation\n$/);
});

test('keeps the log folder and file private, tightening ones that were looser', async () => {
    const fresh = await setup();
    fresh.transport(undefined, 'info', 'Daemon listening');
    expect(await modeOf(path.dirname(fresh.logFile))).toBe(0o700);
    expect(await modeOf(fresh.logFile)).toBe(0o600);

    const loose = await setup(async log => {
        await chmod(path.dirname(log), 0o755);
        await chmod(log, 0o644);
    });
    loose.transport(undefined, 'info', 'Daemon listening');
    expect(await modeOf(path.dirname(loose.logFile))).toBe(0o700);
    expect(await modeOf(loose.logFile)).toBe(0o600);
});

async function modeOf(target: string) {
    return (await stat(target)).mode & 0o777;
}

/** A transport whose Lima home is in a fresh folder; `prepare` gets the log's path before the transport opens it. */
async function setup(prepare?: (logFile: string) => Promise<void>) {
    const root = await mkdtemp(path.join(os.tmpdir(), 'poweragents-log-'));
    const logFile = path.join(root, 'logs', 'daemon.log');
    if (prepare) {
        await mkdir(path.dirname(logFile));
        await writeFile(logFile, '');
        await prepare(logFile);
    }

    const { container } = createTestContainer();
    container.set(EnvVariables, { POWERAGENTS_LIMA_HOME: path.join(root, 'lima') });
    return { transport: container.resolve(DaemonLoggerTransport), logFile };
}
