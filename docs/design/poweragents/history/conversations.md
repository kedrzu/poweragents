# Conversations

Inside a project the person talks to the agent; a project holds many conversations, and the agent works on the
project's files and shows what it is doing. This is the step after projects ([projects.md](projects.md)) in the first
working version, so the screens use the projects-only sidebar and draw nothing that is not built: no Waiting for you,
Memory, Downloads, Plugins, Schedules, files in the sidebar, tabs for files, attachments, voice or profile row. Base:
`ab15712`.

## Round 1 · agent in the app

Asked (`.context/conversation-brief.md`): screen 05 in the projects-only shell with the agent working, the same
conversation finished with a rich-text reply, a project with several conversations and where a new one starts, and the
agent failing to answer (a generic provider error, signed out of Claude, usage limit); Polish, full window, all three
palettes.

Changed: six screens in a new row beside and under 51–55 (codes 56–61), five components in a new `Steps` column of
Molecules. Decisions the brief left open:

- **A new conversation starts in one place:** a *Nowa rozmowa* row (`plus`) first under the open project in the
  sidebar, next to the list it adds to. The tab bar has no *+*. Clicking the project row selects that row too and
  shows 54's empty state.

- **The open project lists all its conversations**, newest first, with no *Wszystkie rozmowy* link: the project
  history screen (11) is not built.

- **Conversation rows show their leading `message-circle`** in these screens (05 hid it), so the labels line up with
  *Nowa rozmowa*'s `plus`.

- **A running conversation's spinner is the row's trailing icon:** the `Schedule` icon (`g1fOgp`) overridden to
  `loader-circle` in `$brand-1`, matching the project row's trailing spinner. Adding a dedicated `Working` icon to
  `molecules/Conversation row` failed in Pen (a duplicate-id error from the instances); the build should treat the
  trailing icon as the row's state slot.

- **One tab**, the open conversation, without a close button (as 54): a running one shows `loader-circle` in
  `$brand-1`, a finished one `message-circle` in the project's colour; a new conversation's tab reads *Nowa rozmowa*.

- **Steps are tool calls in the present tense** for done and current alike ("Czytam plik notatki.md"), so no
  gendered past form is needed; done ones ticked, the current one spinning, no planned steps.

- **After a known failure the message line has no retry** (60, 61): the banner holds the fix; once it is done, the
  line is 59's, with *Spróbuj ponownie*. When Claude gives no reset time, 61's subtitle should read "Limit odnowi się
  za jakiś czas; Claude nie podał kiedy." (not drawn).

- [ ] Molecules (`yh5Lh`) › Columns: new `Steps` column (`ByR9d`); the frame widens 1840 → 2360, nothing moved.

- [ ] `molecules/Step` (`OT2tB`): new; a done tool call, `check` 14 px `$ink-faint` and a 13.5 px `$ink-muted` label.

- [ ] `molecules/Step/Current` (`IPTE4`): new, an instance of `Step`; `loader-circle` in `$brand-1`, label `$ink`
  600.

- [ ] `molecules/Steps summary` (`S5OxF`): new; the collapsed steps of a finished reply, `chevron-right` and "4
  kroki" in `$ink-muted`, expands to the step list.

- [ ] `molecules/Step list` (`ErRt3`): new; 05's activity box (`$surface-soft`, radius 14, padding 12/14) with a
  `Steps` slot (`TybFl`) for `Step` and `Step/Current`.

- [ ] `molecules/Message error` (`F2EUSi`): new; right-aligned under the failed message, `circle-alert` in
  `$attention`, a 13 px `$ink-body` line and *Spróbuj ponownie* (`atoms/Button/Ghost`, `rotate-ccw`), hideable.

- [ ] 56 Conversation · agent working (`W5mGCf`): new; Zdrowie open in the sidebar with *Nowa rozmowa* and four
  conversations, *Poranna rutyna na zimę* selected and spinning (the project row spins too); the user's message, the
  agent's reply streaming with a `Step list` (three done steps, *Zapisuję plik plan.md* current) and the caret; 05's
  hint "Możesz pisać dalej — agent przeczyta Twoją wiadomość, gdy skończy bieżący krok."; the composer "Dopisz coś,
  gdy agent pracuje…" with *Zatrzymaj* (attach hidden).

- [ ] 57 Conversation · finished (`o6TKQ3`): new; spinners gone, the tab's icon `message-circle` in `$project-pink`;
  the reply starts with `Steps summary` "4 kroki", then a heading, a paragraph, a numbered list with bold leads, a
  link in `$link-ink` underlined, a second heading, a code block (`$font-mono` on `$surface-soft`) and a closing line;
  the composer "Napisz do agenta…" with attach and voice hidden (as 54).

- [ ] 58 Project · conversations (`Z4a0W`): new; *Nowa rozmowa* selected under Zdrowie, *Poranna rutyna na zimę*
  still running; tab *Nowa rozmowa*; 54's empty state retitled "Nowa rozmowa w projekcie Zdrowie", "Agent pracuje na
  plikach tego projektu. Poprzednie rozmowy są po lewej."

- [ ] 59 Conversation · the agent could not answer (`p4oNyk`): new; a finished reply with its steps collapsed, then
  the failed message "Dodaj jeszcze wieczorną rutynę…" with `Message error` "Agent nie odpowiedział: Claude zgłosił
  błąd po swojej stronie." and *Spróbuj ponownie*.

- [ ] 60 Conversation · signed out of Claude (`R2oyK`): new, from 59; the line "Bez odpowiedzi: wylogowano Cię z
  Claude." without retry; above the composer 14's banner "Wylogowano Cię z Claude", "Agent nie odpowie, dopóki nie
  zalogujesz się ponownie. Twoja wiadomość zostaje w rozmowie." with *Zaloguj się ponownie*
  (`atoms/Button/On tint/Attention`, `log-in`).

- [ ] 61 Conversation · Claude usage limit reached (`Op6Oi`): new, from 59; the line "Bez odpowiedzi: wykorzystano
  limit Claude."; the banner "Wykorzystano limit Claude", "Limit odnowi się w czwartek o 14:00. Wtedy agent znów
  odpowie." with no action (15's plans and reminder are not built).

Open: codes 56–61 are taken here, so the unticked *Main · projects could not be loaded* screen in
[projects.md](projects.md) (round 3) takes 62 or later.

## Round 2 · implementation

Forced by accessibility and by states the drawings leave open, while building M4 (no node changed yet):

- [ ] Spinners (`Step/Current`, running `Conversation row`, project row, tab): `loader-circle` in `$brand-1` →
  `$brand-1-strong`; `$brand-1` is for fills and lines and misses 3:1 for an icon in some palettes.
- [ ] `molecules/Step` failed state (not drawn): `circle-x` in `$attention`, the label as for a done step; screen readers
  hear "(failed)" after it, and "(in progress)" after the current step.
- [ ] A conversation the agent has not named yet reads *Rozmowa bez tytułu* in the sidebar and the tab (not drawn).
- [ ] Code blocks in a reply wrap long lines instead of scrolling sideways; a wide table scrolls in a focusable box.
- [ ] The messages column is a named, focusable region (*Wiadomości*), so the keyboard scrolls a conversation that holds
  no control; its focus ring is drawn inside the card.
