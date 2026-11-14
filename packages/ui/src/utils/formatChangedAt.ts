import { translateToString } from '@nzyme/i18n/translateToString.js';

import * as l from './formatChangedAt.loc.js';

/** What `formatChangedAt` needs. */
export interface FormatChangedAtParams {
    /** Epoch ms of the change. */
    changedAt: number;
    /** Epoch ms of now. */
    now: number;
    /** The language to say it in. */
    language: string;
}

/** Under this long ago, a change happened "just now". */
const JUST_NOW_MS = 60_000;
/** Within this many calendar days, a change is named by its weekday. */
const WEEKDAY_DAYS = 6;
const WEEKDAYS = [l.day0, l.day1, l.day2, l.day3, l.day4, l.day5, l.day6] as const;

/**
 * When something changed, as a person says it, in the computer's time zone: "just now", "today at 14:05", "yesterday",
 * "on Tuesday" within the week, then the date ("8 listopada", "November 8", with the year once it is another year's). A time ahead
 * of now (a clock moved back) is "just now".
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function formatChangedAt({ changedAt, now, language }: FormatChangedAtParams): string {
    if (now - changedAt < JUST_NOW_MS) {
        return translateToString(l.justNow, language);
    }
    const when = new Date(changedAt);
    const today = new Date(now);
    const days = calendarDaysBetween(when, today);
    if (days === 0) {
        const time = when.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
        return translateToString(l.today, language, { time });
    }
    if (days === 1) {
        return translateToString(l.yesterday, language);
    }
    const weekday = WEEKDAYS[when.getDay()];
    if (days <= WEEKDAY_DAYS && weekday) {
        return translateToString(weekday, language);
    }
    return when.toLocaleDateString(language, {
        day: 'numeric',
        month: 'long',
        year: when.getFullYear() === today.getFullYear() ? undefined : 'numeric',
    });
}

/** How many midnights lie between two times, in the local time zone (a DST change does not count). */
function calendarDaysBetween(earlier: Date, later: Date) {
    const start = Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
    const end = Date.UTC(later.getFullYear(), later.getMonth(), later.getDate());
    return Math.round((end - start) / 86_400_000);
}
