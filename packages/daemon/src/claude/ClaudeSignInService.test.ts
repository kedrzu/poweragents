import { expect, mock, test } from 'bun:test';

import { createTestContainer } from '@nzyme/ioc-testing/createTestContainer.js';
import { createEventEmitter } from '@nzyme/utils/createEventEmitter.js';

import type { ClaudeLoginResult, ClaudeStatus } from '@poweragents/common/api/ClaudeTypes.js';
import { OpencodeIntegrationConnectExternalCommand } from '@poweragents/opencode/OpencodeIntegrationConnectExternalCommand.js';
import type { OpencodeIntegrationConnectExternalCommandParams } from '@poweragents/opencode/OpencodeIntegrationConnectExternalCommand.js';
import { OpencodeIntegrationGetCommand } from '@poweragents/opencode/OpencodeIntegrationGetCommand.js';
import type { OpencodeIntegration } from '@poweragents/opencode/OpencodeIntegrationGetCommand.js';

import { Sandbox } from '../sandbox/Sandbox.js';
import type { SandboxExecParams, SandboxProcess, SandboxState } from '../sandbox/Sandbox.js';
import { ClaudeSignInService } from './ClaudeSignInService.js';

// The sandbox's `exec` is the boundary: each `claude` command is a fake process printing what Claude Code 2.1.322
// prints, and OpenCode's integration commands stand in for its HTTP API.

const URL_1 = 'https://claude.com/cai/oauth/authorize?state=first';
const URL_2 = 'https://claude.com/cai/oauth/authorize?state=second';
const CODE = 'Secret4uthCode';
const STATE = 'SecretSt4te';

test('reports a signed-in allowed plan and connects the agent once', async () => {
    const fixture = setup({ status: { loggedIn: true, email: 'ola@example.com', subscriptionType: 'max' } });

    const status = await fixture.claude.getStatus();
    await fixture.claude.getStatus();

    const expected: ClaudeStatus = { connected: true, email: 'ola@example.com', plan: 'max', planAllowed: true };
    expect(status).toEqual(expected);
    expect(fixture.connectIntegration).toHaveBeenCalledTimes(1);
    expect(fixture.connectIntegration).toHaveBeenCalledWith({
        integrationId: 'claude-agent',
        methodId: 'claude-login',
    });
});

test('reports a plan outside pro/max/team/enterprise as not allowed, logs it and does not connect the agent', async () => {
    const fixture = setup({ status: { loggedIn: true, email: 'ola@example.com', subscriptionType: 'free' } });

    const status = await fixture.claude.getStatus();

    const expected: ClaudeStatus = { connected: true, email: 'ola@example.com', plan: 'free', planAllowed: false };
    expect(status).toEqual(expected);
    expect(fixture.logs.find(log => log.message === 'Claude plan not allowed')?.data).toEqual({ plan: 'free' });
    expect(fixture.connectIntegration).not.toHaveBeenCalled();
});

test('reports logged out from the JSON Claude prints with exit code 1', async () => {
    const fixture = setup({ status: { loggedIn: false }, statusExitCode: 1 });

    const expected: ClaudeStatus = { connected: false };
    expect(await fixture.claude.getStatus()).toEqual(expected);
});

test('a sign-in returns its page, passes the code to Claude, connects the agent and never logs the code', async () => {
    const fixture = setup({ status: { loggedIn: true, email: 'ola@example.com', subscriptionType: 'pro' } });
    fixture.onCode = login => {
        login.print('Login successful.\n');
        login.exit(0);
    };

    const started = await fixture.claude.startLogin();
    const result = await fixture.claude.completeLogin(` ${CODE}#${STATE}\n`);

    expect(started).toEqual({ url: URL_1 });
    expect(fixture.logins[0]?.stdinText).toBe(`${CODE}#${STATE}\n`);
    const expected: ClaudeLoginResult = { outcome: 'connected', email: 'ola@example.com', plan: 'pro' };
    expect(result).toEqual(expected);
    expect(fixture.connectIntegration).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(fixture.logs)).not.toContain(CODE);
    expect(JSON.stringify(fixture.logs)).not.toContain(STATE);
});

test('a code Claude rejects starts a new sign-in, and the code stays out of the logs', async () => {
    const fixture = setup({ status: { loggedIn: false }, statusExitCode: 1 });
    fixture.onCode = login => {
        // Claude's own message could quote what it was given; the daemon must not pass it on.
        login.printError(`Login failed: invalid_grant for ${CODE}#${STATE}\n`);
        login.exit(1);
    };

    await fixture.claude.startLogin();
    const result = await fixture.claude.completeLogin(`${CODE}#${STATE}`);

    const expected: ClaudeLoginResult = { outcome: 'codeRejected', url: URL_2 };
    expect(result).toEqual(expected);
    expect(fixture.logins).toHaveLength(2);
    expect(fixture.logs.some(log => log.message === 'Claude sign-in code rejected')).toBe(true);
    expect(JSON.stringify(fixture.logs)).not.toContain(CODE);
    expect(JSON.stringify(fixture.logs)).not.toContain(STATE);
});

test('a code without its state is rejected without reaching Claude, which keeps waiting', async () => {
    const fixture = setup({ status: { loggedIn: false }, statusExitCode: 1 });

    await fixture.claude.startLogin();
    const result = await fixture.claude.completeLogin(CODE);

    const expected: ClaudeLoginResult = { outcome: 'codeRejected', url: URL_1 };
    expect(result).toEqual(expected);
    expect(fixture.logins[0]?.stdinText).toBe('');
    expect(fixture.logins[0]?.killed).toBe(false);
});

test('a code with no sign-in waiting is answered as expired without reaching Claude', async () => {
    const fixture = setup({ status: { loggedIn: false }, statusExitCode: 1 });

    const result = await fixture.claude.completeLogin(`${CODE}#${STATE}`);

    const expected: ClaudeLoginResult = { outcome: 'expired' };
    expect(result).toEqual(expected);
    expect(fixture.logins).toHaveLength(0);
});

test('a signed-in plan that is not allowed is reported, and the agent is not connected', async () => {
    const fixture = setup({ status: { loggedIn: true, email: 'ola@example.com', subscriptionType: 'free' } });
    fixture.onCode = login => {
        login.print('Login successful.\n');
        login.exit(0);
    };

    await fixture.claude.startLogin();
    const result = await fixture.claude.completeLogin(`${CODE}#${STATE}`);

    const expected: ClaudeLoginResult = { outcome: 'planNotAllowed', email: 'ola@example.com', plan: 'free' };
    expect(result).toEqual(expected);
    expect(fixture.connectIntegration).not.toHaveBeenCalled();
});

test('only one sign-in lives at a time: a new start ends the waiting one, in the container too', async () => {
    const fixture = setup({ status: { loggedIn: false }, statusExitCode: 1 });

    await fixture.claude.startLogin();
    const commandsBeforeRestart = fixture.commands.length;
    const restarted = await fixture.claude.startLogin();

    expect(fixture.logins[0]?.killed).toBe(true);
    expect(fixture.logins[1]?.killed).toBe(false);
    expect(fixture.commands.slice(commandsBeforeRestart)).toContain('pkill --full claude auth login');
    expect(restarted).toEqual({ url: URL_2 });
});

test('refuses to work while the sandbox is not ready', async () => {
    const fixture = setup({ status: { loggedIn: false }, sandboxState: { status: 'startingAgent' } });

    await expect(fixture.claude.startLogin()).rejects.toMatchObject({ status: 409 });
    expect(fixture.logins).toHaveLength(0);
});

interface SetupOptions {
    /** What `claude auth status` prints, as JSON. */
    status: Record<string, unknown>;
    statusExitCode?: number;
    sandboxState?: SandboxState;
}

interface FakeLogin extends FakeProcess {
    stdinText: string;
}

function setup(options: SetupOptions) {
    const { container, logs } = createTestContainer();
    const logins: FakeLogin[] = [];
    /** Every command run in the sandbox, in order. */
    const commands: string[] = [];
    let integration: OpencodeIntegration = { id: 'claude-agent', name: 'Claude Agent', connected: false };
    const connectIntegration = mock((_params: OpencodeIntegrationConnectExternalCommandParams) => {
        integration = { ...integration, connected: true };
        return Promise.resolve();
    });
    const state: SandboxState = options.sandboxState ?? {
        status: 'ready',
        endpoint: { url: 'http://127.0.0.1:1', username: 'opencode', password: 'x' },
    };

    container.set(Sandbox, {
        getState: () => state,
        getVerifiedState: () => Promise.resolve(state),
        stateChanged: createEventEmitter<[state: SandboxState]>().event,
        start: () => Promise.reject(new Error('not used')),
        stop: () => Promise.resolve(),
        exec,
    });
    container.set(OpencodeIntegrationGetCommand, () => Promise.resolve(integration));
    container.set(OpencodeIntegrationConnectExternalCommand, connectIntegration);
    const fixture = {
        logs,
        logins,
        commands,
        connectIntegration,
        /** What Claude does with a pasted code. */
        onCode: (_login: FakeLogin) => {},
        claude: container.resolve(ClaudeSignInService),
    };
    return fixture;

    function exec(params: SandboxExecParams): SandboxProcess {
        const fake = createFakeProcess();
        commands.push(params.command.join(' '));
        switch (params.command.join(' ')) {
            case 'claude auth status':
                fake.print(JSON.stringify(options.status));
                fake.exit(options.statusExitCode ?? 0);
                break;
            case 'pkill --full claude auth login':
                fake.exit(1);
                break;
            case 'claude auth login': {
                const login: FakeLogin = Object.assign(fake, { stdinText: '' });
                logins.push(login);
                login.process.stdin = {
                    write: chunk => {
                        login.stdinText += String(chunk);
                        fixture.onCode(login);
                    },
                    end: () => {},
                };
                login.print('Opening browser to sign in…\n');
                login.print(`If the browser didn't open, visit: ${logins.length === 1 ? URL_1 : URL_2}\n`);
                login.print('Paste code here if prompted > ');
                break;
            }
            default:
                throw new Error(`Unexpected command: ${params.command.join(' ')}`);
        }
        return fake.process;
    }
}

interface FakeProcess {
    process: SandboxProcess;
    killed: boolean;
    print(text: string): void;
    printError(text: string): void;
    exit(code: number): void;
}

function createFakeProcess(): FakeProcess {
    const encoder = new TextEncoder();
    let stdout!: ReadableStreamDefaultController<Uint8Array>;
    let stderr!: ReadableStreamDefaultController<Uint8Array>;
    let resolveExit!: (code: number) => void;
    let exited = false;

    const fake: FakeProcess = {
        process: {
            stdin: { write: () => {}, end: () => {} },
            stdout: new ReadableStream({ start: controller => void (stdout = controller) }),
            stderr: new ReadableStream({ start: controller => void (stderr = controller) }),
            exited: new Promise(resolve => {
                resolveExit = resolve;
            }),
            kill: () => {
                fake.killed = true;
                fake.exit(143);
            },
        },
        killed: false,
        print: text => stdout.enqueue(encoder.encode(text)),
        printError: text => stderr.enqueue(encoder.encode(text)),
        exit: code => {
            if (!exited) {
                exited = true;
                stdout.close();
                stderr.close();
                resolveExit(code);
            }
        },
    };
    return fake;
}
