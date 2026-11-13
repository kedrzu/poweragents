import { expect, mock, test } from 'bun:test';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { EnvVariables } from '@nzyme/ioc/helpers/EnvVariables.js';
import { createTestContainer } from '@nzyme/ioc-testing/createTestContainer.js';
import { assert } from '@nzyme/utils/assert.js';
import { createEventEmitter } from '@nzyme/utils/createEventEmitter.js';

import type { DaemonEvent } from '@poweragents/common/api/DaemonEventTypes.js';
import { OpencodeEventSubscribeCommand } from '@poweragents/opencode/OpencodeEventSubscribeCommand.js';
import type { OpencodeEvent } from '@poweragents/opencode/OpencodeEventSubscribeCommand.js';

import { ProjectService } from '../projects/ProjectService.js';
import { Sandbox } from '../sandbox/Sandbox.js';
import type { SandboxState } from '../sandbox/Sandbox.js';
import { ConversationEventService } from './ConversationEventService.js';
import type { ConversationEventServiceShape } from './ConversationEventService.js';

// OpenCode's event subscription is the boundary; projects are real folders in a fresh temporary data root.

test("tags a new conversation with its project, and skips the agent's sub-sessions and folders that are no project", async () => {
    const { container, feeds } = await setup();
    const created = await container.resolve(ProjectService).create('Alfa');
    assert('created' in created);
    feeds.push([
        { type: 'sessionCreated', sessionId: 'ses_sub', directory: '/Poweragents/projects/Alfa', parentId: 'ses_1' },
        { type: 'sessionCreated', sessionId: 'ses_x', directory: '/Poweragents/projects/Próba' },
        { type: 'sessionCreated', sessionId: 'ses_1', directory: '/Poweragents/projects/Alfa' },
    ]);

    const events = await collect(container.resolve(ConversationEventService), 1);

    const expected: DaemonEvent[] = [
        { type: 'conversationCreated', conversationId: 'ses_1', projectId: created.created.id },
    ];
    expect(events).toEqual(expected);
});

test('reconnects after the feed fails and says the stream was restored as soon as it is open again', async () => {
    const { container, feeds, logs } = await setup();
    // The reconnected feed sends nothing: the gap is reported anyway.
    feeds.push(new Error('connection reset'), []);

    const events = await collect(container.resolve(ConversationEventService), 1);

    const expected: DaemonEvent[] = [{ type: 'streamRestored' }];
    expect(events).toEqual(expected);
    expect(logs.some(log => log.message === 'Agent event feed failed, reconnecting')).toBe(true);
});

test('drops a listener that throws, and keeps the feed for the others', async () => {
    const { container, feeds, subscribe } = await setup();
    feeds.push([
        { type: 'runStarted', sessionId: 'ses_1' },
        { type: 'runStarted', sessionId: 'ses_2' },
    ]);
    const service = container.resolve(ConversationEventService);
    let thrown = 0;
    service.listen(() => {
        thrown++;
        throw new Error('stream closed');
    });

    const events = await collect(service, 2);

    const expected: DaemonEvent[] = [
        { type: 'runningChanged', conversationId: 'ses_1', running: true },
        { type: 'runningChanged', conversationId: 'ses_2', running: true },
    ];
    expect(events).toEqual(expected);
    expect(thrown).toBe(1);
    expect(subscribe).toHaveBeenCalledTimes(1);
});

/**
 * A container whose agent feed plays `feeds` in turn, one per connection: an error fails that connection, a list of
 * events is sent once the connection opens, and it then stays open.
 */
async function setup() {
    const { container, logs } = createTestContainer();
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'poweragents-conversation-events-'));
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

    const feeds: (OpencodeEvent[] | Error)[] = [];
    const subscribe = mock(async function* (_signal: AbortSignal): AsyncGenerator<OpencodeEvent> {
        const feed = feeds.shift();
        if (feed instanceof Error) {
            throw feed;
        }
        yield { type: 'streamOpened' };
        yield* feed ?? [];
        await Promise.withResolvers<void>().promise;
    });
    container.set(OpencodeEventSubscribeCommand, subscribe);
    return { container, feeds, logs, subscribe };
}

/** Listens until `count` events have come. */
async function collect(service: ConversationEventServiceShape, count: number) {
    const events: DaemonEvent[] = [];
    const done = Promise.withResolvers<void>();
    const stop = service.listen(event => {
        events.push(event);
        if (events.length === count) {
            done.resolve();
        }
    });
    await done.promise;
    stop();
    return events;
}
