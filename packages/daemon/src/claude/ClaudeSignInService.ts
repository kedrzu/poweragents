import { defineService } from '@nzyme/ioc/Service.js';
import { ApplicationError } from '@nzyme/logging/ApplicationError.js';
import { Logger } from '@nzyme/logging/Logger.js';
import { createSingleRunner } from '@nzyme/utils/createSingleRunner.js';
import { waitUntil } from '@nzyme/utils/waitUntil.js';

import { CLAUDE_ALLOWED_PLANS } from '@poweragents/common/api/ClaudeTypes.js';
import type { ClaudeLoginResult, ClaudeLoginStartResult, ClaudeStatus } from '@poweragents/common/api/ClaudeTypes.js';
import { OpencodeIntegrationConnectExternalCommand } from '@poweragents/opencode/OpencodeIntegrationConnectExternalCommand.js';
import { OpencodeIntegrationGetCommand } from '@poweragents/opencode/OpencodeIntegrationGetCommand.js';
import type { OpencodeIntegration } from '@poweragents/opencode/OpencodeIntegrationGetCommand.js';

import { Sandbox } from '../sandbox/Sandbox.js';
import type { SandboxProcess } from '../sandbox/Sandbox.js';
import { assertSandboxReady } from '../sandbox/assertSandboxReady.js';
import { redact } from '../utils/redact.js';

/**
 * Claude Code's sign-in inside the sandbox, which the agent runs on: its status, and the sign-in itself (`claude auth
 * login`), kept alive between `startLogin()` and `completeLogin()`. One sign-in at a time; it ends on a new start and
 * after `LOGIN_TIMEOUT_MS`. Every method needs a ready sandbox and throws an `HttpError` 409
 * (`SandboxNotReady`) otherwise.
 */
export interface ClaudeSignInServiceShape {
    /**
     * Claude's sign-in, after connecting the agent to it when the plan is allowed. Throws when either fails: a sign-in
     * the agent cannot run on is no more use than none, so the app shows the failure with a retry rather than going on.
     */
    getStatus(): Promise<ClaudeStatus>;
    /** Starts a new sign-in, ending one already waiting. */
    startLogin(): Promise<ClaudeLoginStartResult>;
    /** Gives the waiting sign-in the code pasted from Claude's page. The code is never logged. */
    completeLogin(code: string): Promise<ClaudeLoginResult>;
    /**
     * Connects OpenCode's `claude-agent` integration to Claude Code's sign-in, unless it already is; the agent runs on
     * Claude through it. Done by `getStatus()` and a successful sign-in when the plan is allowed.
     */
    connectAgent(): Promise<void>;
}

/** A `claude auth login` waiting for its code. */
interface Login {
    process: SandboxProcess;
    url: string;
    /** Everything the process printed so far, stdout and stderr interleaved. */
    output: string;
    /** Set once the process has ended. */
    exitCode: number | undefined;
    timeout: ReturnType<typeof setTimeout>;
}

/** A sign-in waits this long for its code, then ends. */
const LOGIN_TIMEOUT_MS = 10 * 60_000;
/** How long `claude auth login` may take to print its sign-in page. */
const LOGIN_URL_TIMEOUT_MS = 30_000;
/** How long Claude may take to exchange a pasted code. */
const CODE_CHECK_TIMEOUT_MS = 60_000;
/** OpenCode loads its integrations a moment after it starts answering. */
const INTEGRATION_LOAD_TIMEOUT_MS = 30_000;
/** `claude auth login` prints `If the browser didn't open, visit: <url>`. */
const LOGIN_URL_PATTERN = /visit: (https:\/\/\S+)/;
const LOGIN_SUCCESS_TEXT = 'Login successful.';
/** OpenCode's integration, and model provider, that runs the agent on Claude Code's sign-in. */
export const CLAUDE_INTEGRATION = 'claude-agent';
const CLAUDE_LOGIN_METHOD = 'claude-login';

/** Claude Code's sign-in in the sandbox: status, sign-in and the agent's connection to it. */
export const ClaudeSignInService = defineService({
    name: 'ClaudeSignInService',
    deps: {
        sandbox: Sandbox,
        logger: Logger,
        getIntegration: OpencodeIntegrationGetCommand,
        connectIntegration: OpencodeIntegrationConnectExternalCommand,
    },
    setup({ sandbox, logger, getIntegration, connectIntegration }): ClaudeSignInServiceShape {
        let login: Login | undefined;
        /** Sign-in operations run one after another, so two calls never race for the one process. */
        let loginQueue: Promise<unknown> = Promise.resolve();
        const connectAgentRunner = createSingleRunner({ handler: connectAgentOnce });

        return {
            getStatus,
            startLogin: () => runExclusive(startLoginNow),
            completeLogin: code => runExclusive(() => completeLoginNow(code)),
            connectAgent: () => connectAgentRunner.execute(),
        };

        async function getStatus(): Promise<ClaudeStatus> {
            const status = await readStatus();
            if (status.connected && status.planAllowed) {
                await connectAgentRunner.execute();
            }
            return status;
        }

        async function startLoginNow(): Promise<ClaudeLoginStartResult> {
            assertSandboxReady(sandbox);
            await endLogin();
            // Also a `claude auth login` left by a daemon that died while it waited.
            await killLoginsInSandbox();

            const child = sandbox.exec({ command: ['claude', 'auth', 'login'] });
            const started: Login = {
                process: child,
                url: '',
                output: '',
                exitCode: undefined,
                timeout: setTimeout(() => void runExclusive(() => expireLogin(started)), LOGIN_TIMEOUT_MS),
            };
            login = started;
            void collectOutput(started);

            try {
                await waitUntil(() => started.exitCode !== undefined || LOGIN_URL_PATTERN.test(started.output), {
                    intervalMs: 100,
                    timeoutMs: LOGIN_URL_TIMEOUT_MS,
                    onTimeout: () => {
                        throw new Error(`claude auth login printed no sign-in page within ${LOGIN_URL_TIMEOUT_MS} ms`);
                    },
                });
                const url = LOGIN_URL_PATTERN.exec(started.output)?.[1];
                if (url === undefined) {
                    throw new ApplicationError('claude auth login ended without a sign-in page', {
                        exitCode: started.exitCode,
                        output: started.output.slice(-4000),
                    });
                }

                started.url = url;
                logger.info('Claude sign-in started');
                return { url };
            } catch (error) {
                await endLogin();
                throw error;
            }
        }

        async function completeLoginNow(code: string): Promise<ClaudeLoginResult> {
            assertSandboxReady(sandbox);
            const current = login;
            if (current === undefined || current.exitCode !== undefined) {
                await endLogin();
                return { outcome: 'expired' };
            }

            // Claude reads `<code>#<state>`; anything else it refuses and keeps waiting, so the person can paste again.
            const [authorizationCode, state] = code.trim().split('#');
            if (!authorizationCode || !state) {
                logger.info('Claude sign-in code malformed');
                return { outcome: 'codeRejected', url: current.url };
            }

            current.output = '';
            current.process.stdin.write(`${authorizationCode}#${state}\n`);
            await waitUntil(() => current.exitCode !== undefined, {
                intervalMs: 100,
                timeoutMs: CODE_CHECK_TIMEOUT_MS,
                onTimeout: async () => {
                    await endLogin();
                    throw new Error(`claude auth login did not finish within ${CODE_CHECK_TIMEOUT_MS} ms of the code`);
                },
            });

            const output = current.output;
            const exitCode = current.exitCode;
            await endLogin();

            if (exitCode !== 0 || !output.includes(LOGIN_SUCCESS_TEXT)) {
                logger.warn('Claude sign-in code rejected', {
                    exitCode,
                    output: redact(output, [authorizationCode, state]).slice(-2000),
                });
                // Claude ends the sign-in on a rejected code; a new one lets the person try again.
                const restarted = await startLoginNow();
                return { outcome: 'codeRejected', url: restarted.url };
            }

            const status = await readStatus();
            if (!status.connected) {
                throw new Error('Claude reported a successful sign-in, but its status is logged out');
            }

            logger.info('Claude signed in', { plan: status.plan, planAllowed: status.planAllowed });
            if (!status.planAllowed) {
                return { outcome: 'planNotAllowed', email: status.email, plan: status.plan };
            }

            await connectAgentRunner.execute();
            return { outcome: 'connected', email: status.email, plan: status.plan };
        }

        async function expireLogin(expired: Login) {
            if (login === expired) {
                logger.info('Claude sign-in timed out', { timeoutMs: LOGIN_TIMEOUT_MS });
                await endLogin();
            }
        }

        async function endLogin() {
            const ended = login;
            if (ended === undefined) {
                return;
            }

            login = undefined;
            clearTimeout(ended.timeout);
            if (ended.exitCode === undefined) {
                ended.process.kill();
                await killLoginsInSandbox();
            }
        }

        /** Killing the host side of `exec()` leaves the process in the container running; this ends it there. */
        async function killLoginsInSandbox() {
            await sandbox.exec({ command: ['pkill', '--full', 'claude auth login'] }).exited;
        }

        async function collectOutput(target: Login) {
            await Promise.all([
                appendOutput(target, target.process.stdout),
                appendOutput(target, target.process.stderr),
            ]);
            target.exitCode = await target.process.exited;
        }

        /** `claude auth status` prints JSON whether logged in or not (exiting 1 when not). */
        async function readStatus(): Promise<ClaudeStatus> {
            assertSandboxReady(sandbox);
            const child = sandbox.exec({ command: ['claude', 'auth', 'status'] });
            const [stdout, stderr, exitCode] = await Promise.all([
                new Response(child.stdout).text(),
                new Response(child.stderr).text(),
                child.exited,
            ]);

            let parsed: unknown;
            try {
                parsed = JSON.parse(stdout);
            } catch {
                throw new ApplicationError('claude auth status printed no JSON', {
                    exitCode,
                    stderr: stderr.slice(-2000),
                });
            }

            if (typeof parsed !== 'object' || parsed === null || !('loggedIn' in parsed) || parsed.loggedIn !== true) {
                return { connected: false };
            }

            const email = 'email' in parsed && typeof parsed.email === 'string' ? parsed.email : null;
            const plan =
                'subscriptionType' in parsed && typeof parsed.subscriptionType === 'string'
                    ? parsed.subscriptionType
                    : null;
            const planAllowed = CLAUDE_ALLOWED_PLANS.some(allowed => allowed === plan);
            if (!planAllowed) {
                logger.warn('Claude plan not allowed', { plan });
            }

            return { connected: true, email, plan, planAllowed };
        }

        async function connectAgentOnce() {
            let integration: OpencodeIntegration | undefined;
            await waitUntil(
                async () => {
                    integration = await getIntegration(CLAUDE_INTEGRATION);
                    return integration !== undefined;
                },
                {
                    intervalMs: 500,
                    timeoutMs: INTEGRATION_LOAD_TIMEOUT_MS,
                    onTimeout: () => {
                        throw new Error(`OpenCode has no ${CLAUDE_INTEGRATION} integration`);
                    },
                },
            );

            // Connecting is not idempotent: each call adds a connection.
            if (!integration?.connected) {
                await connectIntegration({ integrationId: CLAUDE_INTEGRATION, methodId: CLAUDE_LOGIN_METHOD });
            }
        }

        function runExclusive<T>(operation: () => Promise<T>): Promise<T> {
            const result = loginQueue.then(operation, operation);
            loginQueue = result.catch(() => undefined);
            return result;
        }
    },
});

async function appendOutput(target: Login, stream: ReadableStream<Uint8Array>) {
    const decoder = new TextDecoder();
    for await (const chunk of stream) {
        target.output += decoder.decode(chunk, { stream: true });
    }
}
