import { expect, test } from 'bun:test';
import { mkdir, mkdtemp, readdir, rm, symlink, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { EnvVariables } from '@nzyme/ioc/helpers/EnvVariables.js';
import { createTestContainer } from '@nzyme/ioc-testing/createTestContainer.js';

import type { MemoryFile, MemoryFileGetResult } from '@poweragents/common/api/MemoryTypes.js';

import { MemoryService } from './MemoryService.js';

// The filesystem is the boundary: each test gets its own data root in a fresh temporary folder, with a secret file
// beside it (`<tmp>/secret.md`) that no path or link may reach.

test('creates the Memory folder once, keeping what is in it', async () => {
    const { memory, root } = await setup();

    await memory.ensureFolder();
    await writeFile(path.join(root, 'memory', 'praca.md'), '# Praca\n');
    await memory.ensureFolder();

    expect(await readdir(path.join(root, 'memory'))).toEqual(['praca.md']);
});

test('lists Markdown files in folders by path, titled by their first heading or their name', async () => {
    const { memory, root } = await setup();
    const dir = path.join(root, 'memory');
    await mkdir(path.join(dir, 'zdrowie'), { recursive: true });
    await writeFile(path.join(dir, 'praca.md'), 'Wstęp\n\n## Praca architekta ##\n\n# Później\n');
    await writeFile(path.join(dir, 'zdrowie', 'skóra.MD'), 'bez nagłówka');
    await writeFile(path.join(dir, 'zdjęcie.png'), 'not markdown');
    await writeFile(path.join(dir, '.ukryty.md'), '# Hidden');
    await mkdir(path.join(dir, '.git'));
    await writeFile(path.join(dir, '.git', 'HEAD.md'), '# Hidden');
    await utimes(path.join(dir, 'praca.md'), 1_700_000_000, 1_700_000_000);
    await utimes(path.join(dir, 'zdrowie', 'skóra.MD'), 1_700_000_100, 1_700_000_100);

    const files = await memory.list();

    const expected: MemoryFile[] = [
        { path: 'praca.md', title: 'Praca architekta', updatedAt: 1_700_000_000_000 },
        { path: 'zdrowie/skóra.MD', title: 'skóra', updatedAt: 1_700_000_100_000 },
    ];
    expect(files).toEqual(expected);
});

test('lists nothing when the Memory folder is missing', async () => {
    const { memory } = await setup();

    expect(await memory.list()).toEqual([]);
});

test('reads a file by its listed path', async () => {
    const { memory, root } = await setup();
    await mkdir(path.join(root, 'memory', 'zdrowie'), { recursive: true });
    await writeFile(path.join(root, 'memory', 'zdrowie', 'skóra.md'), '# Skóra\n\nCera sucha.\n');
    await utimes(path.join(root, 'memory', 'zdrowie', 'skóra.md'), 1_700_000_000, 1_700_000_000);

    const result = await memory.get('zdrowie/skóra.md');

    const expected: MemoryFileGetResult = {
        file: {
            path: 'zdrowie/skóra.md',
            title: 'Skóra',
            updatedAt: 1_700_000_000_000,
            content: '# Skóra\n\nCera sucha.\n',
        },
    };
    expect(result).toEqual(expected);
    expect(await memory.get('zdrowie/brak.md')).toEqual({ notFound: true });
});

test('refuses paths leading out of the Memory folder, hidden files and files that are not Markdown', async () => {
    const { memory, root, tmp } = await setup();
    await mkdir(path.join(root, 'memory', 'zdrowie'), { recursive: true });
    await writeFile(path.join(root, 'memory', 'notatka.txt'), 'not markdown');
    await writeFile(path.join(root, 'memory', '.ukryty.md'), '# Hidden');
    await writeFile(path.join(root, 'outside.md'), '# Outside');

    const paths = [
        '../secret.md',
        '../../secret.md',
        'zdrowie/../../outside.md',
        '..\\outside.md',
        path.join(tmp, 'secret.md'),
        '/etc/passwd.md',
        'C:\\secret.md',
        '',
        './zdrowie/../.ukryty.md',
        '.ukryty.md',
        'notatka.txt',
        'zdrowie//x.md',
        'praca.md\0.md',
    ];
    for (const relativePath of paths) {
        expect({ relativePath, result: await memory.get(relativePath) }).toEqual({
            relativePath,
            result: { notFound: true },
        });
    }
});

test('never follows a link out of the Memory folder: not a file link, a folder link or a linked Memory folder', async () => {
    const { memory, root, tmp } = await setup();
    const dir = path.join(root, 'memory');
    await mkdir(dir, { recursive: true });
    await symlink(path.join(tmp, 'secret.md'), path.join(dir, 'link.md'));
    await mkdir(path.join(tmp, 'elsewhere'));
    await writeFile(path.join(tmp, 'elsewhere', 'secret.md'), '# Secret');
    await symlink(path.join(tmp, 'elsewhere'), path.join(dir, 'folder'));

    expect(await memory.list()).toEqual([]);
    expect(await memory.get('link.md')).toEqual({ notFound: true });
    expect(await memory.get('folder/secret.md')).toEqual({ notFound: true });

    // The agent can replace the whole Memory folder with a link.
    const linked = await setup();
    await symlink(path.join(linked.tmp, 'elsewhere'), path.join(linked.root, 'memory'));
    await mkdir(path.join(linked.tmp, 'elsewhere'));
    await writeFile(path.join(linked.tmp, 'elsewhere', 'secret.md'), '# Secret');

    expect(await linked.memory.list()).toEqual([]);
    expect(await linked.memory.get('secret.md')).toEqual({ notFound: true });
});

test('never opens a pipe: not listed, not read', async () => {
    const { memory, root } = await setup();
    await mkdir(path.join(root, 'memory'));
    await writeFile(path.join(root, 'memory', 'praca.md'), '# Praca\n');
    // Opening a pipe for reading waits for a writer: the daemon would hang.
    const mkfifo = Bun.spawn(['mkfifo', path.join(root, 'memory', 'pipe.md')]);
    expect(await mkfifo.exited).toBe(0);

    expect((await memory.list()).map(file => file.path)).toEqual(['praca.md']);
    expect(await memory.get('pipe.md')).toEqual({ notFound: true });
});

test('lists a large file by a heading at its start, and refuses to read it whole', async () => {
    const { memory, root } = await setup();
    await mkdir(path.join(root, 'memory'));
    await writeFile(path.join(root, 'memory', 'duży.md'), `# Duży\n${'x'.repeat(1024 * 1024)}`);
    // A heading past the first few kilobytes is not looked for: the file is titled by its name.
    await writeFile(path.join(root, 'memory', 'późny.md'), `${'tekst\n'.repeat(1000)}# Późny\n`);

    expect((await memory.list()).map(file => file.title)).toEqual(['Duży', 'późny']);
    expect(await memory.get('duży.md')).toEqual({ tooLarge: true });
});

test('skips folders removed while the listing runs', async () => {
    const { memory, root } = await setup();
    const folders = Array.from({ length: 200 }, (_, index) => path.join(root, 'memory', `folder ${index}`));
    for (const folder of folders) {
        await mkdir(folder, { recursive: true });
        await writeFile(path.join(folder, 'notatka.md'), '# Notatka\n');
    }

    const listing = memory.list();
    // From the last: the listing has read the Memory folder by then, and reaches these folders after they are gone.
    for (const folder of folders.toReversed()) {
        await rm(folder, { recursive: true });
    }

    expect((await listing).length).toBeLessThan(folders.length);
});

async function setup() {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'poweragents-memory-'));
    const root = path.join(tmp, 'root');
    await mkdir(root);
    await writeFile(path.join(tmp, 'secret.md'), '# Secret');
    const { container, logs } = createTestContainer();
    container.set(EnvVariables, { POWERAGENTS_DATA_ROOT: root });
    return { memory: container.resolve(MemoryService), root, tmp, logs };
}
