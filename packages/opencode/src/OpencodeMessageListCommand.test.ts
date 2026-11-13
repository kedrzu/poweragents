import { afterAll, expect, test } from 'bun:test';

import { createTestContainer } from '@nzyme/ioc-testing/createTestContainer.js';

import { OpencodeConnection } from './OpencodeConnection.js';
import { OpencodeMessageListCommand } from './OpencodeMessageListCommand.js';
import type { OpencodeMessage } from './OpencodeMessageListCommand.js';
import type { components } from './schema.gen.js';

type VendorMessage = components['schemas']['Session.Message.Info'];

// A stand-in OpenCode server on the loopback, answering with one page of spec-typed messages, newest first as asked.
const vendorMessages: VendorMessage[] = [
    { id: 'msg_1', type: 'user', time: { created: 1 }, text: 'Utwórz plik' },
    {
        id: 'msg_2',
        type: 'model-switched',
        time: { created: 2 },
        model: { id: 'sonnet', providerID: 'claude-agent' },
    },
    {
        id: 'msg_3',
        type: 'assistant',
        time: { created: 3 },
        agent: 'build',
        model: { id: 'sonnet', providerID: 'claude-agent' },
        finish: 'error',
        error: { type: 'ProviderError', message: 'Bad request', status: 400 },
        content: [
            { type: 'reasoning', text: 'thinking' },
            { type: 'text', text: 'Tworzę plik.' },
            {
                type: 'tool',
                id: 'call_1',
                name: 'write',
                time: { created: 3 },
                state: { status: 'streaming', input: '{"fi' },
            },
            {
                type: 'tool',
                id: 'call_2',
                name: 'write',
                time: { created: 3 },
                state: {
                    status: 'completed',
                    input: {},
                    content: [
                        { type: 'file', uri: 'file:///Poweragents/Test/hello.md', mime: 'text/markdown', name: null },
                    ],
                },
            },
            {
                type: 'tool',
                id: 'call_3',
                name: 'bash',
                time: { created: 3 },
                state: { status: 'error', input: {}, error: { type: 'ToolError', message: 'denied' } },
            },
        ],
    },
    {
        id: 'msg_4',
        type: 'idle',
        time: { created: 4 },
        outcome: 'failed',
        error: { type: 'ProviderError', message: 'Bad request' },
    },
];

const requestedQueries: string[] = [];
const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    routes: {
        '/api/session/:id/message': request => {
            requestedQueries.push(new URL(request.url).searchParams.toString());
            return Response.json({ data: vendorMessages.toReversed(), cursor: { next: 'cur_older' } });
        },
    },
});

afterAll(() => server.stop(true));

test('maps a page oldest first: prompts, replies with their tool calls in every state, run ends and the rest', async () => {
    const { container } = createTestContainer();
    container.set(OpencodeConnection, {
        getEndpoint: () => ({ url: server.url.origin, username: 'opencode', password: 'pw' }),
    });
    const listMessages = container.resolve(OpencodeMessageListCommand);

    const page = await listMessages({ sessionId: 'ses_1', limit: 4 });
    const shortPage = await listMessages({ sessionId: 'ses_1', olderCursor: page.olderCursor, limit: 50 });

    // The first page sets the order; a cursor carries it and must not be combined with it.
    expect(requestedQueries).toEqual(['order=desc&limit=4', 'cursor=cur_older&limit=50']);
    expect(page.olderCursor).toBe('cur_older');
    // A page shorter than asked for holds the oldest message, whatever cursor OpenCode adds.
    expect(shortPage.olderCursor).toBeUndefined();
    const expected: OpencodeMessage[] = [
        { type: 'prompt', id: 'msg_1', createdAt: 1, text: 'Utwórz plik' },
        { type: 'other', id: 'msg_2', createdAt: 2 },
        {
            type: 'reply',
            id: 'msg_3',
            createdAt: 3,
            finish: 'error',
            error: { kind: 'ProviderError', message: 'Bad request', httpStatus: 400 },
            parts: [
                { type: 'text', text: 'Tworzę plik.' },
                { type: 'tool', callId: 'call_1', name: 'write', status: 'pending', output: [] },
                {
                    type: 'tool',
                    callId: 'call_2',
                    name: 'write',
                    status: 'completed',
                    input: {},
                    output: [{ type: 'file', uri: 'file:///Poweragents/Test/hello.md', mimeType: 'text/markdown' }],
                },
                {
                    type: 'tool',
                    callId: 'call_3',
                    name: 'bash',
                    status: 'failed',
                    input: {},
                    output: [],
                    error: { kind: 'ToolError', message: 'denied' },
                },
            ],
        },
        {
            type: 'runEnd',
            id: 'msg_4',
            createdAt: 4,
            outcome: 'failed',
            error: { kind: 'ProviderError', message: 'Bad request' },
        },
    ];
    expect(page.messages).toEqual(expected);
});
