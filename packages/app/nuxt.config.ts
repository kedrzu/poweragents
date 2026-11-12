import { simplifyAliasesModule } from '@nzyme/nuxt-tools';
import { loadEnvVariables } from '@nzyme/project-utils/loadEnvVariables.js';
import { defineNuxtConfig } from 'nuxt/config';

import { DAEMON_PORT } from '@poweragents/common/daemonAddress.js';
import { cssOptions } from '@poweragents/ui/viteShared.js';

/** The port `nuxt dev` serves on; the desktop shell loads it in development (`build.devUrl` in `tauri.conf.json`). */
const DEV_SERVER_PORT = 4100;

/** The environment this build is for; the same `ENV` Nx keys its cache on (`localEnvironment`). */
const ENV = process.env.ENV ?? 'dev';

// `.env` and `.env.<ENV>` beside this file. Both are gitignored, so the package's `appEnvironment`
// runtime input (`package.json`) hashes them into the build's cache key.
loadEnvVariables({ cwd: import.meta.dirname, env: ENV, root: false });

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    // Pinned: Nuxt 4 moves `srcDir` to `app/` as soon as that folder holds anything but `router.options.ts`.
    srcDir: '.',
    ssr: false,
    devtools: { enabled: true },
    devServer: { port: DEV_SERVER_PORT },
    modules: [simplifyAliasesModule()],
    // Nothing is auto-registered or auto-imported: every component and function is imported explicitly.
    components: false,
    imports: { autoImport: false, dirs: [] },
    typescript: { typeCheck: true, strict: true },
    runtimeConfig: {
        // Overridden at build time by `NUXT_PUBLIC_*` variables from the env files.
        public: { daemonUrl: `http://127.0.0.1:${DAEMON_PORT}` },
    },
    hooks: {
        // Routes are declared only in `app/router.options.ts`; a file Nuxt would route fails the build.
        'pages:resolved'(pages) {
            if (pages.length > 0) {
                const files = pages.map(page => page.file ?? page.path).join(', ');
                throw new Error(`Routes are declared in app/router.options.ts, not as files (${files})`);
            }
        },
    },
    logLevel: 'silent',
    vite: {
        clearScreen: false,
        logLevel: 'warn',
        css: cssOptions,
        define: {
            // A literal in the built code (`shims.d.ts`), so a production build drops what it guards.
            __ENV__: JSON.stringify(ENV),
        },
    },
});
