import { createServer } from 'node:http';
import type { ServerResponse } from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';

import type { Page } from '@playwright/test';

import type { AppSetupStartResult } from '@poweragents/common/api/AppSetupTypes.js';
import type { ClaudeLoginResult, ClaudeStatus } from '@poweragents/common/api/ClaudeTypes.js';
import type {
    Conversation,
    ConversationMessage,
    ConversationSendResult,
    ConversationStopResult,
    ConversationWithdrawnMessage,
} from '@poweragents/common/api/ConversationTypes.js';
import { DAEMON_EVENTS_PATH } from '@poweragents/common/api/DaemonEventTypes.js';
import type { DaemonEvent } from '@poweragents/common/api/DaemonEventTypes.js';
import type {
    MemoryFileContent,
    MemoryFileGetResult,
    MemoryRevealResult,
} from '@poweragents/common/api/MemoryTypes.js';
import { PROJECT_NAME_MAX_LENGTH } from '@poweragents/common/api/ProjectTypes.js';
import type { Project, ProjectCreateResult } from '@poweragents/common/api/ProjectTypes.js';
import type { SandboxStatus } from '@poweragents/common/api/SandboxTypes.js';
import { DAEMON_API_PATH, DAEMON_PORT } from '@poweragents/common/daemonAddress.js';

/** The code `StubDaemon` takes as a Claude account with an allowed plan; any other code is rejected. */
export const GOOD_CODE = 'good-code#state';
/** The code `StubDaemon` takes as a Claude account with a free plan. */
export const FREE_PLAN_CODE = 'free-code#state';
/** The account both codes sign in as. */
export const ACCOUNT_EMAIL = 'ania@example.com';
/** App setup's id when `StubDaemon` creates it. */
export const APP_SETUP_ID = 'p-app-setup';
/** The agent's greeting in App setup's onboarding conversation, as `StubDaemon` starts it. */
export const ONBOARDING_GREETING = "Hi! I'm your agent. What should I call you, and what do you do day to day?";

/** A message the app sent, as the stub took it. */
export interface StubSentMessage {
    conversationId: string;
    text: string;
    queued: boolean;
}

/**
 * The daemon's API, answered in the test's page instead of by a daemon: a sandbox, a Claude sign-in, projects and their
 * conversations the test sets and reads, and the event stream, whose events the test sends (`emit`). Claude's sign-in
 * pages (opened by the app in a new tab in a plain browser) answer with an empty page.
 */
export class StubDaemon {
    sandbox: SandboxStatus = { status: 'ready' };
    claude: ClaudeStatus = { connected: false };
    /** Set: `claude/status` fails with a 500 carrying this message, as the daemon's does when the check fails. */
    claudeStatusError: string | null = null;
    /** Set: `claude/login/start` fails with a 500. */
    loginStartFails = false;
    /** The person's projects, sorted by name as the daemon lists them. */
    projects: Project[] = [];
    /**
     * Set: App setup has not been created on this profile yet; `appSetup/start` creates it with its onboarding
     * conversation, the agent's greeting in it. Unset, it answers as for App setup created before.
     */
    appSetupPending = false;
    /** Set: `projects/create` fails with a 500, as when the disk is full. */
    projectCreateFails = false;
    /** Set: `projects/list` fails with a 500, as when the data root cannot be read. */
    projectListFails = false;
    /** Each project's conversations by project id, newest first. */
    conversations: Record<string, Conversation[]> = {};
    /** Each conversation's messages by conversation id, oldest first; `conversations/messages` serves them in one page. */
    messages: Record<string, ConversationMessage[]> = {};
    /** The person's Memory files with their text, in any order (the daemon lists them by path). */
    memory: MemoryFileContent[] = [];
    /** What the app asked to show in Finder, in order: a Memory file's path, or `null` for the Memory folder. */
    readonly revealed: (string | null)[] = [];
    /** The messages the app sent, in order. */
    readonly sent: StubSentMessage[] = [];
    /** The endpoints called, in order, by name (`claude/login/start`). */
    readonly calls: string[] = [];
    /** Set: the event stream is refused with a 503, as by a daemon still starting; the app gives up and retries later. */
    eventsRefused = false;
    /** How long each `conversations/messages` answer takes, in ms, as a slow daemon's does. */
    messagesDelayMs = 0;
    /** Set by `hold`, by endpoint name: the endpoint's answers wait for it, made as they were asked for. */
    private readonly held = new Map<string, Promise<void>>();
    /** The open event streams; the app holds one. */
    private readonly streams = new Set<ServerResponse>();
    private conversationCount = 0;
    private logins = 0;
    private loginUrl: string | null = null;

    /** Installs the stub on the page; call it before the page opens the app. */
    static async install(page: Page) {
        const daemon = new StubDaemon();
        const eventsUrl = await daemon.serveEvents();
        page.on('close', () => daemon.closeStreams());
        // The app's build talks to the daemon's default address (`runtimeConfig.public.daemonUrl`).
        await page.route(`http://127.0.0.1:${DAEMON_PORT}${DAEMON_API_PATH}**`, async route => {
            const request = route.request();
            // A fulfilled answer is sent whole, so the event stream goes on to a real server that keeps it open.
            if (new URL(request.url()).pathname === DAEMON_EVENTS_PATH) {
                await route.continue({ url: eventsUrl });
                return;
            }
            const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
            if (request.method() === 'OPTIONS') {
                await route.fulfill({ status: 204, headers });
                return;
            }

            const name = new URL(request.url()).pathname.slice(DAEMON_API_PATH.length);
            daemon.calls.push(name);
            const failure = daemon.failure(name);
            if (failure !== null) {
                await route.fulfill({ status: 500, json: { error: 'Error', message: failure }, headers });
                return;
            }

            const answer = daemon.answer(name, request.postData());
            await daemon.held.get(name);
            if (name === 'conversations/messages' && daemon.messagesDelayMs > 0) {
                await sleep(daemon.messagesDelayMs);
            }
            await route.fulfill(
                answer === undefined
                    ? { status: 409, json: { error: 'SandboxNotReady', message: 'The sandbox is not ready' }, headers }
                    : { json: answer, headers },
            );
        });
        await page.context().route(/^https:\/\/claude\.(ai|com)\//, route => route.fulfill({ body: '' }));
        return daemon;
    }

    /** Sends an event to the app, as the daemon streams one. */
    emit(event: DaemonEvent) {
        for (const stream of this.streams) {
            stream.write(`data: ${JSON.stringify(event)}\n\n`);
        }
    }

    /**
     * Holds the answers of an endpoint (`conversations/messages`) until the returned function is called: each answer is
     * made when the app asks (the messages as they were then; a message sent already taken), as a slow daemon's is.
     */
    hold(name: string) {
        const held = Promise.withResolvers<void>();
        this.held.set(name, held.promise);
        return () => {
            this.held.delete(name);
            held.resolve();
        };
    }

    /** Whether the app holds the event stream open. */
    get streaming() {
        return this.streams.size > 0;
    }

    /** Drops the event streams, as a daemon restarting does; the app connects again on its own. */
    closeStreams() {
        for (const stream of this.streams) {
            stream.end();
        }
        this.streams.clear();
    }

    /** How many times the app called an endpoint (`claude/login/start`). */
    countCalls(name: string) {
        return this.calls.filter(call => call === name).length;
    }

    /** The message an endpoint set to fail answers with, else `null`. */
    private failure(name: string) {
        if (name === 'projects/create' && this.projectCreateFails) {
            return 'ENOSPC: no space left on device';
        }
        if (name === 'projects/list' && this.projectListFails) {
            return 'EACCES: permission denied';
        }
        if (this.sandbox.status !== 'ready') {
            return null;
        }
        if (name === 'claude/status') {
            return this.claudeStatusError;
        }
        if (name === 'claude/login/start' && this.loginStartFails) {
            return 'claude auth login printed no sign-in page within 30000 ms';
        }
        return null;
    }

    /** Answers an endpoint; `undefined` for a `claude/*` endpoint while the sandbox is not ready (a 409). Projects do not
     * need the sandbox. */
    private answer(name: string, body: string | null): unknown {
        if (name === 'sandbox/status') {
            return this.sandbox;
        }
        if (name === 'projects/list') {
            return this.projects;
        }
        if (name === 'projects/create') {
            return this.createProject(body);
        }
        if (name === 'sandbox/start') {
            if (this.sandbox.status !== 'ready') {
                this.sandbox = { status: 'startingVm' };
            }
            return this.sandbox;
        }
        if (this.sandbox.status !== 'ready') {
            return undefined;
        }

        switch (name) {
            case 'appSetup/start':
                return this.startAppSetup(readInput(body, 'conversationTitle'));
            case 'conversations/list':
                return this.conversations[readInput(body, 'projectId')] ?? [];
            case 'conversations/create':
                return this.createConversation(readInput(body, 'projectId'));
            case 'conversations/send':
                return this.send(readInput(body, 'conversationId'), readInput(body, 'text'));
            case 'conversations/stop':
                return this.stop(readInput(body, 'conversationId'));
            case 'conversations/messages':
                return { messages: this.messages[readInput(body, 'conversationId')] ?? [] };
            case 'memory/files':
                return this.memory
                    .map(({ content: _content, ...file }) => file)
                    .toSorted((a, b) => a.path.localeCompare(b.path));
            case 'memory/file':
                return this.readMemoryFile(readInput(body, 'path'));
            case 'memory/reveal':
                return this.reveal(body);
            case 'claude/status':
                return this.claude;
            case 'claude/login/start':
                return { url: this.startLogin() };
            case 'claude/login/complete':
                return this.completeLogin(body);
            default:
                throw new Error(`Unknown endpoint ${name}`);
        }
    }

    /** A server streaming `emit`'s events, for the app's `EventSource`; it answers as the daemon does, to any origin here. */
    private async serveEvents() {
        const server = createServer((_request, response) => {
            if (this.eventsRefused) {
                response.writeHead(503, { 'access-control-allow-origin': '*' }).end();
                return;
            }
            response.writeHead(200, {
                'content-type': 'text/event-stream',
                'cache-control': 'no-cache',
                'access-control-allow-origin': '*',
            });
            // A dropped stream is retried soon, so a test of the reconnect does not wait the browser's default.
            response.write('retry: 200\n\n');
            this.streams.add(response);
            response.on('close', () => this.streams.delete(response));
        });
        await new Promise<void>(resolve => {
            server.listen(0, '127.0.0.1', resolve);
        });
        server.unref();
        const address = server.address();
        if (address === null || typeof address === 'string') {
            throw new Error('The event stream server has no port');
        }
        return `http://127.0.0.1:${address.port}${DAEMON_EVENTS_PATH}`;
    }

    private readMemoryFile(path: string): MemoryFileGetResult {
        const file = this.memory.find(item => item.path === path);
        return file ? { file } : { notFound: true };
    }

    private reveal(body: string | null): MemoryRevealResult {
        const path = readInput(body, 'path');
        if (path !== '' && !this.memory.some(item => item.path === path)) {
            return { notFound: true };
        }
        this.revealed.push(path === '' ? null : path);
        return { revealed: true };
    }

    /** Like the daemon: App setup once, with its onboarding started; the opening instruction is never listed. */
    private startAppSetup(conversationTitle: string): AppSetupStartResult {
        if (!this.appSetupPending) {
            return { onboarding: null };
        }
        this.appSetupPending = false;
        const project: Project = { id: APP_SETUP_ID, name: 'App setup', role: 'appSetup' };
        this.projects = [...this.projects, project].toSorted((a, b) => a.name.localeCompare(b.name));
        const conversation = this.createConversation(project.id);
        conversation.title = conversationTitle;
        this.messages[conversation.id] = [
            { type: 'agent', id: 'greeting', createdAt: 1, parts: [{ type: 'text', text: ONBOARDING_GREETING }] },
            { type: 'runEnd', id: 'greeting-end', createdAt: 2, outcome: 'succeeded' },
        ];
        return { onboarding: { projectId: project.id, conversationId: conversation.id } };
    }

    private createConversation(projectId: string): Conversation {
        const conversation: Conversation = {
            id: `c-${++this.conversationCount}`,
            updatedAt: Date.now(),
            running: false,
        };
        this.conversations[projectId] = [conversation, ...(this.conversations[projectId] ?? [])];
        this.messages[conversation.id] = [];
        return conversation;
    }

    /**
     * Like the daemon: a message to a running conversation is queued for the agent's next step; else it starts a run.
     * Either way it is answered with the id it is (or will be) listed under: `sent-<n>`, n counting from 1.
     */
    private send(conversationId: string, text: string): ConversationSendResult {
        const conversation = this.findConversation(conversationId);
        const queued = conversation?.running ?? false;
        this.sent.push({ conversationId, text, queued });
        const messageId = sentMessageId(this.sent.length - 1);
        if (!queued) {
            this.messages[conversationId] = [
                ...(this.messages[conversationId] ?? []),
                { type: 'user', id: messageId, createdAt: Date.now(), text },
            ];
            this.setRunning(conversationId, true);
        }
        return { queued, messageId };
    }

    /** Like the daemon: stops the run and withdraws the messages still queued. */
    private stop(conversationId: string): ConversationStopResult {
        const conversation = this.findConversation(conversationId);
        const stopped = conversation?.running ?? false;
        const withdrawn: ConversationWithdrawnMessage[] = [];
        for (const [index, message] of this.sent.entries()) {
            if (message.conversationId === conversationId && message.queued) {
                withdrawn.push({ id: sentMessageId(index), text: message.text });
            }
        }
        for (const message of this.sent) {
            if (message.conversationId === conversationId) {
                message.queued = false;
            }
        }
        this.setRunning(conversationId, false);
        return { stopped, withdrawn };
    }

    /** Marks a conversation running or not, and streams it, as the daemon does. */
    setRunning(conversationId: string, running: boolean) {
        const conversation = this.findConversation(conversationId);
        if (conversation) {
            conversation.running = running;
        }
        this.emit({ type: 'runningChanged', conversationId, running });
    }

    private findConversation(conversationId: string) {
        return Object.values(this.conversations)
            .flat()
            .find(conversation => conversation.id === conversationId);
    }

    private startLogin() {
        this.logins++;
        this.loginUrl = `https://claude.ai/oauth/authorize?attempt=${this.logins}`;
        return this.loginUrl;
    }

    /** Like Claude: a wrong code ends the sign-in, and the daemon starts a new one at once. */
    private completeLogin(body: string | null): ClaudeLoginResult {
        if (this.loginUrl === null) {
            return { outcome: 'expired' };
        }

        const input: unknown = body === null ? null : JSON.parse(body);
        const code = typeof input === 'object' && input !== null && 'code' in input ? input.code : null;
        switch (code) {
            case GOOD_CODE:
                this.loginUrl = null;
                this.claude = { connected: true, email: ACCOUNT_EMAIL, plan: 'max', planAllowed: true };
                return { outcome: 'connected', email: ACCOUNT_EMAIL, plan: 'max' };
            case FREE_PLAN_CODE:
                this.loginUrl = null;
                this.claude = { connected: true, email: ACCOUNT_EMAIL, plan: 'free', planAllowed: false };
                return { outcome: 'planNotAllowed', email: ACCOUNT_EMAIL, plan: 'free' };
            default:
                return { outcome: 'codeRejected', url: this.startLogin() };
        }
    }

    /** Like the daemon: the name trimmed, unique case-insensitively, at most `PROJECT_NAME_MAX_LENGTH` characters. */
    private createProject(body: string | null): ProjectCreateResult {
        const input: unknown = body === null ? null : JSON.parse(body);
        const raw = typeof input === 'object' && input !== null && 'name' in input ? input.name : null;
        const name = typeof raw === 'string' ? raw.trim() : '';
        if (name.length === 0 || name.length > PROJECT_NAME_MAX_LENGTH || /^[./:]+$/.test(name)) {
            return { invalidName: true };
        }
        if (this.projects.some(project => project.name.toLowerCase() === name.toLowerCase())) {
            return { nameTaken: true };
        }

        const project: Project = { id: crypto.randomUUID(), name };
        this.projects = [...this.projects, project].toSorted((a, b) => a.name.localeCompare(b.name));
        return { created: project };
    }
}

/** A string field of an endpoint's JSON input; `''` when it is missing. */
function readInput(body: string | null, field: string) {
    const input: unknown = body === null ? null : JSON.parse(body);
    if (typeof input === 'object' && input !== null && field in input) {
        const value: unknown = Reflect.get(input, field);
        return typeof value === 'string' ? value : '';
    }
    return '';
}

/** The id of the message the app sent `index`-th (from 0) in `StubDaemon.sent`. */
function sentMessageId(index: number) {
    return `sent-${index + 1}`;
}
