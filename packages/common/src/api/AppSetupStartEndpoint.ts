import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import { APP_LANGUAGES } from '../appLanguages.js';
import { readString } from '../utils/readString.js';
import type { AppSetupStartInput, AppSetupStartResult } from './AppSetupTypes.js';
import { createInputSchema } from './utils/createInputSchema.js';

const input = createInputSchema<AppSetupStartInput>(
    `{ language: ${APP_LANGUAGES.map(language => `'${language}'`).join(' | ')}, conversationTitle: string }`,
    value => {
        const language = APP_LANGUAGES.find(candidate => candidate === readString(value, 'language'));
        const conversationTitle = readString(value, 'conversationTitle');
        return language === undefined || conversationTitle === undefined ? undefined : { language, conversationTitle };
    },
);

/**
 * Creates App setup, once per profile, and starts its onboarding conversation, where the agent speaks first. The app
 * asks once the first run is done; every later ask answers `onboarding: null`.
 */
export const AppSetupStartEndpoint = defineEndpoint<AppSetupStartInput, AppSetupStartResult>({
    name: 'appSetup/start',
    input,
});
