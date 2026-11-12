import { expect, test } from 'bun:test';

import { pickAppLanguage } from './appLanguages.js';

test('picks the first preferred language the product ships, by its primary subtag', () => {
    expect(pickAppLanguage(['de-DE', 'PL-pl', 'en-US'])).toBe('pl');
    expect(pickAppLanguage(['en-GB', 'pl'])).toBe('en');
});

test('falls back to English when no preferred language is shipped', () => {
    expect(pickAppLanguage(['de-DE', 'fr'])).toBe('en');
    expect(pickAppLanguage([])).toBe('en');
});
