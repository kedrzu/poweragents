import { LanguageContext } from '@nzyme/i18n/LanguageContext.js';
import { useService } from '@nzyme/vue-ioc/useService.js';
import { defineNuxtPlugin, useHead } from 'nuxt/app';
import { computed } from 'vue';

/** Keeps `<html lang>` on the language the container provides. */
export default defineNuxtPlugin({
    name: 'language-plugin',
    dependsOn: ['ioc-plugin'],
    setup(nuxtApp) {
        const language = nuxtApp.vueApp.runWithContext(() => useService(LanguageContext));
        useHead({ htmlAttrs: { lang: computed(language) } });
    },
});
