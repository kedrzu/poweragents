import { afterAll, expect, test } from 'bun:test';

import { createTestContainer } from '@nzyme/ioc-testing/createTestContainer.js';

import { OpencodeConnection } from './OpencodeConnection.js';
import { OpencodeSessionListCommand } from './OpencodeSessionListCommand.js';
import type { OpencodeSession } from './OpencodeTypes.js';
import type { components } from './schema.gen.js';

type VendorSession = components['schemas']['Session.Info'];

// A stand-in OpenCode server on the loopback, answering with two pages of spec-typed sessions.
const requestedQueries: string[] = [];
const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    routes: {
        '/api/session': request => {
            const query = new URL(request.url).searchParams;
            requestedQueries.push(query.toString());
            return query.has('cursor')
                ? Response.json({ data: [vendorSession('ses_1', 1)], cursor: { next: null } })
                : Response.json({ data: [vendorSession('ses_2', 2)], cursor: { next: 'cur_2' } });
        },
    },
});

afterAll(() => server.stop(true));

test("reads every page of a directory's top-level sessions, filtering each page by the directory", async () => {
    const { container } = createTestContainer();
    container.set(OpencodeConnection, {
        getEndpoint: () => ({ url: server.url.origin, username: 'opencode', password: 'pw' }),
    });

    const sessions = await container.resolve(OpencodeSessionListCommand)('/Poweragents/Test');

    const filters = 'directory=%2FPoweragents%2FTest&parentID=null&archived=false&limit=100';
    expect(requestedQueries).toEqual([`${filters}&order=desc`, `${filters}&cursor=cur_2`]);
    const expected: OpencodeSession[] = [
        { id: 'ses_2', directory: '/Poweragents/Test', title: 'Sesja', createdAt: 2, updatedAt: 20 },
        { id: 'ses_1', directory: '/Poweragents/Test', title: 'Sesja', createdAt: 1, updatedAt: 10 },
    ];
    expect(sessions).toEqual(expected);
});

function vendorSession(id: string, created: number): VendorSession {
    return {
        id,
        projectID: 'prj_1',
        title: 'Sesja',
        cost: 0,
        tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
        time: { created, updated: created * 10 },
        location: { directory: '/Poweragents/Test' },
    };
}
