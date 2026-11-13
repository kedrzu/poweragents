import { useService } from '@nzyme/vue-ioc/useService.js';
import { defineNuxtPlugin, useRouter } from 'nuxt/app';
import { watch } from 'vue';

import { SetupStore } from '@/setup/SetupStore.js';
import type { SetupProgress } from '@/setup/SetupStore.js';

/** The routes the app may show at each point of the first run; the first is where it sends the person otherwise. */
const ALLOWED_ROUTES: Record<SetupProgress, readonly [string, ...string[]]> = {
    sandboxNotReady: ['setupEnvironment'],
    claudeStatusFailed: ['setupAiFailed'],
    claudeNotConnected: ['setupAi', 'setupClaude'],
    claudePlanNotAllowed: ['setupClaudePlan', 'setupAi', 'setupClaude'],
    // Signing in to Claude again stays open: a conversation whose agent was signed out sends the person there, even
    // while the daemon still counts Claude as connected.
    done: ['home', 'project', 'conversation', 'setupDone', 'setupAi', 'setupClaude'],
};

/** The app's own screens, past the first run. */
const APP_ROUTES: readonly string[] = ['home', 'project', 'conversation'];

/**
 * Keeps the first run in order: a navigation goes to a screen allowed where the first run stands, so the app never
 * shows home or a project while the sandbox is not ready or Claude not connected. Entering the app and every setup
 * screen ask the daemon (which asks Claude, in the sandbox); moving between the app's own screens once the first run is
 * known to be done does not, so neither the cost of asking Claude nor a passing failure of it comes with every click. A
 * sandbox that stops being ready sends the app back to the environment screen from wherever it is.
 */
export default defineNuxtPlugin({
    name: 'setup-guard-plugin',
    dependsOn: ['ioc-plugin'],
    setup(nuxtApp) {
        const setup = nuxtApp.vueApp.runWithContext(() => useService(SetupStore));
        const router = useRouter();

        router.beforeEach(async to => {
            const known = typeof to.name === 'string' && APP_ROUTES.includes(to.name) && setup.state.done;
            const allowed = ALLOWED_ROUTES[known ? 'done' : await setup.getProgress()];
            if (typeof to.name === 'string' && allowed.includes(to.name)) {
                return true;
            }
            return { name: allowed[0], replace: true };
        });

        setup.pollSandbox();
        watch(
            () => setup.state.sandbox?.status,
            status => {
                if (status !== 'ready' && router.currentRoute.value.name !== 'setupEnvironment') {
                    void router.replace({ name: 'setupEnvironment' });
                }
            },
        );
    },
});
