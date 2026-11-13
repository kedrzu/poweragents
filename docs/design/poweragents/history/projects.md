# Projects

After the first run the person lands in the app. In the first working version only projects exist: a project is a
folder of files the agent works in ([D8](../DECISIONS.md#d8)); its conversations come in the next step. Plugins,
schedules, Memory, Downloads and Waiting for you are not built yet, and the owner decided the sidebar shows only
projects for now — nothing greyed out, no dead links. Base: `afad698`.

## Round 1 · agent in the app

Asked (`.context/projects-brief.md`, part B): the main screen with no projects, creating a project with its empty and
duplicate-name states, a project open, and a project that could not be created; Polish, full window, all three
palettes.

Changed: five screens in a new row under the first run (codes 51–55; 50 went to the first run), five components. Moving
Molecules and Daily work · components right made room for the new components; nothing inside them moved.

- [x] Atoms (`R3GuU`) › Buttons: new `atoms/Button/Primary/Disabled` (`DSqNr`), an instance of `Primary` with a
  `$border` fill and `$ink-muted` icon and label (as on `Provider card/Soon`).
- [x] Molecules (`yh5Lh`): new `Forms` column with `molecules/Text field` (`MMJZH`: label, 48 px input, hidden help
  line) and `/Error` (`c2QfT`: `$attention` stroke, help line shown in `$attention-ink` with `circle-alert`). Frame moved
  x 915 → 1300 (it overlapped Atoms).
- [x] Organisms (`M1u0SQ`) › Row: new `organisms/Sidebar/Projects only` (`PxUyk`), an instance of `organisms/Sidebar`
  with the Waiting card, the nav (Search, About you, Downloads, Plugins, Schedules) and the profile row hidden; the
  window-bar button reads *Nowy projekt* with `folder-plus`; the section header reads *Projekty* without its icon;
  the slot holds "Nie masz jeszcze projektów."
- [x] Organisms › Row 2: new `organisms/New project dialog` (`H2wuJ`), 440 px, styled like screen 17's dialog: title
  *Nowy projekt*, a hidden error box (`$attention-soft`), the name field (*Nazwa projektu*, "np. Szukanie pracy"), the
  quiet line "Pliki będą w folderze Poweragents w Twoim katalogu domowym." with a folder icon, *Anuluj* and *Utwórz*.
- [x] Daily work · components (`C1PeFe`): moved x 1700 → 2020, room for the wider Organisms frame.
- [ ] 51 Main · no projects yet (`MgYAZ`): new; `Sidebar/Projects only` empty, no tab bar; the main card centres three
  example project rows under *Na przykład* (Szukanie pracy, Zdrowie, Posty na Instagram), "Zacznij od pierwszego
  projektu", one sentence on what a project is, *Utwórz pierwszy projekt*.
- [ ] 52 Main · new project (`H8bBPa`): new; the dialog over 51 behind the frosted scrim of 17, the name empty and
  *Utwórz* disabled.
- [ ] 53 Main · new project · name already used (`fDVhG`): new; over 54, "Zdrowie" in `Text field/Error` with "Masz
  już projekt o tej nazwie.", *Utwórz* disabled.
- [ ] 54 Main · project open (`i912PM`): new; three projects in the sidebar, Zdrowie selected (as Wardrobe on 12:
  glass fill, `folder-open`, 600); one tab *Zdrowie*; 12's empty state in Polish ("Projekt Zdrowie jest gotowy") with
  the composer. The composer's attach and voice controls are hidden: neither is built, and the brief rules out dead
  controls; 12's starter suggestions and drop hint are left out for the same reason.
- [ ] 55 Main · project could not be created (`f6bwM`): new; over 54, the dialog's error box shown ("Nie udało się
  utworzyć projektu", no space on the disk, free some and try again), the name "Dziennik snu" kept, *Spróbuj ponownie*
  in place of *Utwórz*.

## Round 2 · implementation

Forced by building the components (`packages/ui`): the story tests' contrast check and the brief's rule against dead
controls. `poweragents.pen` was open in the owner's Pen app, so none of these is drawn yet.

- [ ] `organisms/Sidebar/Projects only` (`PxUyk`): the *Projekty* header `$ink-faint` → `$ink-body`. `$ink-faint` is
  2.2–2.5:1 on the sidebar's background, below the 4.5:1 text needs; `$ink-body` is 5.6–6.4:1 there in every
  palette. Built (`ProjectSidebar`); the file still draws `$ink-faint`.
- [ ] `organisms/Sidebar/Projects only` (`PxUyk`): the window bar's traffic lights are the native window's, not drawn
  by the app; the bar keeps their 48 px.
- [ ] 54 Main · project open (`i912PM`), the tab: no close button, since closing the only open tab leads nowhere yet
  (a dead control); its folder in the project's colour, as in the sidebar, instead of `$project-blue` (`ProjectTab`).

## Round 3 · implementation

Forced by review: the app needed a state the design did not draw, and screen 55's message promised a cause the app
cannot know.

- [ ] New screen, next free code, *Main · projects could not be loaded*: in place of the route's screen, the title
  "Nie udało się wczytać projektów", "To nie Twój błąd, a Twoje pliki są bezpieczne w folderze Poweragents…",
  `ErrorDetails` collapsed with *Spróbuj ponownie* (built as `ProjectsLoadFailed` in the app).
- [ ] 55 Main · project could not be created (`f6bwM`): the error box's text "no space on the disk, free some and try
  again" → "Nie udało się utworzyć projektu. Spróbuj ponownie; jeśli to się powtórzy, sprawdź, czy na dysku jest wolne
  miejsce." — the failure may also be the daemon not answering.
