---
name: ui
description: >-
    Building components and screens in poweragents — components, stories and tokens in packages/ui, screens in
    packages/app. Use before creating or changing any .vue component, story or screen: props, styling, accessibility.
---

# UI

## Paths

- Components: `packages/ui/src/`, with their story (`*.stories.tsx`), spec (`*.spec.ts`), harness and `.loc.yaml`
  beside them.
- Tokens: `packages/ui/src/styles/tokens.scss` (injected everywhere, emits nothing); global CSS: `main.scss`.
- Screens: `packages/app/<feature>/`, routed only in `packages/app/app/router.options.ts`.

## Requirements

- Every component has a story per state, each a test in `bun run test:stories` with axe failing on WCAG 2.2 AA.
- Every text in Polish and English (`translations` skill); the Storybook toolbar switches the language.

## Decisions

- Components live in `packages/ui`, apart from the app: the phone companion will reuse them (`ARCHITECTURE.md`,
  "Decisions").
- Screens are drawn in `poweragents.pen` first (`design` skill); tokens follow its variables.

Links in the document below are relative to `nzyme/docs/practice/`; package READMEs are `nzyme/packages/<pkg>/README.md`.

!`cat nzyme/docs/practice/ui.md`
