import { CommonPlugin } from '@nzyme/vue/CommonPlugin.js';
import { createContainer } from '@nzyme/vue-ioc/createContainer.js';
import { IocPlugin } from '@nzyme/vue-ioc/IocPlugin.js';
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app';

import { DaemonUrl } from '@/daemon/DaemonUrl.js';
import { AppLanguageContext } from '@/i18n/AppLanguageContext.js';

/** Creates the app's IoC container and registers what every screen relies on. */
export default defineNuxtPlugin({
    name: 'ioc-plugin',
    setup(nuxtApp) {
        const container = createContainer();
        nuxtApp.vueApp.use(IocPlugin, { container });
        // Swallows `CancelError` in unhandled rejections and Vue's error handler.
        nuxtApp.vueApp.use(CommonPlugin);

        container.register(AppLanguageContext);
        container.set(DaemonUrl, useRuntimeConfig().public.daemonUrl);
    },
});
