import { chmod, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { readOrCreatePassword } from './readOrCreatePassword.js';

test('creates the password once, readable by its owner only, and returns the same one afterwards', async () => {
    const dir = path.join(await mkdtemp(path.join(os.tmpdir(), 'password-')), '.poweragents');
    const file = path.join(dir, 'agent-password');

    const first = await readOrCreatePassword(file);
    const second = await readOrCreatePassword(file);

    expect(first).toMatch(/^[\w-]{32}$/);
    expect(second).toBe(first);
    expect(await readFile(file, 'utf8')).toBe(first);
    expect(await getMode(file)).toBe(0o600);
    expect(await getMode(dir)).toBe(0o700);
});

test('tightens a directory and a file created too open', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'password-'));
    await chmod(dir, 0o755);
    const file = path.join(dir, 'agent-password');
    const password = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    await writeFile(file, password, { mode: 0o644 });

    expect(await readOrCreatePassword(file)).toBe(password);
    expect(await getMode(file)).toBe(0o600);
    expect(await getMode(dir)).toBe(0o700);
});

test('replaces a file that holds something else, without returning its content', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'password-'));
    const file = path.join(dir, 'agent-password');
    await writeFile(file, 'not-a-password\n', { mode: 0o644 });

    const password = await readOrCreatePassword(file);

    expect(password).toMatch(/^[\w-]{32}$/);
    expect(await readFile(file, 'utf8')).toBe(password);
    expect(await getMode(file)).toBe(0o600);
});

async function getMode(file: string) {
    return (await stat(file)).mode & 0o777;
}
