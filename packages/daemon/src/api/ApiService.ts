import { Container } from '@nzyme/ioc/Container.js';
import { defineService } from '@nzyme/ioc/Service.js';
import { Logger } from '@nzyme/logging/Logger.js';
import { createRouter } from '@nzyme/rpc/createRouter.js';
import type { HttpResponse } from '@nzyme/rpc/types/HttpResponse.js';

import { DAEMON_EVENTS_PATH } from '@poweragents/common/api/DaemonEventTypes.js';
import type { DaemonEvent } from '@poweragents/common/api/DaemonEventTypes.js';
import { DAEMON_API_PATH, DEV_SERVER_PORT } from '@poweragents/common/daemonAddress.js';

import { ConversationEventService } from '../conversations/ConversationEventService.js';
import { DataRootWatchService } from '../dataRoot/DataRootWatchService.js';
import { ClaudeLoginCompleteEndpointHandler } from './ClaudeLoginCompleteEndpoint.handler.js';
import { ClaudeLoginStartEndpointHandler } from './ClaudeLoginStartEndpoint.handler.js';
import { ClaudeStatusGetEndpointHandler } from './ClaudeStatusGetEndpoint.handler.js';
import { ConversationCreateEndpointHandler } from './ConversationCreateEndpoint.handler.js';
import { ConversationListEndpointHandler } from './ConversationListEndpoint.handler.js';
import { ConversationMessageListEndpointHandler } from './ConversationMessageListEndpoint.handler.js';
import { ConversationSendEndpointHandler } from './ConversationSendEndpoint.handler.js';
import { ConversationStopEndpointHandler } from './ConversationStopEndpoint.handler.js';
import { MemoryFileGetEndpointHandler } from './MemoryFileGetEndpoint.handler.js';
import { MemoryFileListEndpointHandler } from './MemoryFileListEndpoint.handler.js';
import { MemoryRevealEndpointHandler } from './MemoryRevealEndpoint.handler.js';
import { ProjectCreateEndpointHandler } from './ProjectCreateEndpoint.handler.js';
import { ProjectListEndpointHandler } from './ProjectListEndpoint.handler.js';
import { SandboxStartEndpointHandler } from './SandboxStartEndpoint.handler.js';
import { SandboxStatusGetEndpointHandler } from './SandboxStatusGetEndpoint.handler.js';

/**
 * Serves the daemon's API (`@nzyme/rpc` endpoints under `DAEMON_API_PATH`, and the event stream at
 * `DAEMON_EVENTS_PATH`) to the app, and to nothing else.
 */
export interface ApiServiceShape {
    /** Answers a request whose path is under `DAEMON_API_PATH`. */
    handle(request: Request): Promise<Response>;
}

/**
 * The origins the app runs on: the desktop shell's on macOS and Linux (`tauri://localhost`) and on Windows
 * (`http://tauri.localhost`), and `nuxt dev`'s. The dev origin is allowed in release too: only a server on this
 * computer can serve a page from it, and a process on this computer reaches the daemon anyway.
 */
const APP_ORIGINS: readonly string[] = [
    'tauri://localhost',
    'http://tauri.localhost',
    `http://localhost:${DEV_SERVER_PORT}`,
];

const HANDLERS = [
    SandboxStatusGetEndpointHandler,
    SandboxStartEndpointHandler,
    ClaudeStatusGetEndpointHandler,
    ClaudeLoginStartEndpointHandler,
    ClaudeLoginCompleteEndpointHandler,
    ProjectListEndpointHandler,
    ProjectCreateEndpointHandler,
    ConversationListEndpointHandler,
    ConversationCreateEndpointHandler,
    ConversationSendEndpointHandler,
    ConversationStopEndpointHandler,
    ConversationMessageListEndpointHandler,
    MemoryFileListEndpointHandler,
    MemoryFileGetEndpointHandler,
    MemoryRevealEndpointHandler,
];

/**
 * An event stream sends a comment this often: a client sees a dead connection without waiting for an event, and the
 * connection never sits idle.
 */
const HEARTBEAT_MS = 15_000;

/**
 * The daemon's API. Any web page open in the person's browser can send requests to `127.0.0.1`, so a request is served
 * only when its `Origin` is one of `APP_ORIGINS`: a browser sets `Origin` on every cross-origin request and a page
 * cannot change it, and the CORS preflight is answered only for those origins. A request without `Origin` is refused
 * too — `EventSource` sends `Origin` as well, its requests being CORS requests. Only `POST`, as the rpc client sends,
 * and `GET` for the event stream.
 */
export const ApiService = defineService({
    name: 'ApiService',
    deps: {
        container: Container,
        logger: Logger,
        conversationEvents: ConversationEventService,
        dataRootEvents: DataRootWatchService,
    },
    setup({ container, logger, conversationEvents, dataRootEvents }): ApiServiceShape {
        // A failure's name and message go back to the app, which shows them under "Show details"; the app is the only
        // client. `stackTraces` is what makes the router answer with them instead of a constant `UnknownError`;
        // `toResponse()` then drops the stack, which carries the daemon's internal paths. The whole error is logged.
        const router = createRouter({ container, handlers: HANDLERS, basePath: DAEMON_API_PATH, stackTraces: true });
        router.events.error.on(error => logger.error('API request failed', { error }));

        return { handle };

        async function handle(request: Request) {
            const origin = request.headers.get('origin');
            const path = new URL(request.url).pathname;
            if (origin === null || !APP_ORIGINS.includes(origin)) {
                logger.warn('API request from a foreign origin refused', { origin, path });
                return Response.json({ error: 'Forbidden', message: 'Origin not allowed' }, { status: 403 });
            }

            const corsHeaders = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
            if (request.method === 'OPTIONS') {
                return new Response(null, {
                    status: 204,
                    headers: {
                        ...corsHeaders,
                        'Access-Control-Allow-Methods': 'POST',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Max-Age': '600',
                    },
                });
            }

            if (path === DAEMON_EVENTS_PATH) {
                return request.method === 'GET'
                    ? streamEvents(corsHeaders)
                    : Response.json(
                          { error: 'MethodNotAllowed', message: 'Only GET' },
                          { status: 405, headers: { ...corsHeaders, Allow: 'GET' } },
                      );
            }

            if (request.method !== 'POST') {
                return Response.json(
                    { error: 'MethodNotAllowed', message: 'Only POST' },
                    { status: 405, headers: { ...corsHeaders, Allow: 'POST' } },
                );
            }

            const response = await router.execute({
                method: 'POST',
                path,
                headers: Object.fromEntries(request.headers),
                body: await request.text(),
                ip: '127.0.0.1',
            });
            return toResponse(response, corsHeaders);
        }

        /** Server-sent events: each event's `data` is one `DaemonEvent` as JSON. Ends when the client disconnects. */
        function streamEvents(corsHeaders: Record<string, string>) {
            const encoder = new TextEncoder();
            let close = () => {};
            const body = new ReadableStream<Uint8Array>({
                start(controller) {
                    // A stream the client closed without it being cancelled throws on `enqueue`: that client is let
                    // go, and the throw never reaches the feed the other clients share.
                    const send = (text: string) => {
                        try {
                            controller.enqueue(encoder.encode(text));
                        } catch (error) {
                            logger.warn('Event stream client gone, closed', { error });
                            close();
                        }
                    };
                    const sendEvent = (event: DaemonEvent) => send(`data: ${JSON.stringify(event)}\n\n`);
                    const stopConversationEvents = conversationEvents.listen(sendEvent);
                    const stopDataRootEvents = dataRootEvents.listen(sendEvent);
                    const heartbeat = setInterval(() => send(': heartbeat\n\n'), HEARTBEAT_MS);
                    close = () => {
                        stopConversationEvents();
                        stopDataRootEvents();
                        clearInterval(heartbeat);
                    };
                    // A first comment sends the headers now, so the client's `EventSource` opens at once.
                    send(': connected\n\n');
                },
                cancel() {
                    close();
                },
            });
            return new Response(body, {
                headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
            });
        }
    },
});

function toResponse(response: HttpResponse, corsHeaders: Record<string, string>) {
    const body = response.status >= 400 ? withoutStack(response.body) : response.body;
    const headers = new Headers(corsHeaders);
    for (const [name, value] of Object.entries(response.headers)) {
        if (Array.isArray(value)) {
            for (const item of value) {
                headers.append(name, item);
            }
        } else if (value != null) {
            headers.set(name, String(value));
        }
    }

    return new Response(body, { status: response.status, statusText: response.statusText, headers });
}

/** An error body without its `stack`: the router's error bodies are JSON strings; any other body is kept. */
function withoutStack(body: HttpResponse['body']) {
    if (typeof body !== 'string') {
        return body;
    }

    let data: unknown;
    try {
        data = JSON.parse(body);
    } catch {
        return body;
    }

    if (typeof data !== 'object' || data === null || !('stack' in data)) {
        return body;
    }

    const { stack: _stack, ...rest } = data;
    return JSON.stringify(rest);
}
