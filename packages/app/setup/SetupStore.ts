import { HttpError } from '@nzyme/fetch-utils/HttpError.js';
import { defineService } from '@nzyme/ioc/Service.js';
import { assertNever } from '@nzyme/utils/assertNever.js';
import { createSingleRunner } from '@nzyme/utils/createSingleRunner.js';
import { computed, reactive, ref } from 'vue';

import { ClaudeLoginCompleteEndpoint } from '@poweragents/common/api/ClaudeLoginCompleteEndpoint.js';
import { ClaudeLoginStartEndpoint } from '@poweragents/common/api/ClaudeLoginStartEndpoint.js';
import { ClaudeStatusGetEndpoint } from '@poweragents/common/api/ClaudeStatusGetEndpoint.js';
import type { ClaudeLoginResult, ClaudeStatus } from '@poweragents/common/api/ClaudeTypes.js';
import { SandboxStartEndpoint } from '@poweragents/common/api/SandboxStartEndpoint.js';
import { SandboxStatusGetEndpoint } from '@poweragents/common/api/SandboxStatusGetEndpoint.js';
import type { SandboxStatus } from '@poweragents/common/api/SandboxTypes.js';

import { DaemonClient } from '@/daemon/DaemonClient.js';

/** Where the first run stands, which decides the screens the app may show (`setupGuardPlugin`). */
export type SetupProgress =
    | 'sandboxNotReady'
    | 'claudeStatusFailed'
    | 'claudeNotConnected'
    | 'claudePlanNotAllowed'
    | 'done';

/** How often the sandbox's status is asked for, in ms. */
const SANDBOX_POLL_INTERVAL_MS = 500;

/**
 * The first run's state as the daemon reports it: the sandbox's status, Claude's sign-in, and the sign-in page of a
 * Claude login the person has started. The sandbox's status is polled for as long as the app runs, so a sandbox that
 * stops being ready is noticed on any screen (and the daemon, asked, starts it again).
 */
export const SetupStore = defineService({
    name: 'SetupStore',
    deps: { daemon: DaemonClient },
    setup({ daemon }) {
        /** `null` until the daemon answers, and while it does not. */
        const sandbox = ref<SandboxStatus | null>(null);
        /** `null` until asked, and while the sandbox is not ready. */
        const claude = ref<ClaudeStatus | null>(null);
        /** Why the daemon could not tell Claude's status, when it last could not. */
        const claudeError = ref<string | null>(null);
        /** The page of the Claude sign-in waiting for its code; reopened as is, since a new start ends the old one. */
        const loginUrl = ref<string | null>(null);
        /** When the person last signed in to Claude here, epoch ms; `null` before they have. */
        const signedInAt = ref<number | null>(null);
        const sandboxRefresh = createSingleRunner({ handler: refreshSandbox });
        let pollTimer: ReturnType<typeof setInterval> | undefined;

        const state = reactive({
            sandbox: computed(() => sandbox.value),
            claude: computed(() => claude.value),
            claudeError: computed(() => claudeError.value),
            /** The connected Claude account's email, if Claude is connected and shares one. */
            email: computed(() => (claude.value?.connected ? (claude.value.email ?? undefined) : undefined)),
            loginUrl: computed(() => loginUrl.value),
            /**
             * When the person last finished signing in to Claude in this app, epoch ms (this machine's clock); `null`
             * before they have. Only a sign-in counts: the daemon may still count Claude as connected after the agent
             * was signed out.
             */
            signedInAt: computed(() => signedInAt.value),
            /**
             * The first run is done as far as the app last knew: the sandbox ready (as last polled) and Claude connected
             * on an allowed plan (as last asked, or as the sign-in answered). Lets ordinary navigation skip asking Claude
             * again; a sandbox that stops being ready forgets Claude's status, so it is asked again after.
             */
            done: computed(
                () => sandbox.value?.status === 'ready' && claude.value?.connected === true && claude.value.planAllowed,
            ),
        });

        return {
            state,
            pollSandbox,
            getProgress,
            startSandbox,
            startLogin,
            completeLogin,
        };

        /** Starts polling the sandbox's status; once, however often it is called. */
        function pollSandbox() {
            pollTimer ??= setInterval(() => void sandboxRefresh.execute(), SANDBOX_POLL_INTERVAL_MS);
        }

        /** Asks the daemon where the first run stands. A daemon that does not answer counts as a sandbox not ready. */
        async function getProgress(): Promise<SetupProgress> {
            await sandboxRefresh.execute();
            if (sandbox.value?.status !== 'ready') {
                return 'sandboxNotReady';
            }

            try {
                claude.value = await daemon(ClaudeStatusGetEndpoint);
                claudeError.value = null;
            } catch (error) {
                claude.value = null;
                // An error answer other than 409 `SandboxNotReady` (the sandbox stopped being ready since it was
                // asked): the check itself failed, and the person sees why. No answer at all: the daemon is gone.
                if (error instanceof HttpError && error.status !== 409) {
                    claudeError.value = error.message;
                    return 'claudeStatusFailed';
                }
                return 'sandboxNotReady';
            }

            if (!claude.value.connected) {
                return 'claudeNotConnected';
            }
            return claude.value.planAllowed ? 'done' : 'claudePlanNotAllowed';
        }

        /** Starts the sandbox, or retries a failed start. */
        async function startSandbox() {
            setSandbox(await daemon(SandboxStartEndpoint));
        }

        /** Starts a new Claude sign-in (ending one already waiting) and returns its page. */
        async function startLogin() {
            const { url } = await daemon(ClaudeLoginStartEndpoint);
            loginUrl.value = url;
            return url;
        }

        /** Gives the waiting sign-in the pasted code; on `codeRejected` the sign-in's page is the one it returns. */
        async function completeLogin(code: string): Promise<ClaudeLoginResult> {
            const result = await daemon(ClaudeLoginCompleteEndpoint, { code });
            switch (result.outcome) {
                case 'codeRejected':
                    loginUrl.value = result.url;
                    break;
                case 'expired':
                    loginUrl.value = null;
                    break;
                case 'connected':
                case 'planNotAllowed':
                    loginUrl.value = null;
                    signedInAt.value = Date.now();
                    claude.value = {
                        connected: true,
                        email: result.email,
                        plan: result.plan,
                        planAllowed: result.outcome === 'connected',
                    };
                    break;
                default:
                    assertNever(result);
            }
            return result;
        }

        async function refreshSandbox() {
            try {
                setSandbox(await daemon(SandboxStatusGetEndpoint));
            } catch {
                setSandbox(null);
            }
        }

        function setSandbox(status: SandboxStatus | null) {
            sandbox.value = status;
            if (status?.status !== 'ready') {
                claude.value = null;
            }
        }
    },
});
