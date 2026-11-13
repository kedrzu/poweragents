# First run

The two wizard steps of [the first-run brief](../ui/first-run.md) that the first working version needs: preparing the
agent's environment on the person's Mac and connecting a Claude subscription, before the main screen exists. Base:
`ecbdbcf`.

## Round 1 · agent in the app

Asked (`.context/first-run-brief.md`): seven full-window screens, Polish, no sidebar, a calm centred wizard; progress
through the three steps the app really reports; the failure with retry and technical details; the provider choice
with ChatGPT shown as an equal but disabled card; pasting Claude's sign-in code, the rejected code, the plan that does
not allow it, and the confirmation.

Changed: a components frame and seven screens in a new row under screen 34. Codes 35–41 (34 was already taken). The
existing screens have no captions or row titles, so none were added.

- [x] Variables: new `font-mono` (string, `JetBrains Mono`) for the technical details and the pasted code.
- [x] First run · components (`bDnfo`): new frame at the start of the row.
  - [x] `atoms/Step number/Done` (`yUTXk`): new; a `$brand-1` circle with a check, the done form of
    `atoms/Step number`.
  - [x] `molecules/Instruction step` (`aeCOW`): `atoms/Step number` and a line of text.
  - [x] `molecules/Provider card` (`H3hsbO`, Claude, primary *Połącz z Claude*) and `/Soon` (`Rk7mi`, ChatGPT,
    greyed, *Wkrótce* badge, the button muted).
  - [x] `molecules/Code field` (`f8H1g`, label, input with *Wklej*, help line) and `/Error` (`Y2wwo5`, `$attention`
    stroke, the pasted code in `font-mono`, the error message).
- [ ] 36 First run · preparing failed (`WLU1H`): new; "To nie Twój błąd…", nothing changed on the computer, restart
  hint; step 1 failed; *Spróbuj ponownie* and the details shown open (*Ukryj szczegóły*, two monospace lines).
- [ ] 38 First run · connect Claude · paste the code (`SYZVg`): new; three numbered steps, the code field, *Wróć*,
  *Otwórz stronę logowania ponownie*, *Połącz*.
- [ ] 39 First run · connect Claude · code rejected (`cDF2e`): new; 38 with `Code field/Error`.
- [ ] 40 First run · connect Claude · plan does not allow it (`Z3zuw`): new; the signed-in account, "Agent działa z
  planem: Claude Pro, Claude Max", *Zaloguj się innym kontem*, *Zobacz plany Claude*, *Wróć*.
- [ ] 41 First run · Claude connected (`el9sP`): new; the account with a check, what happens next, *Przejdź do
  aplikacji*.

## Round 2 · owner in the app

Asked: "this wizard I really don't like", then several other directions for the first run. Four were drawn on the two
key moments (preparing the environment, connecting Claude) in a `Variants` frame: A, the agent leads setup inside the
real app shell's first conversation; B, a split window with the whole path on a dark panel; C, one large sentence per
screen; D, the whole path as one checklist card. The owner picked B: "go with variant B, drop the others, add the
missing screens". Codes 42, 43 and 46–49 went with the rejected variants and are not reused.

Changed: the centred wizard is replaced everywhere by the split shell. Round 1's entries for the wizard shell, wizard
steps, progress steps and screens 35 and 37 were removed above; 44 and 45 replace 35 and 37. Screens 36 and 38–41
keep their codes and their step content, now in the split shell's step pane.

- [x] First run · components (`bDnfo`):
  - [x] `molecules/Path stage` (`ypFu6`, waiting) with `/Current` (`PGihN`, `$brand-1` dot ringed white), `/Done`
    (`pJMyt`, check, `$brand-1` line) and `/Failed` (`X1PFC3`, x on `$attention`): dot, connecting line, title, hint;
    drawn for the dark panel.
  - [x] `molecules/Progress bar` (`nwmvW`): a 10 px track on `$surface-soft`, the fill in `$brand-1`, what is happening
    now and the time left.
  - [x] `templates/Split wizard shell` (`eGNnb`): 1440×900; a 540 px `$ink` story panel (traffic lights, brand, the
    headline "Twój agent się wprowadza. Za kilka minut porozmawiacie.", a `Path` slot with three stages —
    *Bezpieczne miejsce pracy*, *Połączenie z AI*, *Pierwsza rozmowa* — and the footnote "Nic nie instaluję…");
    a white `Step` slot, vertically centred, 120 px side padding: eyebrow (*KROK 1 Z 2*), 36 px title, body.
  - [x] `molecules/Instruction step` (`aeCOW`): recreated unchanged after it was deleted by mistake; its id changed.
- [ ] 44 First run · preparing the environment (`dHIpK`): new, replaces 35; stage 1 current; "Przygotowuję miejsce
  pracy agenta", `Progress bar`, "Możesz zminimalizować okno — dam znać, gdy będzie gotowe."
- [ ] 36 First run · preparing failed (`WLU1H`): split shell; stage 1 failed, hint "Nie udało się — spróbuj ponownie".
- [ ] 45 First run · connect your AI (`ZUVSg`): new, replaces 37; stage 1 done, 2 current; the provider cards in a
  row.
- [ ] 38 (`SYZVg`), 39 (`cDF2e`), 40 (`Z3zuw`): split shell; stage 1 done, 2 current; *KROK 2 Z 2*.
- [ ] 41 First run · Claude connected (`el9sP`): split shell; stages 1 and 2 done, 3 current; eyebrow *GOTOWE*; the
  panel headline "Wszystko gotowe. Czas się poznać."

## Round 3 · implementation

Built the tokens, the three palettes and the components of rounds 1 and 2 in `packages/ui` (screens 44 and 38 are
composed in the shell's stories; the screens themselves are not built yet). Forced by: the story tests' axe check
(WCAG 2.2 AA) in each palette. Text, or a white icon, on `$brand-1` reached 3.9:1 in Meadow, 3.2:1 in Sunset and
2.5:1 in Lemonade, and the progress fill against its track 2.9:1 and 2.3:1 in Sunset and Lemonade. `poweragents.pen`
is not changed in this round; the entries wait for it.

- [x] Variables: new `brand-1-strong` in the `palette` theme, `$brand-1` darkened to 4.5:1 with white both ways:
  Meadow `#357A59`, Sunset `#B8532A`, Lemonade `#8F6410`.
- [x] `templates/Split wizard shell` (`eGNnb`) and every screen's eyebrow: `$brand-1` → `$brand-1-strong`.
- [x] `molecules/Path stage/Current` (`PGihN`) and `/Done` (`pJMyt`) dot: `$brand-1` → `$brand-1-strong`; the
  done line stays `$brand-1`.
- [x] `atoms/Step number/Done` (`yUTXk`): `$brand-1` → `$brand-1-strong`.
- [x] `molecules/Progress bar` (`nwmvW`) fill: `$brand-1` → `$brand-1-strong`.
- [x] `atoms/Step number` (`h8PbUl`) and `molecules/Instruction step` (`aeCOW`) number: `$attention-muted` →
  `$attention-ink` (3.8:1 → 4.9:1 at 11.5 px).
- [x] `molecules/Code field` (`f8H1g`) placeholder: `$ink-faint` → `$ink-muted` (3.0:1 → 5.8:1).

Built differently without a change to the drawing: the shell leaves the window bar's 48 px empty instead of drawing
traffic lights (the window's own buttons go there); the story panel narrows to 340 px and the step pane's side padding
to 24 px on smaller windows, and below 720 px the panel stacks above the step; the step's content stops at 660 px on
wider ones. Headings use Bricolage Grotesque's 96 optical size at every size, which is how the design renders it.

## Round 4 · implementation

Forced by: the app sends no notification yet, so the hint on 44 must not promise one. Built the screens of round 2 in
`packages/app/setup/`; the account card, plan checklist and error details of 36, 40 and 41 became `AccountCard`,
`CheckList` and `ErrorDetails` in `packages/ui`.

- [x] 44 First run · preparing the environment (`dHIpK`) hint: "…dam znać, gdy będzie gotowe." → "Możesz
  zminimalizować okno — gdy wszystko będzie gotowe, sam przejdę dalej."
- [x] 44 `molecules/Progress bar` (`nwmvW`) hint with the time left: dropped in the build — the app has no real
  estimate; the bar is indeterminate with a label per phase.
- [x] 36 First run · preparing failed (`WLU1H`): the details start collapsed (*Pokaż szczegóły*).

## Round 5 · design sync

Asked (`.context/projects-brief.md`, part A): apply rounds 3 and 4 to the drawing, make the code's `CheckBadge` a
component, and draw the screen the code added for a failed check of the AI connection. Rounds 3 and 4 are ticked
above: the drawing now matches them.

- [x] Variables: `brand-1-strong` added as round 3 lists it.
- [x] Eyebrows: `templates/Split wizard shell` (`eGNnb`) and screens 36, 38, 39, 40, 41, 44, 45 (each screen's own
  eyebrow override) `$brand-1` → `$brand-1-strong`.
- [x] `molecules/Path stage/Current` (`PGihN`), `/Done` (`pJMyt`) dot, `molecules/Progress bar` (`nwmvW`) fill:
  `$brand-1` → `$brand-1-strong`; the done line stays `$brand-1`.
- [x] `atoms/Step number` (`h8PbUl`) value `$attention-muted` → `$attention-ink`; `molecules/Code field` (`f8H1g`)
  placeholder `$ink-faint` → `$ink-muted`.
- [x] `molecules/Progress bar` (`nwmvW`): the time-left label (`jHqBB`) hidden in the component, not only on 44 — the
  built bar has no estimate anywhere.
- [x] 44 (`dHIpK`) hint: the round 4 text. 36 (`WLU1H`): details hidden, *Pokaż szczegóły* with a chevron down.
- [x] Atoms (`R3GuU`) › Indicators: new `atoms/Check badge` (`l60d8L`), the code's `CheckBadge`: a 22 px
  `$brand-1-strong` circle, white 13 px check, optional label (14 px, 600, `$ink`, hidden by default); beside it an
  example instance with the label shown.
- [x] `atoms/Step number/Done` (`yUTXk`): its own circle and icon → one `atoms/Check badge` instance (the frame lost
  its fill and radius).
- [x] 40 (`Z3zuw`) plan checklist: the hand-drawn check and label pairs (`sZHsK`, `ZtYzE`, holding `JDphx`, `GZKq6`)
  → labelled `Check badge` instances. 41 (`el9sP`) account card: `RxxMJ` → a `Check badge` instance.
- [x] 50 First run · checking the AI connection failed (`A5mQ00`): new, a copy of 36 at step 2 (*KROK 2 Z 2*); stage 1
  done, stage 2 failed ("Nie udało się — spróbuj ponownie"), stage 3 waiting; "Nie udało się sprawdzić połączenia z
  Claude", the body says nothing is lost and the workspace is ready; *Spróbuj ponownie*, details collapsed.
