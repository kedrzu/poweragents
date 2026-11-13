import path from 'node:path';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

import { PALETTES } from './src/styles/Palette.js';

/**
 * Adds the component specs (`*.spec.ts`, which drive stories through `composeStories`) to the
 * storybook project. `storybookTest` replaces `test.include` with the story globs, so a plugin listed
 * after it appends them. Never `STORYBOOK_COMPONENT_PATHS` instead: it switches on Storybook's "ghost
 * stories" mode, in which addon-a11y skips axe for every story.
 */
const componentSpecs: Plugin = {
    name: 'component-specs',
    config: () => ({ test: { include: ['src/**/*.spec.ts'] } }),
};

export default defineConfig({
    test: {
        // Every story and spec is a test in each palette, so axe checks contrast in all three. The
        // projects differ only in `name` and `provide`: any difference in their Vite config (a `define`,
        // another plugin) makes each re-optimise the shared dependency cache, reloading the other
        // projects' pages until the run hangs.
        projects: PALETTES.map(palette => ({
            extends: true,
            // The Vue plugins and SCSS tokens come from `.storybook/main.ts`, which `storybookTest`
            // applies; adding them here would compile every component twice.
            plugins: [storybookTest({ configDir: path.join(import.meta.dirname, '.storybook') }), componentSpecs],
            test: {
                name: `storybook:${palette}`,
                // `vitest.setup.ts` puts it on `<html>`, where `preview.ts` reads it.
                provide: { palette },
                setupFiles: ['./.storybook/vitest.setup.ts'],
                browser: {
                    enabled: true,
                    provider: playwright({}),
                    headless: true,
                    instances: [{ browser: 'chromium' }],
                    locators: { testIdAttribute: 'tid' },
                },
            },
        })),
    },
});
