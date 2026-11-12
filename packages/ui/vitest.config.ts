import path from 'node:path';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

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
        // The package starts without components; drop this once the first story exists.
        passWithNoTests: true,
        projects: [
            {
                extends: true,
                // The Vue plugins and SCSS tokens come from `.storybook/main.ts`, which `storybookTest`
                // applies; adding them here would compile every component twice.
                plugins: [storybookTest({ configDir: path.join(import.meta.dirname, '.storybook') }), componentSpecs],
                test: {
                    name: 'storybook',
                    browser: {
                        enabled: true,
                        provider: playwright({}),
                        headless: true,
                        instances: [{ browser: 'chromium' }],
                        locators: { testIdAttribute: 'tid' },
                    },
                },
            },
        ],
    },
});
