---
name: composables
description: >-
    Vue composables in poweragents — use[Feature] functions, reactive returns, useService, data loading and events. Use
    before writing or changing a composable or component-scoped reactive logic in packages/ui or packages/app.
---

# Composables

## Paths

- Beside the component or screen that uses it (`use*.ts`); shared ones in `packages/ui/src/`.

## Decisions

- State shared across screens is a store service (`ioc` skill), not a composable.

Links in the document below are relative to `nzyme/docs/practice/`; package READMEs are `nzyme/packages/<pkg>/README.md`.

!`cat nzyme/docs/practice/composables.md`
