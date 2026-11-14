import { expect, mock, test } from 'bun:test';
import { mkdir, mkdtemp, readdir, readFile, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { EnvVariables } from '@nzyme/ioc/helpers/EnvVariables.js';
import { createTestContainer } from '@nzyme/ioc-testing/createTestContainer.js';
import { createEventEmitter } from '@nzyme/utils/createEventEmitter.js';

import type { AppSetupStartInput, AppSetupStartResult } from '@poweragents/common/api/AppSetupTypes.js';
import { OpencodeSessionCreateCommand } from '@poweragents/opencode/OpencodeSessionCreateCommand.js';
import type { OpencodeSessionCreateCommandParams } from '@poweragents/opencode/OpencodeSessionCreateCommand.js';
import { OpencodeSessionRenameCommand } from '@poweragents/opencode/OpencodeSessionRenameCommand.js';
import type { OpencodeSessionRenameCommandParams } from '@poweragents/opencode/OpencodeSessionRenameCommand.js';
import { OpencodeSessionSyntheticCommand } from '@poweragents/opencode/OpencodeSessionSyntheticCommand.js';
import type { OpencodeSessionSyntheticCommandParams } from '@poweragents/opencode/OpencodeSessionSyntheticCommand.js';

import { ProjectService } from '../projects/ProjectService.js';
import type { LocalProject } from '../projects/ProjectService.js';
import { Sandbox } from '../sandbox/Sandbox.js';
import type { SandboxState } from '../sandbox/Sandbox.js';
import { AppSetupService } from './AppSetupService.js';

// OpenCode's commands are the boundary; projects are real folders in a fresh temporary data root, and the daemon's
// state sits in a fresh folder above a scratch Lima home.

const INPUT: AppSetupStartInput = { language: 'pl', conversationTitle: 'Poznajmy się' };

test('creates App setup once, starting its onboarding with hidden input, and never again once deleted', async () => {
    const fixture = await setup();

    const first = await fixture.appSetup.start(INPUT);

    const listed = await fixture.projects.list();
    const expectedProjects: LocalProject[] = [
        { id: listed[0]!.id, name: 'App setup', role: 'appSetup', dir: path.join(fixture.root, 'App setup') },
    ];
    expect(listed).toEqual(expectedProjects);
    const expectedFirst: AppSetupStartResult = {
        onboarding: { projectId: listed[0]!.id, conversationId: 'ses_onboarding' },
    };
    expect(first).toEqual(expectedFirst);
    const created: OpencodeSessionCreateCommandParams = {
        directory: '/Poweragents/projects/App setup',
        providerId: 'claude-agent',
        modelId: 'sonnet',
    };
    expect(fixture.createSession).toHaveBeenCalledWith(created);
    const renamed: OpencodeSessionRenameCommandParams = { sessionId: 'ses_onboarding', title: 'Poznajmy się' };
    expect(fixture.rename).toHaveBeenCalledWith(renamed);
    const opening = fixture.synthetic.mock.calls[0]?.[0];
    expect(opening?.sessionId).toBe('ses_onboarding');
    expect(opening?.text).toContain('onboarding skill');
    expect(opening?.text).toContain('greet them in Polish');

    // The person deletes App setup: it does not come back, and nothing else starts.
    await rm(path.join(fixture.root, 'App setup'), { recursive: true });
    const second = await fixture.appSetup.start(INPUT);

    const expectedSecond: AppSetupStartResult = { onboarding: null };
    expect(second).toEqual(expectedSecond);
    expect(await fixture.projects.list()).toEqual([]);
    expect(fixture.createSession).toHaveBeenCalledTimes(1);
    expect(fixture.synthetic).toHaveBeenCalledTimes(1);
});

test('two starts at once make one App setup', async () => {
    const fixture = await setup();

    const results = await Promise.all([fixture.appSetup.start(INPUT), fixture.appSetup.start(INPUT)]);

    expect(results.filter(result => result.onboarding !== null)).toHaveLength(1);
    expect(await readdir(fixture.root)).toEqual(['App setup']);
});

test("never creates App setup through a projects' folder the agent replaced with a link, and tries again later", async () => {
    const fixture = await setup();
    const outside = path.join(fixture.tmp, 'outside');
    await mkdir(outside);
    await mkdir(path.dirname(fixture.root), { recursive: true });
    await symlink(outside, fixture.root);

    await expect(fixture.appSetup.start(INPUT)).rejects.toThrow("Projects' folder is not a folder");

    expect(await readdir(outside)).toEqual([]);
    expect(fixture.createSession).not.toHaveBeenCalled();
    // Nothing remembered: once the folder is a real one, App setup is created.
    await rm(fixture.root);
    const later = await fixture.appSetup.start(INPUT);
    expect(later.onboarding).not.toBeNull();
});

test('counts a project whose marker says App setup as App setup, whatever its name', async () => {
    const fixture = await setup();
    await fixture.projects.create('Konfiguracja', 'appSetup');

    const result = await fixture.appSetup.start(INPUT);

    const expected: AppSetupStartResult = { onboarding: null };
    expect(result).toEqual(expected);
    expect(await readdir(fixture.root)).toEqual(['Konfiguracja']);
    // Remembered: deleting it later does not bring a new one.
    expect(await readFile(fixture.stateFile, 'utf8')).toContain('"appSetupCreatedAt"');
});

async function setup() {
    const { container } = createTestContainer();
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'poweragents-app-setup-'));
    container.set(EnvVariables, {
        POWERAGENTS_DATA_ROOT: path.join(tmp, 'root'),
        POWERAGENTS_LIMA_HOME: path.join(tmp, 'home', 'lima'),
    });
    const state: SandboxState = {
        status: 'ready',
        endpoint: { url: 'http://127.0.0.1:1', username: 'opencode', password: 'pw' },
    };
    container.set(Sandbox, {
        getState: () => state,
        getVerifiedState: () => Promise.resolve(state),
        stateChanged: createEventEmitter<[state: SandboxState]>().event,
        start: () => Promise.resolve(state.endpoint),
        stop: () => Promise.resolve(),
        exec: () => {
            throw new Error('not used');
        },
    });
    const createSession = mock((params: OpencodeSessionCreateCommandParams) =>
        Promise.resolve({ id: 'ses_onboarding', directory: params.directory, createdAt: 1, updatedAt: 1 }),
    );
    const rename = mock((_params: OpencodeSessionRenameCommandParams) => Promise.resolve());
    const synthetic = mock((_params: OpencodeSessionSyntheticCommandParams) => Promise.resolve());
    container.set(OpencodeSessionCreateCommand, createSession);
    container.set(OpencodeSessionRenameCommand, rename);
    container.set(OpencodeSessionSyntheticCommand, synthetic);

    return {
        tmp,
        root: path.join(tmp, 'root', 'projects'),
        stateFile: path.join(tmp, 'home', 'state.json'),
        projects: container.resolve(ProjectService),
        appSetup: container.resolve(AppSetupService),
        createSession,
        rename,
        synthetic,
    };
}
