import { expect, mock, test } from 'bun:test';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { EnvVariables } from '@nzyme/ioc/helpers/EnvVariables.js';
import { createTestContainer } from '@nzyme/ioc-testing/createTestContainer.js';
import { createEventEmitter } from '@nzyme/utils/createEventEmitter.js';

import type {
    Conversation,
    ConversationMessagePage,
    ConversationSendResult,
    ConversationStopResult,
} from '@poweragents/common/api/ConversationTypes.js';
import type { Project, ProjectCreateResult } from '@poweragents/common/api/ProjectTypes.js';
import { OpencodeMessageListCommand } from '@poweragents/opencode/OpencodeMessageListCommand.js';
import type {
    OpencodeMessageListCommandParams,
    OpencodeMessagePage,
} from '@poweragents/opencode/OpencodeMessageListCommand.js';
import { OpencodeSessionActiveListCommand } from '@poweragents/opencode/OpencodeSessionActiveListCommand.js';
import { OpencodeSessionCreateCommand } from '@poweragents/opencode/OpencodeSessionCreateCommand.js';
import type { OpencodeSessionCreateCommandParams } from '@poweragents/opencode/OpencodeSessionCreateCommand.js';
import { OpencodeSessionGetCommand } from '@poweragents/opencode/OpencodeSessionGetCommand.js';
import { OpencodeSessionInboxClearCommand } from '@poweragents/opencode/OpencodeSessionInboxClearCommand.js';
import type { OpencodeInboxPrompt } from '@poweragents/opencode/OpencodeSessionInboxClearCommand.js';
import { OpencodeSessionInterruptCommand } from '@poweragents/opencode/OpencodeSessionInterruptCommand.js';
import { OpencodeSessionListCommand } from '@poweragents/opencode/OpencodeSessionListCommand.js';
import { OpencodeSessionPromptCommand } from '@poweragents/opencode/OpencodeSessionPromptCommand.js';
import type {
    OpencodePromptReceipt,
    OpencodeSessionPromptCommandParams,
} from '@poweragents/opencode/OpencodeSessionPromptCommand.js';
import type { OpencodeSession } from '@poweragents/opencode/OpencodeTypes.js';

import { ProjectService } from '../projects/ProjectService.js';
import { Sandbox } from '../sandbox/Sandbox.js';
import type { SandboxState } from '../sandbox/Sandbox.js';
import { ConversationService } from './ConversationService.js';

// OpenCode's commands are the boundary: they stand in for its HTTP API, in the shapes the commands return. Projects are
// real folders in a fresh temporary data root.

test("lists the project's conversations only, the most recently changed first, with whether each runs", async () => {
    const fixture = await setup();
    fixture.sessions.push(
        session('ses_old', fixture.dirA, { title: 'Stara', updatedAt: 10 }),
        session('ses_new', fixture.dirA, { updatedAt: 30 }),
        // OpenCode's directory filter failing must not leak another project's conversation.
        session('ses_other', fixture.dirB, { title: 'Cudza', updatedAt: 20 }),
    );
    fixture.active.add('ses_new');

    const conversations = await fixture.conversations.list(fixture.projectA.id);

    expect(fixture.listSessions).toHaveBeenCalledWith(fixture.dirA);
    const expected: Conversation[] = [
        { id: 'ses_new', updatedAt: 30, running: true },
        { id: 'ses_old', title: 'Stara', updatedAt: 10, running: false },
    ];
    expect(conversations).toEqual(expected);
});

test("creates a conversation in the project's folder on Claude Sonnet", async () => {
    const fixture = await setup();

    const conversation = await fixture.conversations.create(fixture.projectA.id);

    const params: OpencodeSessionCreateCommandParams = {
        directory: fixture.dirA,
        providerId: 'claude-agent',
        modelId: 'sonnet',
    };
    expect(fixture.createSession).toHaveBeenCalledWith(params);
    const expected: Conversation = { id: 'ses_created', updatedAt: 1, running: false };
    expect(conversation).toEqual(expected);
});

test('reports a message sent while the agent works as queued, and one sent to an idle conversation as not', async () => {
    const fixture = await setup();
    fixture.sessions.push(session('ses_1', fixture.dirA));
    const ref = { projectId: fixture.projectA.id, conversationId: 'ses_1' };

    const idle = await fixture.conversations.send({ ...ref, text: 'Pierwsza' });
    fixture.active.add('ses_1');
    const busy = await fixture.conversations.send({ ...ref, text: 'Druga' });

    const expectedIdle: ConversationSendResult = { queued: false, messageId: 'msg_Pierwsza' };
    const expectedBusy: ConversationSendResult = { queued: true, messageId: 'msg_Druga' };
    expect(idle).toEqual(expectedIdle);
    expect(busy).toEqual(expectedBusy);
    const expected: OpencodeSessionPromptCommandParams = { sessionId: 'ses_1', text: 'Druga' };
    expect(fixture.prompt).toHaveBeenLastCalledWith(expected);
});

test('stops a run after the interrupt, withdrawing the messages still waiting for the agent', async () => {
    const fixture = await setup();
    fixture.sessions.push(session('ses_1', fixture.dirA));
    fixture.inbox.push({ id: 'msg_4', text: 'Dopisz czwarty punkt' }, { id: 'msg_5', text: 'I piąty' });
    const order: string[] = [];
    fixture.interrupt.mockImplementation(() => {
        order.push('interrupt');
        return Promise.resolve(true);
    });
    fixture.clearInbox.mockImplementation(() => {
        order.push('clearInbox');
        return Promise.resolve(fixture.inbox.splice(0));
    });

    const result = await fixture.conversations.stop({ projectId: fixture.projectA.id, conversationId: 'ses_1' });

    const expected: ConversationStopResult = {
        stopped: true,
        withdrawn: [
            { id: 'msg_4', text: 'Dopisz czwarty punkt' },
            { id: 'msg_5', text: 'I piąty' },
        ],
    };
    expect(result).toEqual(expected);
    expect(fixture.clearInbox).toHaveBeenCalledWith('ses_1');
    // Cleared before the interrupt, a message could still be delivered in between and also given back.
    expect(order).toEqual(['interrupt', 'clearInbox']);
});

test.each(['send', 'stop', 'listMessages'] as const)(
    '%s refuses a conversation of another project as not found, without touching it',
    async operation => {
        const fixture = await setup();
        fixture.sessions.push(session('ses_b', fixture.dirB));
        const ref = { projectId: fixture.projectA.id, conversationId: 'ses_b' };

        const call = {
            send: () => fixture.conversations.send({ ...ref, text: 'Cześć' }),
            stop: () => fixture.conversations.stop(ref),
            listMessages: () => fixture.conversations.listMessages(ref),
        }[operation];

        await expect(call()).rejects.toMatchObject({ status: 404 });
        expect(fixture.prompt).not.toHaveBeenCalled();
        expect(fixture.interrupt).not.toHaveBeenCalled();
        expect(fixture.clearInbox).not.toHaveBeenCalled();
        expect(fixture.listMessages).not.toHaveBeenCalled();
    },
);

test('refuses an unknown project as not found', async () => {
    const fixture = await setup();

    await expect(fixture.conversations.list('no-such-project')).rejects.toMatchObject({ status: 404 });
    expect(fixture.listSessions).not.toHaveBeenCalled();
});

test('maps a page of messages: steps by tool kind with targets within the project, errors by kind', async () => {
    const fixture = await setup();
    fixture.sessions.push(session('ses_1', fixture.dirA));
    fixture.setPage({
        olderCursor: 'cur_older',
        messages: [
            { type: 'prompt', id: 'msg_1', createdAt: 1, text: 'Utwórz plik test.md' },
            { type: 'other', id: 'msg_2', createdAt: 2 },
            {
                type: 'reply',
                id: 'msg_3',
                createdAt: 3,
                finish: 'tool-calls',
                parts: [
                    { type: 'text', text: 'Tworzę plik.' },
                    {
                        type: 'tool',
                        callId: 'call_1',
                        name: 'write',
                        status: 'completed',
                        input: { path: `${fixture.dirA}/notatki/test.md`, content: 'Zdanie.' },
                        output: [],
                    },
                    {
                        type: 'tool',
                        callId: 'call_2',
                        name: 'Bash',
                        status: 'failed',
                        input: { command: 'cat /etc/hosts' },
                        output: [],
                        error: { kind: 'ToolError', message: 'denied' },
                    },
                    { type: 'tool', callId: 'call_3', name: 'todowrite', status: 'pending', output: [] },
                ],
            },
            {
                type: 'reply',
                id: 'msg_4',
                createdAt: 4,
                parts: [],
                error: { kind: 'ProviderError', message: 'Not logged in · Please run /login', httpStatus: 401 },
            },
            {
                type: 'runEnd',
                id: 'msg_5',
                createdAt: 5,
                outcome: 'failed',
                error: {
                    kind: 'ProviderError',
                    message: 'Claude AI usage limit reached|1794600000',
                    responseBody: '{"secret":"echo"}',
                },
            },
        ],
    });

    const page = await fixture.conversations.listMessages({
        projectId: fixture.projectA.id,
        conversationId: 'ses_1',
        olderCursor: 'cur_page',
    });

    const params: OpencodeMessageListCommandParams = { sessionId: 'ses_1', olderCursor: 'cur_page', limit: 50 };
    expect(fixture.listMessages).toHaveBeenCalledWith(params);
    const expected: ConversationMessagePage = {
        olderCursor: 'cur_older',
        messages: [
            { type: 'user', id: 'msg_1', createdAt: 1, text: 'Utwórz plik test.md' },
            {
                type: 'agent',
                id: 'msg_3',
                createdAt: 3,
                parts: [
                    { type: 'text', text: 'Tworzę plik.' },
                    { type: 'step', id: 'call_1', kind: 'writeFile', target: 'notatki/test.md', status: 'done' },
                    {
                        type: 'step',
                        id: 'call_2',
                        kind: 'runCommand',
                        target: 'cat /etc/hosts',
                        status: 'failed',
                        error: 'denied',
                    },
                    { type: 'step', id: 'call_3', kind: 'other', status: 'running' },
                ],
            },
            { type: 'agent', id: 'msg_4', createdAt: 4, parts: [], error: { kind: 'signedOut' } },
            {
                type: 'runEnd',
                id: 'msg_5',
                createdAt: 5,
                outcome: 'failed',
                error: { kind: 'usageLimit', resetAt: 1_794_600_000_000 },
            },
        ],
    };
    expect(page).toEqual(expected);
});

async function setup() {
    const { container } = createTestContainer();
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'poweragents-conversations-'));
    container.set(EnvVariables, { POWERAGENTS_DATA_ROOT: path.join(tmp, 'root') });
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

    const sessions: OpencodeSession[] = [];
    const active = new Set<string>();
    const inbox: OpencodeInboxPrompt[] = [];
    let page: OpencodeMessagePage = { messages: [] };
    const fixture = {
        sessions,
        active,
        setPage(next: OpencodeMessagePage) {
            page = next;
        },
        // Every session, whatever the directory: as if OpenCode's filter failed.
        listSessions: mock((_directory: string) => Promise.resolve([...sessions])),
        createSession: mock((params: OpencodeSessionCreateCommandParams) =>
            Promise.resolve(session('ses_created', params.directory, { updatedAt: 1 })),
        ),
        prompt: mock((params: OpencodeSessionPromptCommandParams): Promise<OpencodePromptReceipt> =>
            Promise.resolve({ messageId: `msg_${params.text}`, admittedAt: 1 }),
        ),
        interrupt: mock(() => Promise.resolve(true)),
        inbox,
        clearInbox: mock((_sessionId: string) => Promise.resolve(inbox.splice(0))),
        listMessages: mock((_params: OpencodeMessageListCommandParams) => Promise.resolve(page)),
    };
    container.set(OpencodeSessionListCommand, fixture.listSessions);
    container.set(OpencodeSessionGetCommand, id => Promise.resolve(sessions.find(item => item.id === id) ?? null));
    container.set(OpencodeSessionActiveListCommand, () => Promise.resolve(new Set(active)));
    container.set(OpencodeSessionCreateCommand, fixture.createSession);
    container.set(OpencodeSessionPromptCommand, fixture.prompt);
    container.set(OpencodeSessionInterruptCommand, fixture.interrupt);
    container.set(OpencodeSessionInboxClearCommand, fixture.clearInbox);
    container.set(OpencodeMessageListCommand, fixture.listMessages);

    const projects = container.resolve(ProjectService);
    const projectA = assertCreated(await projects.create('Alfa'));
    assertCreated(await projects.create('Beta'));
    return {
        ...fixture,
        conversations: container.resolve(ConversationService),
        projectA,
        dirA: '/Poweragents/projects/Alfa',
        dirB: '/Poweragents/projects/Beta',
    };
}

function session(id: string, directory: string, fields: Partial<OpencodeSession> = {}): OpencodeSession {
    return { id, directory, createdAt: 1, updatedAt: 1, ...fields };
}

function assertCreated(result: ProjectCreateResult): Project {
    if (!('created' in result)) {
        throw new Error('Project not created');
    }
    return result.created;
}
