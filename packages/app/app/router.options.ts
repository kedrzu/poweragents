import type { RouterConfig } from 'nuxt/schema';
import type { RouteRecordRaw } from 'vue-router';

// The only place routes are declared; `nuxt.config.ts` fails the build if `pages/` holds a file.
export default {
    routes: (): RouteRecordRaw[] => [
        {
            path: '/',
            name: 'home',
            component: () => import('@/home/HomePage.vue'),
        },
    ],
} satisfies RouterConfig;
