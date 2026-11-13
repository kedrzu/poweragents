import type { RouterConfig } from 'nuxt/schema';
import type { RouteRecordRaw } from 'vue-router';

// The only place routes are declared; `nuxt.config.ts` fails the build if `pages/` holds a file. Which of them the app
// may show is decided by `plugins/setupGuardPlugin.ts`.
export default {
    routes: (): RouteRecordRaw[] => [
        {
            path: '/',
            component: () => import('@/projects/MainShell.vue'),
            children: [
                {
                    path: '',
                    name: 'home',
                    component: () => import('@/projects/HomePage.vue'),
                },
                {
                    path: 'projects/:projectId',
                    name: 'project',
                    component: () => import('@/projects/ProjectPage.vue'),
                },
                {
                    path: 'projects/:projectId/conversations/:conversationId',
                    name: 'conversation',
                    component: () => import('@/conversations/ConversationPage.vue'),
                },
            ],
        },
        {
            path: '/setup/environment',
            name: 'setupEnvironment',
            component: () => import('@/setup/EnvironmentPage.vue'),
        },
        {
            path: '/setup/ai',
            name: 'setupAi',
            component: () => import('@/setup/ConnectAiPage.vue'),
        },
        {
            path: '/setup/ai/failed',
            name: 'setupAiFailed',
            component: () => import('@/setup/AiCheckFailedPage.vue'),
        },
        {
            path: '/setup/ai/claude',
            name: 'setupClaude',
            component: () => import('@/setup/ClaudeCodePage.vue'),
        },
        {
            path: '/setup/ai/claude/plan',
            name: 'setupClaudePlan',
            component: () => import('@/setup/ClaudePlanPage.vue'),
        },
        {
            path: '/setup/done',
            name: 'setupDone',
            component: () => import('@/setup/SetupDonePage.vue'),
        },
        // Anything else (a stale deep link) is resolved by the guard from home.
        { path: '/:path(.*)*', redirect: '/' },
    ],
} satisfies RouterConfig;
