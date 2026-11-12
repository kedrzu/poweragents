import { LanguageContext } from '@nzyme/i18n/LanguageContext.js';
import { defineService } from '@nzyme/ioc/Service.js';

import { LanguageStore } from '@/i18n/LanguageStore.js';

/** `LanguageContext` for every translating service and component: the app's current language. */
export const AppLanguageContext = defineService({
    name: 'AppLanguageContext',
    implements: LanguageContext,
    deps: { languages: LanguageStore },
    setup({ languages }) {
        return () => languages.current;
    },
});
