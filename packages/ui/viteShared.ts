import { fileURLToPath } from 'node:url';

import type { CSSOptions } from 'vite';

// Vite options every build of the repo's components shares — the Nuxt app (`nuxt.config.ts`),
// Storybook (`.storybook/main.ts`) and through it Vitest — so a component compiles the same way in all
// three.

// The repo's own packages; SCSS from anywhere else (nzyme, node_modules) is compiled as is.
const packagesPath = fileURLToPath(new URL('..', import.meta.url));
const tokensPath = fileURLToPath(new URL('./src/styles/tokens.scss', import.meta.url));

export const cssOptions: CSSOptions = {
    devSourcemap: true,
    preprocessorOptions: {
        scss: {
            // The token partial is in scope in every SCSS block of the repo's packages.
            additionalData: (source: string, filename: string) => {
                if (filename.startsWith(packagesPath) && !filename.includes('/node_modules/')) {
                    return `@use '${tokensPath}' as *;\n${source}`;
                }

                return source;
            },
        },
    },
};
