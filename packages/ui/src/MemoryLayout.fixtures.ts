import type { MemoryLayoutFile } from './MemoryLayout.vue';

// Screen 63's Memory, shared by the Memory stories. Now: Saturday 14 November 2026, 15:00 in the computer's time zone.

/** The moment the fixtures' changes are told against. */
export const MEMORY_NOW = new Date(2026, 10, 14, 15, 0).getTime();

/** Screen 63's six files, newest first; the first changed by the agent a moment ago. */
export const MEMORY_FILES: MemoryLayoutFile[] = [
    { path: 'praca.md', title: 'Praca i szukanie pracy', updatedAt: MEMORY_NOW - 20_000, changed: true },
    { path: 'o-mnie.md', title: 'O mnie', updatedAt: new Date(2026, 10, 13, 18, 30).getTime(), changed: false },
    {
        path: 'skora.md',
        title: 'Skóra i pielęgnacja',
        updatedAt: new Date(2026, 10, 10, 9, 0).getTime(),
        changed: false,
    },
    { path: 'instagram.md', title: 'Instagram', updatedAt: new Date(2026, 10, 7, 12, 0).getTime(), changed: false },
    {
        path: 'jak-lubie-pracowac.md',
        title: 'Jak lubię pracować',
        updatedAt: new Date(2026, 10, 5, 12, 0).getTime(),
        changed: false,
    },
    { path: 'ludzie.md', title: 'Ludzie', updatedAt: new Date(2026, 10, 2, 12, 0).getTime(), changed: false },
].map(file => ({ ...file, to: `/memory?file=${file.path}` }));

/** Screen 63's open file. */
export const WORK_MARKDOWN = [
    '# Praca i szukanie pracy',
    '',
    'Projektantka produktu, dziewięć lat doświadczenia, głównie fintech (Revolut, potem startup płatniczy). Najmocniejsza w upraszczaniu zagmatwanych procesów.',
    '',
    '## Czego szukam',
    '',
    '- **Rola:** senior product designer',
    '- **Gdzie:** hybrydowo w Warszawie albo zdalnie w UE',
    '- **Wynagrodzenie:** od 18 000 zł miesięcznie',
    '- **Branża:** health tech albo fintech, bez krypto',
    '',
    '## Aplikacje',
    '',
    'Prowadzone w projekcie Szukanie pracy. Listy motywacyjne krótkie: trzy akapity, bez korpomowy.',
].join('\n');
