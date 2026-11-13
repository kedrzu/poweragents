import { afterAll, expect, test } from 'bun:test';

import { createTestContainer } from '@nzyme/ioc-testing/createTestContainer.js';

import { OpencodeConnection } from './OpencodeConnection.js';
import { OpencodeSessionInboxClearCommand } from './OpencodeSessionInboxClearCommand.js';
import type { OpencodeInboxPrompt } from './OpencodeSessionInboxClearCommand.js';
import type { components } from './schema.gen.js';

type VendorInboxItem = components['schemas']['Session.Inbox.Info'];

// A stand-in OpenCode server on the loopback: an inbox with two of the person's prompts around one of OpenCode's own.
const inbox: VendorInboxItem[] = [
    userItem('msg_1', 'Dopisz czwarty punkt'),
    {
        id: 'msg_2',
        sessionID: 'ses_1',
        time: { created: 2 },
        type: 'synthetic',
        payload: { text: 'Kontynuuj' },
        delivery: 'queue',
    },
    userItem('msg_3', 'I piąty'),
];
const cancelled: string[] = [];
const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    routes: {
        '/api/session/ses_1/inbox': () => Response.json({ data: inbox }),
        '/api/session/ses_1/inbox/:inboxID': {
            DELETE: request => {
                cancelled.push(request.params.inboxID);
                return new Response(null, { status: 204 });
            },
        },
    },
});

afterAll(() => server.stop(true));

test("cancels only the person's waiting prompts and returns them in the order sent", async () => {
    const { container } = createTestContainer();
    container.set(OpencodeConnection, {
        getEndpoint: () => ({ url: server.url.origin, username: 'opencode', password: 'pw' }),
    });

    const prompts = await container.resolve(OpencodeSessionInboxClearCommand)('ses_1');

    const expected: OpencodeInboxPrompt[] = [
        { id: 'msg_1', text: 'Dopisz czwarty punkt' },
        { id: 'msg_3', text: 'I piąty' },
    ];
    expect(prompts).toEqual(expected);
    expect(cancelled).toEqual(['msg_1', 'msg_3']);
});

function userItem(id: string, text: string): VendorInboxItem {
    return { id, sessionID: 'ses_1', time: { created: 1 }, type: 'user', payload: { text }, delivery: 'steer' };
}
