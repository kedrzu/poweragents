import type { Language } from '@nzyme/i18n/Language.js';

/** The languages the product ships, in order of preference when nothing else decides. */
export const APP_LANGUAGES = ['pl', 'en'] as const satisfies readonly Language[];

/** A language the product ships; every `.loc.yaml` key has a text for each of them. */
export type AppLanguage = (typeof APP_LANGUAGES)[number];

/** The language used when none of the person's preferred languages is shipped. */
export const FALLBACK_LANGUAGE: AppLanguage = 'en';

/**
 * Picks the first shipped language among `preferred`, which are BCP 47 tags in order of preference
 * (`navigator.languages`, e.g. `['pl-PL', 'en-US']`); {@link FALLBACK_LANGUAGE} when none is shipped.
 */
export function pickAppLanguage(preferred: readonly string[]): AppLanguage {
    for (const tag of preferred) {
        const language = APP_LANGUAGES.find(candidate => candidate === tag.toLowerCase().split('-')[0]);
        if (language) {
            return language;
        }
    }

    return FALLBACK_LANGUAGE;
}
