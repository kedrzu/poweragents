import { expect, test } from 'vitest';

import { formatChangedAt } from './formatChangedAt.js';

// Times are the computer's local ones, as the function reads them. Now: Saturday 14 November 2026, 15:00.
const NOW = new Date(2026, 10, 14, 15, 0).getTime();

test('names a change by how long ago it was, as a person says it', () => {
    const cases = [
        { changedAt: NOW - 30_000, pl: 'przed chwilą', en: 'just now' },
        { changedAt: NOW + 60_000, pl: 'przed chwilą', en: 'just now' },
        { changedAt: new Date(2026, 10, 14, 9, 5).getTime(), pl: 'dziś o 09:05', en: 'today at 09:05 AM' },
        { changedAt: new Date(2026, 10, 13, 23, 59).getTime(), pl: 'wczoraj', en: 'yesterday' },
        { changedAt: new Date(2026, 10, 10, 8, 0).getTime(), pl: 'we wtorek', en: 'on Tuesday' },
        { changedAt: new Date(2026, 10, 8, 8, 0).getTime(), pl: 'w niedzielę', en: 'on Sunday' },
        { changedAt: new Date(2026, 10, 7, 8, 0).getTime(), pl: '7 listopada', en: 'November 7' },
        { changedAt: new Date(2025, 11, 31, 8, 0).getTime(), pl: '31 grudnia 2025', en: 'December 31, 2025' },
    ];
    for (const { changedAt, pl, en } of cases) {
        expect({
            changedAt,
            pl: withPlainSpaces(formatChangedAt({ changedAt, now: NOW, language: 'pl' })),
            en: withPlainSpaces(formatChangedAt({ changedAt, now: NOW, language: 'en' })),
        }).toEqual({ changedAt, pl, en });
    }
});

/** No-break spaces (the translations glue short words, `Intl` glues AM) compare as spaces. */
function withPlainSpaces(text: string) {
    return text.replaceAll(/\s/g, ' ');
}
