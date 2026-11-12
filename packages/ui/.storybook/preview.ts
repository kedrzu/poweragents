import { LanguageContext } from '@nzyme/i18n/LanguageContext.js';
import { CommonPlugin } from '@nzyme/vue/CommonPlugin.js';
import { createContainer } from '@nzyme/vue-ioc/createContainer.js';
import { IocPlugin } from '@nzyme/vue-ioc/IocPlugin.js';
import type { Preview } from '@storybook/vue3-vite';
import { setup } from '@storybook/vue3-vite';
import { ConfigProvider } from 'reka-ui';
import { defineComponent, h, ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import { APP_LANGUAGES, FALLBACK_LANGUAGE, pickAppLanguage } from '@poweragents/common/appLanguages.js';
import type { AppLanguage } from '@poweragents/common/appLanguages.js';

import '../src/styles/main.scss';

/** The language stories render in, set from the toolbar's `language` global by the decorator below. */
const language = ref<AppLanguage>(FALLBACK_LANGUAGE);

// What the app's `ioc-plugin` gives a component, so a story renders it as the app does.
setup(app => {
    const container = createContainer();
    container.set(LanguageContext, () => language.value);
    app.use(IocPlugin, { container });
    app.use(CommonPlugin);
    // Links need a router; any path renders nothing and stays inside the story.
    app.use(
        createRouter({
            history: createMemoryHistory(),
            routes: [{ path: '/:path(.*)*', component: defineComponent({ render: () => null }) }],
        }),
    );
});

const preview: Preview = {
    globalTypes: {
        language: {
            description: 'The language the stories render in',
            toolbar: { icon: 'globe', items: [...APP_LANGUAGES], dynamicTitle: true },
        },
    },
    initialGlobals: { language: FALLBACK_LANGUAGE },
    parameters: {
        a11y: {
            // A violation fails the story's test. `wcag22aa` is what turns axe's target-size rule on.
            test: 'error',
            options: {
                runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
            },
        },
    },
    decorators: [
        (story, context) => {
            language.value = pickAppLanguage([String(context.globals['language'])]);
            const Story = story();
            return defineComponent({
                // As in `app.vue`: every component sits inside reka-ui's `ConfigProvider`.
                setup: () => () =>
                    h(
                        ConfigProvider,
                        { locale: language.value, dir: 'ltr', scrollBody: false },
                        { default: () => h(Story) },
                    ),
            });
        },
    ],
};

export default preview;
