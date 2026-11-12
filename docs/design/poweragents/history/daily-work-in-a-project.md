# Daily work in a project

The everyday loop of [the brief](../ui/daily-work-in-a-project.md): open the app, see what's waiting, work with the
agent in a project, approve, step in for the agent's browser. Base: `ad824bf`.

## Round 1 · agent in the app

Asked: design every screen of the brief afresh, with variants wherever the design can go several ways, the existing
screens included.

Changed: screen 11 finished (it had only a header); seven new screens for the states and failures the brief lists
and nothing drew; five `Variants · …` frames (19–33), settled in round 2.

- [ ] Daily work · components (`C1PeFe`): new `Row 3` with `molecules/Filter chip` (`HyXbi`),
  `molecules/Filter chip/On` (`zX8Re`), `molecules/History row` (`sdDvl`), `molecules/Sheet row` (`TG3R9`).
- [ ] 11 Project · all conversations (`MN3wL`): header only → filters (All, Started by you, one chip per schedule)
  and the history in `This week` / `Earlier`, scheduled runs marked, the skipped and the late run shown.
- [ ] 12 Project · empty (`bFs1b`): new; composer in the middle, three starter suggestions, drop files.
- [ ] 13 Conversation · the agent's computer is waking up (`J5p5m`): new; `Status banner` above the composer.
- [ ] 14 Conversation · signed out of the AI provider (`LOJI7`): new; amber banner with Sign in, the unanswered
  message marked, first Waiting item says it.
- [ ] 15 Conversation · subscription limit reached (`NgOhu`): new; when it resets, schedules that wait, See plans.
- [ ] 16 Conversation · a connected account stopped working (`S0qTs`): new; reconnect card listing what waits.
- [ ] 17 Deleting a project that schedules depend on (`eLjqw`, the shell inside is `zKVPK`): new; dialog naming the
  schedule and the plugin that stop, with Pause instead. Centred on the whole window over a light frosted scrim
  (`$surface-glass` with a background blur) covering the sidebar too; the dialog has a soft shadow and a `$border`
  stroke (owner: the dark scrim over the main card only didn't fit the light design).
- [ ] 18 Project files · a spreadsheet preview (`qNQte`): new; read-only sheet preview with Open in Numbers.

## Round 2 · owner's picks

Asked:

- Sidebar signal: keep the card of three (variant B, today's design).
- Scheduled conversation: the header (variant A), with buttons that look like buttons and sit closer together.
- Files: in the sidebar under the project (variant C), plus the side view of variant B for a file that comes up in
  a conversation, expandable to a full tab.
- Memory: a misunderstanding. Memory is plain Markdown files shared by the profile, with no structure of its own; the
  design docs are corrected where they suggested otherwise.
- One file, two editors: the agent waits (variant A), but only while she is actually editing, not because the file
  is open.

Changed: the variant frames are gone (git history keeps them); the picks became the design of the existing screens.

- [ ] `organisms/Sidebar` (`LdqnM`): `Projects` (`bSPlA`) fills the height and clips (the list scrolls), the `Flex`
  spacer removed; Memory nav item (`vRDAC`) `About you` / `heart-handshake` / `12 notes` → `Memory` / `brain` /
  `6 files`, per D9.
- [ ] `molecules/Nav item` (`k6dG9`): default label `About you` → `Memory`.
- [ ] `organisms/Tab bar` (`osLpo`): `Project files` button (`n7BC6u`) hidden; files live in the sidebar.
- [ ] `molecules/Run header` (`e3sGdM`): new; schedule name, due and ran times, why late, `All runs` and `Schedule`
  as secondary (outlined) buttons 6 px apart. Replaces `molecules/Run marker` (`X6xelD`, deleted) in the three
  Main screens, `13` and `16`.
- [ ] `molecules/Sidebar label` (`GHAlZ`): new; `Conversations` / `Files` labels inside an open project.
- [ ] `molecules/File chip` (`PIOhS`): new; a file named in a conversation, opens it in the side view.
- [ ] 02 Day one · getting to know you (`j0A6R`): `About you` → `Memory` in the agent's message and the note chip.
- [ ] 06 Project files · agent editing an open file (`f57BOY`): right-hand files panel removed; the open project in
  the sidebar lists conversations and files, `Post ideas` selected with a writing icon; list shown scrolled.
- [ ] 07 Memory · what the agent knows about you (`YkyFt`, was `07 About you · …`): topics view → the Memory page:
  a short framing line and its six files with who changed them last; the files listed under Memory in the sidebar.
- [ ] 08 File changed by both you and the agent (`x3iJgo`): deleted, variant B rejected.
- [ ] 12 Project · empty (`bFs1b`): lede points to the sidebar instead of Project files.
- [ ] 18 Project files · a spreadsheet preview (`qNQte`): files panel removed; files in the sidebar,
  `Followers 2026.xlsx` selected.
- [ ] 26 Conversation · a file open beside it (`Zfrjz`): new, from variant B; chat on the left with a `File chip`,
  the file on the right with `Open as a tab` and close.
- [ ] 31 Project files · the agent waits while you edit (`FsnNu`): new, from variant A; banner says the agent holds
  its change because she is typing, and that an open file alone doesn't stop it; files in the sidebar.
- [ ] 34 Memory · a note open (`dJbK5`): new; a Memory file in the editor, the agent's latest line marked.
- [ ] Daily work · components: `organisms/Files panel` and `molecules/Learned fact`, added in round 1, deleted
  unused.

Open: with the card of three, an open project's conversations and files don't fit in a 900 px window, so `06`,
`18`, `26` and `31` show the project list scrolled. Not done: `10 Schedule · its runs` still draws its run rows by
hand; they should become `molecules/History row`.

## Round 3 · owner in the app

Asked: the agent's block in `06` (`Idea 4`, `t4dK8d`) has its own padding and background, so its text no longer lines
up with the rest; Markdown has many kinds of blocks, so the mark for "the agent changed this" has to be generic.

Changed: a variants frame; the screens keep the old mark until the owner picks.

- [ ] Variants · How a file shows what the agent changed (`q2cRc2`): `35` A a bar in the left margin beside every
  changed block (recommended), `36` B the bar plus who and when in the right margin, `37` C the changed text tinted
  in the brand colour.

## Round 4 · owner in the app

Asked: banners (`Agent editing banner` in `31`, `V581f`) need no border; their buttons should match the banner,
lighter than it, and the buttons keep a border. Applied to every tinted banner, not only the one pointed at.

- [ ] Atoms · Buttons (`J5r3E`): new `atoms/Button/On tint` (`Nle7R`, Secondary with a `$surface-glass` fill) and
  `atoms/Button/On tint/Attention` (`qgvOv`, its border `$attention-border`, label and icon `$attention-ink`).
- [ ] `molecules/Status banner` (`YTm72`): its button's fill `$surface` → `$surface-glass`.
- [ ] `molecules/Run header` (`e3sGdM`): `All runs` and `Schedule` → `atoms/Button/On tint`.
- [ ] `organisms/Browser handoff` (`h1HlE`): border removed; fill `#FDF0EA` → `$attention-soft`; `Open the agent's
  browser` solid Attention → `On tint/Attention`; `Done, continue` fill → `$surface-glass`; raw colours of the
  thumbnail border and the instruction → `$attention-border`, `$ink-body`.
- [ ] Borders removed from `Agent editing banner` in `06` (`dNLp1`), `26` (`e5GcU`), `31` (`V581f`) and from
  `Reconnect card` in `16` (`GVFMh`).
- [ ] `14` Sign in to ChatGPT, `15` Remind me at 14:00, `16` Reconnect Google: solid Attention / Secondary →
  `atoms/Button/On tint/Attention`.

## Round 5 · owner's pick for marking agent changes

Asked: none of `35`–`37`; do it the way Pen shows its agent: a cursor where the agent is working, and the blocks it
changed lit for a while, fading so the most recent stand out. No words saying the agent wrote it. The highlight
attaches to the nearest node of the Markdown AST (a paragraph, a heading, a list item).

Changed: the variants frame (`q2cRc2`) deleted; the pick drawn into the screens.

- [ ] `molecules/Agent cursor` (`BtOTy`): new; a brand caret with a small flag in the agent mark's gradient.
- [ ] `atoms/Change highlight` (`lns0L`): new; brand-tinted rounded rectangle drawn behind a changed node, 12 px
  wider on each side and 6 px taller, so the text never moves; its opacity says its age (0.16 just now, fading to
  none).
- [ ] 06 (`f57BOY`) and 26 (`Zfrjz`): `Idea 4` loses its fill, padding and `Agent` tag; the caret → `Agent cursor`;
  highlight 0.16 behind it; `Idea 2`'s paragraph highlighted at 0.06 (changed a minute earlier).
- [ ] 34 Memory · a note open (`dJbK5`): the agent's line from yesterday loses its box and its "The agent added
  this" tag; its highlight has faded out.

## Round 6 · owner in the app

- [ ] `molecules/Agent cursor` (`BtOTy`): flag 15 → 20 px, its icon 9 → 13 px.
- [ ] Format bar in `06`, `26`, `31` and `34`: the `Saved · …` status text removed (owner: not needed; saving is
  automatic, and the banner already says when the file is read-only).
