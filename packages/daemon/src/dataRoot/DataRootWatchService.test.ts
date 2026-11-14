import { afterEach, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { EnvVariables } from '@nzyme/ioc/helpers/EnvVariables.js';
import { createTestContainer } from '@nzyme/ioc-testing/createTestContainer.js';

import type { DataRootEvent } from '@poweragents/common/api/DaemonEventTypes.js';

import { DataRootWatchService } from './DataRootWatchService.js';
import type { DataRootWatchServiceShape } from './DataRootWatchService.js';

// The filesystem is the boundary: a real watcher on a fresh temporary data root.

/** Every test's listeners, removed after it so that its watcher is closed. */
const unsubscribes: (() => void)[] = [];

afterEach(() => {
    for (const unsubscribe of unsubscribes.splice(0)) {
        unsubscribe();
    }
});

test('sends one event per kind for a burst of changes in projects and the Memory', async () => {
    const { watcher, root } = await setup();
    await mkdir(path.join(root, 'projects'));
    await mkdir(path.join(root, 'memory'));
    const events = listen(watcher);

    await mkdir(path.join(root, 'projects', 'Alfa'));
    await writeFile(path.join(root, 'projects', 'Alfa', '.project.json'), '{}');
    await writeFile(path.join(root, 'memory', 'praca.md'), '# Praca\n');
    await writeFile(path.join(root, 'memory', 'preferencje.md'), '# Preferencje\n');
    await settle();

    expect(events.toSorted((a, b) => a.type.localeCompare(b.type))).toEqual([
        { type: 'memoryChanged' },
        { type: 'projectsChanged' },
    ] satisfies DataRootEvent[]);
});

test("ignores files inside a project and outside both folders, and notices a project folder's rename", async () => {
    const { watcher, root } = await setup();
    await mkdir(path.join(root, 'projects', 'Alfa', 'notatki'), { recursive: true });
    await settle();
    const events = listen(watcher);

    await writeFile(path.join(root, 'projects', 'Alfa', 'notatki', 'plan.md'), 'plan');
    await writeFile(path.join(root, 'projects', 'Alfa', 'raport.md'), 'raport');
    await writeFile(path.join(root, 'notes.txt'), 'elsewhere');
    await settle();
    expect(events).toEqual([]);

    await rename(path.join(root, 'projects', 'Alfa'), path.join(root, 'projects', 'Beta'));
    await settle();
    expect(events).toEqual([{ type: 'projectsChanged' }] satisfies DataRootEvent[]);
});

test('starts the watcher again after it failed', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'poweragents-data-root-'));
    const root = path.join(tmp, 'root');
    // A file where the data root should be: the watcher cannot start.
    await writeFile(root, 'not a folder');
    const { container, logs } = createTestContainer();
    container.set(EnvVariables, { POWERAGENTS_DATA_ROOT: root });
    const events = listen(container.resolve(DataRootWatchService));
    expect(logs.filter(log => log.level === 'warn').map(log => log.message)).toEqual([
        'Data root watcher failed, restarting',
    ]);

    // The restart creates the data root and watches it.
    await rm(root);
    await Bun.sleep(1500);
    const afterRestart = events.toSorted((a, b) => a.type.localeCompare(b.type));
    await mkdir(path.join(root, 'memory'), { recursive: true });
    await writeFile(path.join(root, 'memory', 'praca.md'), '# Praca\n');
    await settle();

    // The restart itself reports both kinds, for changes made during the outage; later changes follow.
    expect(afterRestart).toEqual([{ type: 'memoryChanged' }, { type: 'projectsChanged' }] satisfies DataRootEvent[]);
    expect(events.slice(afterRestart.length)).toEqual([{ type: 'memoryChanged' }] satisfies DataRootEvent[]);
});

async function setup() {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'poweragents-data-root-'));
    const root = path.join(tmp, 'root');
    const { container } = createTestContainer();
    container.set(EnvVariables, { POWERAGENTS_DATA_ROOT: root });
    const watcher = container.resolve(DataRootWatchService);
    // Started by a first listener, so the folders the tests make are watched; macOS reports nothing that happened
    // before the new watcher's stream got going.
    unsubscribes.push(watcher.listen(() => undefined));
    await settle();
    return { watcher, root };
}

function listen(watcher: DataRootWatchServiceShape) {
    const events: DataRootEvent[] = [];
    unsubscribes.push(watcher.listen(event => events.push(event)));
    return events;
}

/** Waits past the watcher's debounce, and the filesystem's own delay in reporting a change. */
function settle() {
    return Bun.sleep(700);
}
