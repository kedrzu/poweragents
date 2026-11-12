---
name: ioc
description: >-
    Dependency injection in poweragents — services, commands, stores, interfaces and env variables with @nzyme/ioc, and
    the app's one container. Use before creating or changing a service, command or store, or wiring dependencies.
---

# IoC

## Paths

- The app's container: `packages/app/plugins/iocPlugin.ts`; every other plugin states `dependsOn: ['ioc-plugin']`.
- App services beside their feature (`packages/app/<feature>/*Service.ts`, `*Store.ts`); the language:
  `packages/app/i18n/`.

## Decisions

- `LanguageContext` is `AppLanguageContext`, reading `LanguageStore` (`ARCHITECTURE.md`, "App and UI"). The Storybook
  preview (`packages/ui/.storybook/preview.ts`) registers the same interfaces as the app's container.

Links in the document below are relative to `nzyme/docs/practice/`; package READMEs are `nzyme/packages/<pkg>/README.md`.

!`cat nzyme/docs/practice/ioc.md`
