/**
 * The colour palettes still in the design until one is chosen, named as `$palettes` in `tokens.scss`
 * names them. `data-palette` on `<html>` picks one; without it the page is in {@link DEFAULT_PALETTE}.
 */
export const PALETTES = ['meadow', 'sunset', 'lemonade'] as const;

/** One of {@link PALETTES}. */
export type Palette = (typeof PALETTES)[number];

/** The palette of a page whose `<html>` has no `data-palette`, `$palette-default` in `tokens.scss`. */
export const DEFAULT_PALETTE: Palette = 'meadow';
