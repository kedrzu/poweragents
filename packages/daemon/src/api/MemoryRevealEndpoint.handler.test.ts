import { expect, mock, test } from 'bun:test';
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { EnvVariables } from '@nzyme/ioc/helpers/EnvVariables.js';
import { createTestContainer } from '@nzyme/ioc-testing/createTestContainer.js';
import type { HttpRequest } from '@nzyme/rpc/types/HttpRequest.js';

import type { MemoryRevealInput, MemoryRevealResult } from '@poweragents/common/api/MemoryTypes.js';

import { RevealInFileManagerCommand } from '../host/RevealInFileManagerCommand.js';
import type {
    RevealInFileManagerCommandParams,
    RevealInFileManagerCommandResult,
} from '../host/RevealInFileManagerCommand.js';
import { MemoryRevealEndpointHandler } from './MemoryRevealEndpoint.handler.js';

// The file manager is the outside world: it is replaced by a mock, and the test proves which paths ever reach it.

test('shows the Memory folder, or a Memory file selected in it', async () => {
    const { reveal, revealPath, root } = await setup();
    const dir = path.join(root, 'memory');
    await mkdir(path.join(dir, 'zdrowie'), { recursive: true });
    await writeFile(path.join(dir, 'zdrowie', 'skóra.md'), '# Skóra\n');

    expect(await reveal({})).toEqual({ revealed: true });
    expect(await reveal({ path: 'zdrowie/skóra.md' })).toEqual({ revealed: true });

    const expected: RevealInFileManagerCommandParams[] = [
        { path: dir, kind: 'folder' },
        { path: path.join(dir, 'zdrowie', 'skóra.md'), kind: 'file' },
    ];
    expect(revealPath.mock.calls.map(([params]) => params)).toEqual(expected);
});

test('never shows a path outside the Memory folder, a link, a hidden file or a missing one', async () => {
    const { reveal, revealPath, root, tmp } = await setup();
    const dir = path.join(root, 'memory');
    await mkdir(dir);
    await writeFile(path.join(dir, '.ukryty.md'), '# Hidden');
    await writeFile(path.join(dir, 'notatka.txt'), 'not markdown');
    await symlink(path.join(tmp, 'secret.md'), path.join(dir, 'link.md'));

    const paths = [
        '../secret.md',
        '../../secret.md',
        '..\\secret.md',
        path.join(tmp, 'secret.md'),
        'C:\\secret.md',
        '',
        '.ukryty.md',
        'notatka.txt',
        'link.md',
        'brak.md',
    ];
    for (const relativePath of paths) {
        const expected: MemoryRevealResult = { notFound: true };
        expect({ relativePath, result: await reveal({ path: relativePath }) }).toEqual({
            relativePath,
            result: expected,
        });
    }
    expect(revealPath).not.toHaveBeenCalled();
});

test('never shows a Memory folder that is missing or a link', async () => {
    const missing = await setup();
    expect(await missing.reveal({})).toEqual({ notFound: true });

    const linked = await setup();
    await mkdir(path.join(linked.tmp, 'elsewhere'));
    await symlink(path.join(linked.tmp, 'elsewhere'), path.join(linked.root, 'memory'));
    expect(await linked.reveal({})).toEqual({ notFound: true });

    expect(missing.revealPath).not.toHaveBeenCalled();
    expect(linked.revealPath).not.toHaveBeenCalled();
});

test('reports a system whose file manager it cannot open', async () => {
    const { reveal, root } = await setup('unsupported');
    await mkdir(path.join(root, 'memory'));

    expect(await reveal({})).toEqual({ unsupported: true });
});

async function setup(outcome: RevealInFileManagerCommandResult = 'revealed') {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'poweragents-reveal-'));
    const root = path.join(tmp, 'root');
    await mkdir(root);
    await writeFile(path.join(tmp, 'secret.md'), '# Secret');
    const { container } = createTestContainer();
    container.set(EnvVariables, { POWERAGENTS_DATA_ROOT: root });
    const revealPath = mock((_params: RevealInFileManagerCommandParams) => Promise.resolve(outcome));
    container.set(RevealInFileManagerCommand, revealPath);
    const handler = container.resolve(MemoryRevealEndpointHandler);
    const request: HttpRequest = { method: 'POST', path: '/api/memory/reveal', headers: {}, body: '', ip: '127.0.0.1' };
    const reveal = (input: MemoryRevealInput) => handler(input, { request });
    return { reveal, revealPath, root, tmp };
}
