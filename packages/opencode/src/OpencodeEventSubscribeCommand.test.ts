import { afterAll, expect, test } from 'bun:test';

import { createTestContainer } from '@nzyme/ioc-testing/createTestContainer.js';

import { OpencodeConnection } from './OpencodeConnection.js';
import { OpencodeEventSubscribeCommand } from './OpencodeEventSubscribeCommand.js';
import type { OpencodeEvent } from './OpencodeEventSubscribeCommand.js';
import type { components } from './schema.gen.js';

type VendorEvent = components['schemas']['V2Event'];

// A stand-in OpenCode server on the loopback: `/api/event` streams `frames` and closes.
const durable = { aggregateID: 'ses_1', seq: 1, version: 1 } as const;
const frames: string[] = [
    vendorEvent({
        id: 'evt_0',
        created: 0,
        type: 'session.created',
        durable,
        data: {
            sessionID: 'ses_1',
            projectID: 'prj_1',
            location: { directory: '/Poweragents/Test' },
            slug: 'cosmic-planet',
            version: '2.2.7',
        },
    }),
    vendorEvent({
        id: 'evt_0b',
        created: 0,
        type: 'session.execution.started',
        durable,
        data: { sessionID: 'ses_1' },
    }),
    vendorEvent({
        id: 'evt_0c',
        created: 0,
        type: 'session.renamed',
        durable,
        data: { sessionID: 'ses_1', title: 'Plik powitalny' },
    }),
    vendorEvent({
        id: 'evt_1',
        created: 1,
        type: 'session.step.started',
        durable,
        data: {
            sessionID: 'ses_1',
            assistantMessageID: 'msg_2',
            agent: 'build',
            model: { id: 'sonnet', providerID: 'claude-agent' },
            started: 1,
        },
    }),
    vendorEvent({
        id: 'evt_2',
        created: 2,
        type: 'session.tool.input.started',
        durable,
        data: { sessionID: 'ses_1', assistantMessageID: 'msg_2', id: 'call_1', name: 'write' },
    }),
    vendorEvent({
        id: 'evt_3',
        created: 3,
        type: 'session.tool.called',
        durable,
        data: {
            sessionID: 'ses_1',
            assistantMessageID: 'msg_2',
            id: 'call_1',
            input: {},
            executed: true,
        },
    }),
    '{"type":"session.future.thing","data":{}}',
    'not json',
    vendorEvent({
        id: 'evt_4',
        created: 4,
        type: 'session.tool.failed',
        durable: { ...durable, version: 2 },
        data: {
            sessionID: 'ses_1',
            assistantMessageID: 'msg_2',
            id: 'call_1',
            error: { type: 'ToolError', message: 'permission denied' },
            executed: true,
        },
    }),
    vendorEvent({
        id: 'evt_5',
        created: 5,
        type: 'session.text.delta',
        data: { sessionID: 'ses_1', assistantMessageID: 'msg_2', ordinal: 0, delta: 'Gotowe' },
    }),
    vendorEvent({
        id: 'evt_6',
        created: 6,
        type: 'permission.asked',
        data: { id: 'per_1', sessionID: 'ses_1', action: 'external_directory', resources: ['/etc/*'] },
    }),
    vendorEvent({
        id: 'evt_7',
        created: 7,
        type: 'session.retry.scheduled',
        durable,
        data: {
            sessionID: 'ses_1',
            assistantMessageID: 'msg_3',
            attempt: 1,
            at: 9000,
            error: { type: 'ProviderError', message: 'overloaded', status: 529, retryAfterMs: 2000 },
        },
    }),
    vendorEvent({
        id: 'evt_8',
        created: 8,
        type: 'session.execution.failed',
        durable,
        data: {
            sessionID: 'ses_1',
            error: { type: 'ProviderError', message: 'Bad request', status: 400, response: { body: '{"error":1}' } },
        },
    }),
    vendorEvent({
        id: 'evt_9',
        created: 9,
        type: 'session.execution.interrupted',
        durable,
        data: { sessionID: 'ses_2', reason: 'superseded' },
    }),
];

const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    routes: {
        '/api/event': () =>
            new Response(frames.map(data => `data: ${data}\n\n`).join(''), {
                headers: { 'Content-Type': 'text/event-stream' },
            }),
    },
});

afterAll(() => server.stop(true));

test('maps the modelled events, names tool calls and skips the rest without ending the stream', async () => {
    const { container, logs } = createTestContainer();
    container.set(OpencodeConnection, {
        getEndpoint: () => ({ url: server.url.origin, username: 'opencode', password: 'pw' }),
    });
    const subscribe = container.resolve(OpencodeEventSubscribeCommand);

    const events = await collect(subscribe(new AbortController().signal));

    const expected: OpencodeEvent[] = [
        { type: 'streamOpened' },
        { type: 'sessionCreated', sessionId: 'ses_1', directory: '/Poweragents/Test' },
        { type: 'runStarted', sessionId: 'ses_1' },
        { type: 'sessionRenamed', sessionId: 'ses_1', title: 'Plik powitalny' },
        {
            type: 'toolStarted',
            sessionId: 'ses_1',
            callId: 'call_1',
            name: 'write',
            input: {},
        },
        {
            type: 'toolFailed',
            sessionId: 'ses_1',
            callId: 'call_1',
            name: 'write',
            error: { kind: 'ToolError', message: 'permission denied' },
            output: [],
        },
        { type: 'textDelta', sessionId: 'ses_1', messageId: 'msg_2', delta: 'Gotowe' },
        {
            type: 'permissionAsked',
            sessionId: 'ses_1',
            permissionId: 'per_1',
            action: 'external_directory',
            resources: ['/etc/*'],
        },
        {
            type: 'retryScheduled',
            sessionId: 'ses_1',
            attempt: 1,
            at: 9000,
            error: { kind: 'ProviderError', message: 'overloaded', httpStatus: 529, retryAfterMs: 2000 },
        },
        {
            type: 'runFinished',
            outcome: 'failed',
            sessionId: 'ses_1',
            error: { kind: 'ProviderError', message: 'Bad request', httpStatus: 400, responseBody: '{"error":1}' },
        },
        { type: 'runFinished', outcome: 'interrupted', sessionId: 'ses_2', reason: 'superseded' },
    ];
    expect(events).toEqual(expected);
    // Only the unreadable frame is worth a warning; an unmodelled event type is expected.
    expect(logs.filter(log => log.message === 'OpenCode event skipped')).toHaveLength(1);
});

test('ends quietly when aborted before the stream opens', async () => {
    const request = Promise.withResolvers<void>();
    const hanging = Bun.serve({
        hostname: '127.0.0.1',
        port: 0,
        fetch: () => {
            request.resolve();
            return Promise.withResolvers<Response>().promise;
        },
    });
    const { container } = createTestContainer();
    container.set(OpencodeConnection, {
        getEndpoint: () => ({ url: hanging.url.origin, username: 'opencode', password: 'pw' }),
    });
    const subscribe = container.resolve(OpencodeEventSubscribeCommand);
    const abort = new AbortController();

    const collecting = collect(subscribe(abort.signal));
    await request.promise;
    abort.abort();

    expect(await collecting).toEqual([]);
    await hanging.stop(true);
});

/** Serializes a spec-typed event as OpenCode sends it, so the compiler checks each fixture against the spec. */
function vendorEvent(event: VendorEvent) {
    return JSON.stringify(event);
}

async function collect(events: AsyncIterable<OpencodeEvent>) {
    const collected: OpencodeEvent[] = [];
    for await (const event of events) {
        collected.push(event);
    }
    return collected;
}
