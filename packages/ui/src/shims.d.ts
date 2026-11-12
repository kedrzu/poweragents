// The test-id attribute (`tid`, `locators.testIdAttribute` in `vitest.config.ts`) on any element in
// TSX, so stories can mark what a spec finds with `getByTestId`.
import 'vue';

declare module 'vue' {
    interface HTMLAttributes {
        /** Test id, found by `getByTestId` in component specs and e2e harnesses. */
        tid?: string;
    }
}
