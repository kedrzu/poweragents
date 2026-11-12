import { defineService } from '@nzyme/ioc/Service.js';
import { ref } from 'vue';

import { pickAppLanguage } from '@poweragents/common/appLanguages.js';
import type { AppLanguage } from '@poweragents/common/appLanguages.js';

/**
 * The language the app speaks: the first shipped one among the system's preferred languages, until the person picks
 * one. `current` is reactive, so every text follows a change.
 */
export const LanguageStore = defineService({
    name: 'LanguageStore',
    setup() {
        const current = ref<AppLanguage>(pickAppLanguage(navigator.languages));

        return {
            get current() {
                return current.value;
            },
            set(language: AppLanguage) {
                current.value = language;
            },
        };
    },
});
