# Memory and the "App setup" day one

The next two things built after projects and conversations, drawn in the same shell, with nothing in the sidebar that
is not built. **Memory (Pamięć)** is the profile's folder of plain files about the person ([D9](../DECISIONS.md#d9)):
the agent writes there, the person reads the files. In this version it is a list of files with a read-only formatted
preview and *Pokaż w Finderze*; editing comes later. **"App setup" on day one** ([D22](../DECISIONS.md#d22)): after
the first run the app opens on the project "App setup", pinned first, with its onboarding conversation already started
by the agent; as the person answers, the agent writes the first Memory files and creates the projects it proposes, and
the sidebar fills in front of her. Base: `33eddd9`.

## Round 1 · agent in the app

Asked (`.context/memory-app-setup-brief.md`): Memory with files and empty, day one in "App setup" at its start and
after the sidebar fills in; Polish, full window, all three palettes.

Changed: four screens in a new row under 59–61 (codes 63–66; 62 stays with the unticked *Main · projects could not be
loaded* from [projects.md](projects.md)), three components. Decisions the brief left open:

- **Memory is one screen with a tab *Pamięć*,** not a tab per file: a header (title, the quiet line, *Pokaż w
  Finderze*), then the file list on the left and the preview on the right. Opening a file does not open a tab.

- **Memory's colour is `$project-violet`** (tab icon, empty-state tile), as on 02's Memory note; its icon is `brain`,
  as on the full sidebar's Memory item.

- **A file row shows its title (the first heading, or the file name) and, under it, the file name and when it last
  changed,** newest first. The agent's fresh change is a `$brand-1-strong` dot at the row's end; in the preview the
  changed block carries `atoms/Change highlight`, as on 06 and 34.

- **The preview is read-only and has no format bar.** A line over the title repeats the file name and when it
  changed.

- **The App setup onboarding conversation is called *Poznajmy się*.** The project lists *Nowa rozmowa* first, as every
  open project does (58).

- **A project the agent just created carries `sparkles` in `$brand-1-strong`** in the pin's place, until it is opened
  (04's sparkle). App setup keeps its pin.

- **On 66 the last reply's steps are shown expanded** so the Memory step is visible; a finished reply in the build
  collapses them into `Steps summary` (57). Either is right for the moment the reply has just finished.

- **The agent's copy avoids gendered past forms:** present-tense steps, "W Pamięci jest teraz…", "zapiszę".

- The Memory nav item has no count: the meta would be `$ink-faint`, which fails contrast on the sidebar
  ([projects.md](projects.md) round 2).

- [x] Organisms (`M1u0SQ`) › Row: new `organisms/Sidebar/Projects and Memory` (`zjgDq`), an instance of
  `Sidebar/Projects only` with the Nav shown and only its Memory item: `brain`, *Pamięć*, no meta. Selected, it takes
  `$surface-glass` and a 600 label, as a selected project row.

- [ ] Daily work · components (`C1PeFe`): moved x 2020 → 2340, room for the wider Organisms frame.

- [ ] Molecules (`yh5Lh`) › Columns: new `Memory` column (`y7Y9A`).

- [x] `molecules/Memory file` (`vvH2u`): new; `file-text` 16 px `$ink-muted`, a 13.5 px `$ink` title, under it a 12 px
  `$ink-muted` "praca.md · wczoraj", and a hidden 7 px `$brand-1-strong` dot *Changed* (`JG7ET`).

- [x] `molecules/Memory file/Selected` (`JSG3N`): new, an instance of `Memory file`; `$surface-soft` fill, title 600.

- [ ] Molecules › Sidebar: new `molecules/Project row/New` (`bFzM5`), an instance of `Project row` with the pin shown
  as `sparkles` in `$brand-1-strong`.

- [ ] 63 Memory · files (`H05Qi4`): new; *Pamięć* selected in the sidebar over four projects (App setup pinned); tab
  *Pamięć*; the header "Pamięć", "Agent zapisuje tu, czego dowiaduje się o Tobie. To zwykłe pliki — możesz je też
  poprawiać w dowolnym edytorze." and *Pokaż w Finderze* (`atoms/Button/Secondary`, `folder-open`); six files, *Praca i
  szukanie pracy* selected with the dot ("praca.md · przed chwilą"); its preview with H1, a paragraph, *Czego szukam*
  with four bulleted items with bold leads (the last highlighted), *Aplikacje* and a paragraph.

- [x] 64 Memory · empty (`jVWg0`): new; *Pamięć* selected, only App setup in the sidebar; the centred empty state in
  58's pattern: violet `brain` tile, "Pamięć jest jeszcze pusta", "Tu agent zapisuje, czego dowie się o Tobie: kim
  jesteś, czym się zajmujesz, co lubisz. Wypełni się sama, gdy będziecie rozmawiać — a każdy plik przeczytasz tutaj i
  poprawisz w dowolnym edytorze." No header and no button.

- [ ] 65 Day one · App setup (`S0DbX`): new, 02 in this shell; App setup (pinned) open with *Nowa rozmowa* and *Poznajmy
  się* selected, no other projects; tab *Poznajmy się* (`message-circle` in `$project-slate`); the agent's greeting,
  that what it learns goes to Memory, and "Jak mam się do Ciebie zwracać i czym się zajmujesz na co dzień?"; the
  composer "Napisz kilka słów o sobie…" with attach and voice hidden.

- [ ] 66 Day one · the sidebar fills in (`AeJAU`): new, 04 in this shell; two answers in, the agent's reply with four
  done steps ("Zapisuję w Pamięci: o-mnie.md", "… praca.md", "Tworzę projekt Szukanie pracy", "Tworzę projekt Posty na
  Instagram"), then what it set up with the two projects as bold-led bullets and a question to go on; *Szukanie pracy*
  and *Posty na Instagram* in the sidebar as `Project row/New`.

## Round 2 · implementation (M2)

Built Memory from 63 and 64; nothing in the drawing failed the accessibility tests. Left unticked: 63, whose preview
does not mark the changed block with `atoms/Change highlight` (the app knows that a file changed, not which block)
and whose pinned App setup comes with the next milestone; `Project row/New`, 65 and 66, the next milestone.

Built in code without a drawing, from the screen's own parts; not drawn yet:

- The preview while a file loads (a spinner), and when the file is gone, is over 1 MB or could not be read (a title
  and a line in the preview's place; the failure with *Spróbuj ponownie* and its details).
- A quiet line under *Pokaż w Finderze* when the system cannot open the folder yet, or Finder did not open.
- *Pokaż w Finderze* selects the open file in Finder (the Memory folder when none is open).
