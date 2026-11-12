---
name: design
description: >-
    Designing poweragents' screens in Pen — the poweragents.pen file, its frames, screen names, palettes and design
    briefs. Use before changing poweragents.pen, writing a design brief or building a screen from the design.
---

# Design

## The design file

- `poweragents.pen` at the repo root, the one design file.
- Top-level frames: `Atoms`, `Molecules`, `Organisms`, `Templates` (the design system, reusable nodes named by level,
  e.g. `templates/App shell`, `molecules/Schedule row`), then per walk a components frame (`Daily work · components`)
  and its screens.
- Screens are numbered `NN Area · state` (`01 Waiting for you`, `05 Conversation · agent working`), following the walks
  in `docs/design/poweragents/ui/`.

## Visual direction

- Colours, fonts and radii are variables (`ink`, `surface`, `attention`, `brand-1`, `project-*`, `font-heading`, …).
  Never a raw value on a node.
- The `palette` theme holds three candidates, `meadow`, `sunset` and `lemonade`, shown side by side as
  `Main screen · <palette>`. Keep every new screen working in all three until one is chosen.

## Where things are recorded

- What the product is and why: `docs/design/poweragents/` (`README.md`, `DECISIONS.md`); design rounds go to
  `docs/design/poweragents/history/JOURNAL.md`.

If the practice document isn't inlined below, read `nzyme/docs/practice/design.md` before changing the design.

Links in the document below are relative to `nzyme/docs/practice/`; package READMEs are `nzyme/packages/<pkg>/README.md`.

!`cat nzyme/docs/practice/design.md`
