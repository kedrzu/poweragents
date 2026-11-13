// Runs in the browser before each story test file: puts the test project's palette (`provide` in
// `vitest.config.ts`) on `<html>`, where `preview.ts` takes its initial palette from.
import { inject } from 'vitest';

import type { Palette } from '../src/styles/Palette.js';

declare module 'vitest' {
    interface ProvidedContext {
        /** The palette every story of this test project renders in. */
        palette: Palette;
    }
}

document.documentElement.dataset['palette'] = inject('palette');
