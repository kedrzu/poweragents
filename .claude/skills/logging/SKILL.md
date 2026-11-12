---
name: logging
description: >-
    Logging in poweragents with @nzyme/logging — the Logger, levels, structured fields, caught errors. Use before
    adding a log line or handling a caught error in the daemon or the app.
---

# Logging

## Decisions

- The daemon is a background process with no window: what it logs is the only trace of a schedule that ran while the
  app was closed (`ARCHITECTURE.md`, "Desktop shell and daemon").

Links in the document below are relative to `nzyme/docs/practice/`; package READMEs are `nzyme/packages/<pkg>/README.md`.

!`cat nzyme/docs/practice/logging.md`
