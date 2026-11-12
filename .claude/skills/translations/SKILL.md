---
name: translations
description: >-
    User-facing text in poweragents — .loc.yaml files in Polish and English, useTranslate, Translator. Use before adding
    or changing any text a person sees, in packages/ui, packages/app or the daemon.
---

# Translations

## Requirements

- Every key has `pl` and `en` (`APP_LANGUAGES` in `packages/common/src/appLanguages.ts`); a missing one renders as an
  empty string. Machine-written translations carry `[auto]`.

## Decisions

- The app's language: the first of `pl` and `en` among the system's preferred languages, English when neither is
  (`ARCHITECTURE.md`, "App and UI"). Poland is the first market (design D7).

## Commands

- `bun run localise` compiles `.loc.yaml` to `.loc.ts`; `bun run codegen` runs it with the rest.

Links in the document below are relative to `nzyme/docs/practice/`; package READMEs are `nzyme/packages/<pkg>/README.md`.

!`cat nzyme/docs/practice/translations.md`
