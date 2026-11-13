import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';

import { createContainer } from '@nzyme/ioc/Container.js';
import { ApplicationError } from '@nzyme/logging/ApplicationError.js';
import { consoleLog, LoggerTransport } from '@nzyme/logging/LoggerTransport.js';
import { waitUntil } from '@nzyme/utils/waitUntil.js';

import { OpencodeEventSubscribeCommand } from '@poweragents/opencode/OpencodeEventSubscribeCommand.js';
import type {
    OpencodeRunFinishedEvent,
    OpencodeSessionEvent,
} from '@poweragents/opencode/OpencodeEventSubscribeCommand.js';
import { OpencodeModelListCommand } from '@poweragents/opencode/OpencodeModelListCommand.js';
import type { OpencodeModel } from '@poweragents/opencode/OpencodeModelListCommand.js';
import { OpencodePermissionReplyCommand } from '@poweragents/opencode/OpencodePermissionReplyCommand.js';
import { OpencodeSessionCreateCommand } from '@poweragents/opencode/OpencodeSessionCreateCommand.js';
import { OpencodeSessionPromptCommand } from '@poweragents/opencode/OpencodeSessionPromptCommand.js';
import type { OpencodeReportedError } from '@poweragents/opencode/OpencodeTypes.js';

import { ClaudeSignInService } from '../claude/ClaudeSignInService.js';
import { POWERAGENTS_DATA_ROOT } from '../env.js';
import { LimaSandbox } from '../sandbox/LimaSandbox.js';
import { Sandbox } from '../sandbox/Sandbox.js';
import { SandboxOpencodeConnection } from '../sandbox/SandboxOpencodeConnection.js';

// `bun run sandbox:try [prompt]`: drives the whole M1 path from a terminal — the sandbox, Claude Code's login, the
// Claude Agent provider, a session in a project folder and one prompt — and prints every error verbatim, so the owner
// can see how the agent and its provider behave. It leaves the VM running, as the daemon does.

const DEFAULT_PROMPT = 'Utwórz plik hello.md z krótkim powitaniem i powiedz, co zrobiłeś.';
const PROJECT = 'Próba';
/** The same folder as the container sees it: the data root is mounted at `/Poweragents`. */
const CONTAINER_PROJECT_DIR = `/Poweragents/${PROJECT}`;
const CLAUDE_INTEGRATION = 'claude-agent';
const LOAD_TIMEOUT_MS = 30_000;

const container = createContainer();
// Debug entries (each sandbox state change) would repeat what this script prints itself.
container.set(LoggerTransport, (logger, level, message, obj) => {
    if (level !== 'debug' && level !== 'trace') {
        consoleLog(logger, level, message, obj);
    }
});
container.register(LimaSandbox);
container.register(SandboxOpencodeConnection);
const sandbox = container.resolve(Sandbox);
const hostProjectDir = path.join(container.resolve(POWERAGENTS_DATA_ROOT), PROJECT);
const claude = container.resolve(ClaudeSignInService);
const opencode = {
    listModels: container.resolve(OpencodeModelListCommand),
    createSession: container.resolve(OpencodeSessionCreateCommand),
    prompt: container.resolve(OpencodeSessionPromptCommand),
    replyPermission: container.resolve(OpencodePermissionReplyCommand),
    subscribeEvents: container.resolve(OpencodeEventSubscribeCommand),
};

process.on('SIGINT', interrupt);

try {
    const ok = await run(process.argv[2] ?? DEFAULT_PROMPT);
    process.exit(ok ? 0 : 1);
} catch (error) {
    printFailure(error);
    process.exit(1);
}

async function run(promptText: string) {
    await startSandbox();
    await ensureClaudeLogin();
    await claude.connectAgent();
    const model = await chooseModel();

    await mkdir(hostProjectDir, { recursive: true });
    const session = await opencode.createSession({
        directory: CONTAINER_PROJECT_DIR,
        providerId: CLAUDE_INTEGRATION,
        modelId: model.id,
    });
    console.log(`\nSession ${session.id} in ${session.directory}`);

    console.log(`\n> ${promptText}\n`);
    const events = new AbortController();
    // The events first: the stream does not replay what happened before it opened.
    const [{ outcome }] = await Promise.all([
        printRun(session.id, events.signal),
        opencode.prompt({ sessionId: session.id, text: promptText }),
    ]).finally(() => events.abort());

    console.log(`\nOutcome: ${outcome}`);
    const helloExists = await fileExists(path.join(hostProjectDir, 'hello.md'));
    console.log(`${path.join(hostProjectDir, 'hello.md')} ${helloExists ? 'exists' : 'does not exist'} on the host`);
    return outcome === 'succeeded';
}

async function startSandbox() {
    sandbox.stateChanged.on(state => console.log(`sandbox: ${state.status}`));
    const endpoint = await sandbox.start();
    console.log(`sandbox ready, agent at ${endpoint.url}`);
}

async function ensureClaudeLogin() {
    const status = await claude.getStatus();
    if (status.connected) {
        console.log(
            `Claude Code: logged in, plan ${status.plan ?? 'unknown'}${status.planAllowed ? '' : ' (not allowed)'}`,
        );
        return;
    }

    console.log('Claude Code: not logged in, starting the sign-in');
    let { url } = await claude.startLogin();
    for (;;) {
        console.log(`\n=== Open this URL, sign in to Claude and copy the code ===\n${url}\n`);
        const result = await claude.completeLogin(await readLine('Code: '));
        switch (result.outcome) {
            case 'connected':
            case 'planNotAllowed':
                console.log(
                    `Claude Code: ${result.outcome} as ${result.email ?? '?'}, plan ${result.plan ?? 'unknown'}`,
                );
                return;
            case 'codeRejected':
                console.log('The code was rejected');
                url = result.url;
                break;
            case 'expired':
                throw new Error('The sign-in expired');
        }
    }
}

/** A newly connected provider's models appear a moment after connecting, so wait for them. */
async function chooseModel() {
    let models: OpencodeModel[] = [];
    await waitUntil(
        async () => {
            models = (await opencode.listModels()).filter(model => model.providerId === CLAUDE_INTEGRATION);
            return models.length > 0;
        },
        {
            intervalMs: 1000,
            timeoutMs: LOAD_TIMEOUT_MS,
            onTimeout: () => {
                throw new Error(`OpenCode lists no ${CLAUDE_INTEGRATION} models`);
            },
        },
    );

    const chosen =
        models.find(model => model.id === 'sonnet') ?? models.find(model => /sonnet/i.test(model.name)) ?? models[0];
    if (!chosen) {
        throw new Error('No model to choose');
    }

    console.log(`Models of ${CLAUDE_INTEGRATION}: ${models.map(model => model.id).join(', ')}`);
    console.log(`Chosen: ${chosen.id} (${chosen.name})`);
    return chosen;
}

/** Prints the session's events as they come, until its run finishes; resolves with how it finished. */
async function printRun(sessionId: string, signal: AbortSignal): Promise<OpencodeRunFinishedEvent> {
    for await (const event of opencode.subscribeEvents(signal)) {
        if (event.type === 'streamOpened' || event.sessionId !== sessionId) {
            continue;
        }

        await printEvent(event);
        if (event.type === 'runFinished') {
            return event;
        }
    }

    throw new Error('The event stream ended before the run finished');
}

/** Prints an event of the session. */
async function printEvent(event: OpencodeSessionEvent) {
    switch (event.type) {
        case 'sessionCreated':
        case 'sessionRenamed':
        case 'runStarted':
            break;
        case 'textDelta':
            process.stdout.write(event.delta);
            break;
        case 'toolStarted':
            console.log(`\n[tool ${event.name ?? event.callId}] ${truncate(JSON.stringify(event.input))}`);
            break;
        case 'toolFinished':
            console.log(`[tool ${event.name ?? event.callId}: ok]`);
            break;
        case 'toolFailed':
            console.log(`[tool ${event.name ?? event.callId}: failed] ${formatError(event.error)}`);
            break;
        case 'stepFailed':
            console.log(`\n[step failed] ${formatError(event.error)}`);
            break;
        case 'retryScheduled':
            console.log(`\n[retry ${event.attempt} scheduled] ${formatError(event.error)}`);
            break;
        case 'runFinished':
            printRunFinished(event);
            break;
        case 'permissionAsked':
            // This script stands in for the person who would answer; it allows each request once, and says so.
            console.log(`\n[permission asked: ${event.action} ${event.resources.join(', ')} → allowing once]`);
            await opencode.replyPermission({
                sessionId: event.sessionId,
                permissionId: event.permissionId,
                decision: 'once',
            });
            break;
    }
}

function printRunFinished(event: OpencodeRunFinishedEvent) {
    switch (event.outcome) {
        case 'succeeded':
            console.log('\n[run succeeded]');
            break;
        case 'failed':
            console.log(`\n[run failed] ${formatError(event.error)}`);
            break;
        case 'interrupted':
            console.log(`\n[run interrupted: ${event.reason}]`);
            break;
    }
}

/** The error exactly as OpenCode reported it, every field. */
function formatError(error: OpencodeReportedError) {
    const status = error.httpStatus == null ? '' : ` (HTTP ${error.httpStatus})`;
    const body = error.responseBody == null ? '' : `\n  response body: ${error.responseBody}`;
    return `${error.kind}${status}: ${error.message}${body}`;
}

function printFailure(error: unknown) {
    console.error('\nFAILED:', error instanceof Error ? error.message : error);
    if (error instanceof ApplicationError) {
        console.error(error.data);
    }
}

/** Ctrl-C, also while the sign-in waits for its code; a `claude auth login` left in the container ends at the next start. */
function interrupt() {
    console.log('\nInterrupted');
    process.exit(130);
}

async function readLine(question: string) {
    const terminal = createInterface({ input: process.stdin, output: process.stdout });
    // On a terminal, readline takes Ctrl-C itself and would only pause without this.
    terminal.on('SIGINT', interrupt);
    try {
        return await terminal.question(question);
    } finally {
        terminal.close();
    }
}

async function fileExists(file: string) {
    return stat(file).then(
        () => true,
        () => false,
    );
}

function truncate(text: string) {
    return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}
