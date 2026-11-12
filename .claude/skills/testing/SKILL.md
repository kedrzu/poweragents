---
name: testing
description: >-
    Tests in poweragents — whether a change needs one, bun unit tests, story-based component tests in packages/ui and
    Playwright e2e in packages/e2e. Use before writing, changing or reviewing any *.test.ts, *.spec.ts or story.
---

# Testing

## Paths

- Unit and integration tests: `*.test.ts` beside the code, run by bun.
- Component tests: a story per state (`*.stories.tsx`) and `*.spec.ts` beside the component in `packages/ui/src/`, run in
  Chromium by Vitest.
- e2e: `packages/e2e/src/<feature>/<flow>.spec.ts`, screen harnesses in `packages/e2e/src/harnesses/`; it serves the
  app's static build.

## Requirements

- Every story fails its test on a WCAG 2.2 AA violation (`a11y.test: 'error'` in `packages/ui/.storybook/preview.ts`).
- `scripts/nxInputs.test.ts` guards the build cache; never delete it.

## Commands

- `bun run tests`; `bun run test:stories`; `bun run e2e` — scoped forms in the `verify` skill.

Links in the document below are relative to `nzyme/docs/practice/`; package READMEs are `nzyme/packages/<pkg>/README.md`.

!`cat nzyme/docs/practice/testing.md`
