---
name: code-conventions
description: >-
    How TypeScript, Vue and Rust code is written in poweragents — file organization and naming, function order, imports,
    casts, JSDoc, Vue SFC order and BEM classes. Use before writing, refactoring or reviewing any .ts, .vue or .rs file.
---

# Code conventions

## Paths

- App code by feature: `packages/app/<feature>/`, imported through the `@/` alias; nothing is auto-imported
  (`ARCHITECTURE.md`, "App and UI"). Components: `packages/ui/src/`.
- Library packages (`common`, `daemon`) import each other through their `exports`: `@poweragents/common/<file>.js`.
- Generated files, never edited by hand: `*.loc.ts`, every package's `tsconfig.json`.

## Commands

- `bun run lint:check`, `bun run format` (Markdown too); Rust: `cargo fmt` and `cargo clippy` in
  `packages/desktop/src-tauri`; the code map: `bun run index` (`INDEX.md`).

Links in the document below are relative to `nzyme/docs/practice/`; package READMEs are `nzyme/packages/<pkg>/README.md`.

!`cat nzyme/docs/practice/code-conventions.md`
