import { expect, test } from 'bun:test';
import { chmod, cp, mkdir, mkdtemp, readdir, readFile, rename, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { EnvVariables } from '@nzyme/ioc/helpers/EnvVariables.js';
import { createTestContainer } from '@nzyme/ioc-testing/createTestContainer.js';

import type { ProjectCreateResult } from '@poweragents/common/api/ProjectTypes.js';

import { ProjectService } from './ProjectService.js';
import type { LocalProject } from './ProjectService.js';

// The filesystem is the boundary: each test gets its own data root in a fresh temporary folder (`<tmp>/root`, so a
// folder escaping it would land in `<tmp>` where the test can see it); `root` is its projects' folder.

test('creates a folder named after the project with its marker, and lists it', async () => {
    const { projects, root } = await setup();

    const result = await projects.create('  Zażółć gęślą  ');

    const created = assertCreated(result);
    expect(created.name).toBe('Zażółć gęślą');
    expect(await readdir(root)).toEqual(['Zażółć gęślą']);
    const marker: unknown = JSON.parse(await readFile(path.join(root, 'Zażółć gęślą', '.project.json'), 'utf8'));
    expect(marker).toMatchObject({ id: created.id, name: 'Zażółć gęślą' });

    const expected: LocalProject[] = [{ id: created.id, name: 'Zażółć gęślą', dir: path.join(root, 'Zażółć gęślą') }];
    expect(await projects.list()).toEqual(expected);
    expect(await projects.get(created.id)).toEqual(expected[0]!);
    expect(await projects.get('unknown')).toBeNull();
});

test('lists only folders with a marker, sorted by name, skipping a broken marker with a warning', async () => {
    const { projects, root, logs } = await setup();
    await projects.create('beta');
    await projects.create('Alfa');
    await mkdir(path.join(root, 'Próba'));
    await writeFile(path.join(root, 'notes.txt'), 'not a project');
    await mkdir(path.join(root, 'Broken'), { recursive: true });
    await writeFile(path.join(root, 'Broken', '.project.json'), '{ "id": ');
    await mkdir(path.join(root, 'Partial'), { recursive: true });
    await writeFile(path.join(root, 'Partial', '.project.json'), '{ "name": "Partial" }');

    const names = (await projects.list()).map(project => project.name);

    expect(names).toEqual(['Alfa', 'beta']);
    const warnings = logs.filter(log => log.level === 'warn').map(log => [log.message, log.data?.folder]);
    expect(warnings).toEqual([
        ['Project marker is not JSON, folder skipped', 'Broken'],
        ['Project marker malformed, folder skipped', 'Partial'],
    ]);
});

test('lists nothing when the data root does not exist yet', async () => {
    const { projects } = await setup();

    expect(await projects.list()).toEqual([]);
});

test('refuses a name another project has, compared case-insensitively', async () => {
    const { projects, root } = await setup();
    await projects.create('Raporty');

    const result = await projects.create(' raporty ');

    const expected: ProjectCreateResult = { nameTaken: true };
    expect(result).toEqual(expected);
    expect(await readdir(root)).toEqual(['Raporty']);
});

test('two creations of one name at once make one project', async () => {
    const { projects } = await setup();

    const results = await Promise.all([projects.create('Raporty'), projects.create('Raporty')]);

    expect(results.filter(result => 'created' in result)).toHaveLength(1);
    expect(results.filter(result => 'nameTaken' in result)).toHaveLength(1);
});

test('refuses an empty, too long or folder-less name and creates nothing', async () => {
    const { projects, tmp } = await setup();

    for (const name of ['', '   ', 'a'.repeat(81), '.', '..', '...', '/', '//', ':', '\u0000', './..', ' . / : ']) {
        const expected: ProjectCreateResult = { invalidName: true };
        expect({ name, result: await projects.create(name) }).toEqual({ name, result: expected });
    }
    expect(await readdir(tmp)).toEqual([]);
});

test("keeps every folder directly inside the projects' folder, whatever the name", async () => {
    const { projects, root, tmp } = await setup();
    const cases: [name: string, folder: string][] = [
        ['../x', 'x'],
        ['/etc/passwd', 'etcpasswd'],
        ['..\\..\\y', 'y'],
        ['.hidden', 'hidden'],
        ['C:\\Users', 'CUsers'],
        ['a/../../b', 'a....b'],
        ['line\nbreak', 'linebreak'],
    ];

    for (const [name, folder] of cases) {
        const created = assertCreated(await projects.create(name));
        expect({ name, dir: (await projects.get(created.id))?.dir }).toEqual({ name, dir: path.join(root, folder) });
    }
    expect(await readdir(tmp)).toEqual(['root']);
    expect(await readdir(path.dirname(root))).toEqual(['projects']);
});

test('never reuses an existing folder, with or without a marker: takes the next free name', async () => {
    const { projects, root } = await setup();
    await mkdir(path.join(root, 'Raporty'), { recursive: true });
    await writeFile(path.join(root, 'Raporty', 'keep.md'), 'mine');
    const other = assertCreated(await projects.create('Inne'));
    await rename(path.join(root, 'Inne'), path.join(root, 'Raporty 2'));
    await writeFile(path.join(root, 'Raporty 3'), 'a file, not a folder');

    const created = assertCreated(await projects.create('Raporty'));

    expect((await projects.get(created.id))?.dir).toBe(path.join(root, 'Raporty 4'));
    expect(await readdir(path.join(root, 'Raporty'))).toEqual(['keep.md']);
    expect(await readFile(path.join(root, 'Raporty', 'keep.md'), 'utf8')).toBe('mine');
    expect(await readFile(path.join(root, 'Raporty 3'), 'utf8')).toBe('a file, not a folder');
    expect(await projects.get(other.id)).toEqual({ id: other.id, name: 'Inne', dir: path.join(root, 'Raporty 2') });
});

test('gives a copied folder, which shares its original id, a new id once and keeps the original untouched', async () => {
    const { projects, root, logs } = await setup();
    const original = assertCreated(await projects.create('Raporty'));
    const originalMarker = await readFile(path.join(root, 'Raporty', '.project.json'), 'utf8');
    await cp(path.join(root, 'Raporty'), path.join(root, 'Raporty copy'), { recursive: true });

    const listed = await projects.list();

    const copy = listed.find(project => project.dir === path.join(root, 'Raporty copy'));
    expect(copy?.id).not.toBe(original.id);
    const expected: LocalProject[] = [
        { id: original.id, name: 'Raporty', dir: path.join(root, 'Raporty') },
        { id: copy?.id ?? '', name: 'Raporty', dir: path.join(root, 'Raporty copy') },
    ];
    expect(listed).toEqual(expected);
    expect(await readFile(path.join(root, 'Raporty', '.project.json'), 'utf8')).toBe(originalMarker);
    const copyMarker: unknown = JSON.parse(await readFile(path.join(root, 'Raporty copy', '.project.json'), 'utf8'));
    const expectedMarker: unknown = { ...JSON.parse(originalMarker), id: copy?.id };
    expect(copyMarker).toEqual(expectedMarker);
    expect(logs.filter(log => log.level === 'info' && log.data?.previousId === original.id)).toHaveLength(1);

    expect(await projects.list()).toEqual(expected);
    expect(logs.filter(log => log.data?.previousId === original.id)).toHaveLength(1);
});

test('listings at once give a copied folder one new id, not one each', async () => {
    const { projects, root } = await setup();
    const original = assertCreated(await projects.create('Raporty'));
    await cp(path.join(root, 'Raporty'), path.join(root, 'Raporty copy'), { recursive: true });

    const listings = await Promise.all([projects.list(), projects.list(), projects.list()]);

    const copyIds = listings.map(listed => listed.find(project => project.dir === path.join(root, 'Raporty copy'))?.id);
    const marker: unknown = JSON.parse(await readFile(path.join(root, 'Raporty copy', '.project.json'), 'utf8'));
    expect(marker).toMatchObject({ id: copyIds[0] });
    expect(copyIds).toEqual([copyIds[0], copyIds[0], copyIds[0]]);
    expect(copyIds[0]).not.toBe(original.id);
});

test('skips a copied folder whose marker cannot be given a new id, and lists the rest', async () => {
    const { projects, root, logs } = await setup();
    const original = assertCreated(await projects.create('Raporty'));
    await cp(path.join(root, 'Raporty'), path.join(root, 'Raporty copy'), { recursive: true });
    await chmod(path.join(root, 'Raporty copy'), 0o555);

    try {
        const listed = await projects.list();

        const expected: LocalProject[] = [{ id: original.id, name: 'Raporty', dir: path.join(root, 'Raporty') }];
        expect(listed).toEqual(expected);
        expect(logs.some(log => log.level === 'warn' && log.data?.folder === 'Raporty copy')).toBe(true);
    } finally {
        await chmod(path.join(root, 'Raporty copy'), 0o755);
    }
});

test('skips a folder whose marker is a link, and never writes through it to the file it points at', async () => {
    const { projects, root, tmp, logs } = await setup();
    const original = assertCreated(await projects.create('Raporty'));
    const originalMarker = await readFile(path.join(root, 'Raporty', '.project.json'), 'utf8');
    // The agent can write in a project's folder: a link carrying the original's id would make it rewrite the target.
    const target = path.join(tmp, 'outside.json');
    await writeFile(target, originalMarker);
    await mkdir(path.join(root, 'Raporty copy'));
    await symlink(target, path.join(root, 'Raporty copy', '.project.json'));

    const listed = await projects.list();

    const expected: LocalProject[] = [{ id: original.id, name: 'Raporty', dir: path.join(root, 'Raporty') }];
    expect(listed).toEqual(expected);
    expect(await readFile(target, 'utf8')).toBe(originalMarker);
    expect(logs.some(log => log.level === 'warn' && log.data?.folder === 'Raporty copy')).toBe(true);
});

test("never lists from or writes into a projects' folder the agent replaced with a link", async () => {
    const { projects, root, tmp, logs } = await setup();
    const outside = path.join(tmp, 'outside');
    await mkdir(path.join(outside, 'Raporty'), { recursive: true });
    const marker = JSON.stringify({ id: 'p1', name: 'Raporty', createdAt: '2026-01-01T00:00:00.000Z' });
    await writeFile(path.join(outside, 'Raporty', '.project.json'), marker);
    await mkdir(path.dirname(root));
    await symlink(outside, root);

    expect(await projects.list()).toEqual([]);
    await expect(projects.create('Nowy')).rejects.toThrow("Projects' folder is not a folder");

    expect(await readdir(outside)).toEqual(['Raporty']);
    expect(await readdir(path.join(outside, 'Raporty'))).toEqual(['.project.json']);
    expect(logs.some(log => log.level === 'warn' && log.message.startsWith("Projects' folder is not a folder"))).toBe(
        true,
    );
});

test('skips a project folder that is a link, and never rewrites the marker it leads to', async () => {
    const { projects, root, tmp } = await setup();
    const original = assertCreated(await projects.create('Raporty'));
    const originalMarker = await readFile(path.join(root, 'Raporty', '.project.json'), 'utf8');
    // A link carrying the original's id would make the listing give the target a new id.
    const outside = path.join(tmp, 'outside');
    await mkdir(outside);
    await writeFile(path.join(outside, '.project.json'), originalMarker);
    await symlink(outside, path.join(root, 'Raporty copy'));

    const listed = await projects.list();

    const expected: LocalProject[] = [{ id: original.id, name: 'Raporty', dir: path.join(root, 'Raporty') }];
    expect(listed).toEqual(expected);
    expect(await readdir(outside)).toEqual(['.project.json']);
    expect(await readFile(path.join(outside, '.project.json'), 'utf8')).toBe(originalMarker);
});

async function setup() {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'poweragents-projects-'));
    const root = path.join(tmp, 'root', 'projects');
    const { container, logs } = createTestContainer();
    container.set(EnvVariables, { POWERAGENTS_DATA_ROOT: path.dirname(root) });
    const projects = container.resolve(ProjectService);
    return { projects, root, tmp, logs };
}

function assertCreated(result: ProjectCreateResult) {
    if (!('created' in result)) {
        throw new Error(`Expected a created project, got ${JSON.stringify(result)}`);
    }
    return result.created;
}
