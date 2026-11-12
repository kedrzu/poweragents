# Retired decisions

Full text of decisions no longer in force, under their original IDs. Never edited after writing,
except to append the next retired form.

## D10

Retired 2026-11-08, replaced by [D12](#d12), itself since replaced by [D21](../DECISIONS.md#d21).

**A mobile companion app is part of the first version, not later.** (2026-11-08, owner)

**Why.** In the reference setup the agent's output reaches the person on the phone (today via a
Telegram bot, which needed technical setup). The phone is where a schedule's result is read.

**Open.** How the phone reaches the daemon (relay vs tunnel), push notifications.

## D19

Retired 2026-11-08, replaced by [D20](../DECISIONS.md#d20).

**A plugin keeps what it learns about the user (e.g. email-sorting rules) as ordinary files in its own
folder, shown in the app under that plugin ("what this plugin knows about me"), not as a project.**
(2026-11-08, owner)

**Why.** People don't think of email sorting as a project; to them a project starts and ends. The files
stay plain and visible, consistent with [D9](#d9) — only their place in the interface differs.

**Rejected.**

- Installing a plugin creates a regular project holding its files — proposed by the design agent
  2026-11-08; "email sorting" is not something people call a project.
- A hidden plugin store — contradicts plain, visible memory ([D9](#d9)).

## D12

Retired 2026-11-08, replaced by [D21](../DECISIONS.md#d21).

**Version one is desktop-only and local. The mobile companion (notifications, talking to the agent)
follows in version two, soon after.** (2026-11-08, owner)

**Why.** Notifications on the phone are where a schedule's result is actually read (the reference
setup uses a Telegram bot, which needed technical setup), so it comes quickly — but not first.

**Rejected.**

- Mobile companion in version one ([history](history/DECISIONS.md#d10)) — owner moved it to version
  two.

**Open, deferred by owner.** How the phone reaches the daemon. Notes so far: Paseo's opt-in relay
(daemon connects outbound, phone pairs by QR, E2E-encrypted, no VPN on the phone) fits; Headscale
alone does not, since the phone would still need the Tailscale VPN client; push notifications need a
server holding the app's APNs/FCM keys, i.e. a hosted component of ours.

## D5

Retired in part 2026-11-08: the "works with any compatible daemon — local, remote or custom" half dropped; rewritten in place as [D5](../DECISIONS.md#d5).

**A daemon runs in the background and exposes everything over a port; the desktop app is a thin
client that works with any compatible daemon — local, remote or custom.** (2026-11-08, owner)

**Why.** It lets the core be swapped (custom file storage, a company cloud) under the same signed
app, and it is the shape a mobile companion and cloud-hosted agents need. Paseo is the model.

> **Checked 2026-11-08:** Paseo's daemon listens on `ws://127.0.0.1:6767`; desktop (Electron), mobile
> (Expo), web and CLI connect to it; remote access via an opt-in E2E-encrypted relay —
> [getpaseo/paseo](https://github.com/getpaseo/paseo), [security](https://paseo.sh/docs/security).

## D29

Retired in part 2026-11-11: automatic archiving of scheduled runs dropped; rewritten in place as [D29](../DECISIONS.md#d29).

**A scheduled run is an ordinary, visible, interactive session in its project, optionally archived
automatically when it finishes (as Paseo does). It inherits the reach the project already has and
needs no permissions of its own; if it hits something that needs the person, it asks in that session
and waits, and the person is notified.** (2026-11-08, design agent proposal at the owner's request;
not confirmed)

**Why.** Defining permissions per schedule up front is impractical — what the agent will need is
decided while it runs — and unnecessary, because the reach is already set by the project's plugins
and connections ([D28](#d28)). A visible session lets the person see what happened and answer the
agent there, instead of a run that silently stalls or gives up.

**Where schedules live.** Schedules belong to the profile, listed in one place. A schedule may name a
project as the folder its agent starts in; without one, the agent sees only the profile's Memory and
Downloads. A run's conversation is listed under its schedule, and also among the project's
conversations when it has one. (2026-11-09, owner: "the project is only the agent's starting folder";
listing and the no-project case are the design agent's proposal)

**Overlap.** While a schedule's previous run still waits for the person, the next run does not start;
the notification says today's run was skipped. (2026-11-08, owner, from the failure sweep)

**Rejected.**

- Finishing the run and leaving a "I need your consent for X" message — proposed earlier by the design
  agent; loses the run's context and needs a second run, where an interactive session can simply
  continue.
- Per-schedule permission lists written at creation — the needs are not knowable in advance.

**Acting in the person's name.** No per-schedule switch. What a plugin can do outward is limited by
the tools it exposes — e.g. the mail plugin creates drafts and doesn't send, as in the owner's own
setup. Buying needs the person to sign in and pay, which is consent by itself. Payments as such are
out of scope. (2026-11-08, owner)

**Rejected.**

- A per-schedule "may send and publish in your name unattended" switch, with plugins marking
  outward-acting tools — proposed by the design agent; plugins exposing only safe tools does the job.

Retired in part 2026-11-11: profile-owned schedules with an optional project replaced by project-owned schedules; rewritten in place as [D29](../DECISIONS.md#d29).

**A scheduled run is an ordinary, visible, interactive session. It inherits the reach the project already has and
needs no permissions of its own; if it hits something that needs the person, it asks in that session
and waits, and the person is notified.** (2026-11-08, design agent proposal at the owner's request;
not confirmed)

**Why.** Defining permissions per schedule up front is impractical — what the agent will need is
decided while it runs — and unnecessary, because the reach is already set by the project's plugins
and connections ([D28](#d28)). A visible session lets the person see what happened and answer the
agent there, instead of a run that silently stalls or gives up.

**Where schedules live.** Schedules belong to the profile, listed in one place. A schedule may name a
project as the folder its agent starts in; without one, the agent sees only the profile's Memory and
Downloads. The schedule's page shows its runs' conversations, so "what did my email
sorting do on Tuesday" is found from the schedule. (2026-11-09 and 2026-11-11, owner: "the project is
only the agent's starting folder"; the no-project case is the design agent's proposal)

**Never archived.** Conversations, scheduled or not, are not archived when they finish or when their
tab closes; they stay in history. Hiding a conversation for good may come later as an action taken
from history. (2026-11-11, owner)

**Overlap.** While a schedule's previous run still waits for the person, the next run does not start;
the notification says today's run was skipped. (2026-11-08, owner, from the failure sweep)

**Rejected.**

- Archiving a scheduled run's conversation automatically when it finishes, as Paseo does
  ([history](history/DECISIONS.md#d29)) — in Paseo a scheduled agent looks like any other and, once
  archived, is hard to find again; here runs are found from their schedule instead (owner).
- Finishing the run and leaving a "I need your consent for X" message — proposed earlier by the design
  agent; loses the run's context and needs a second run, where an interactive session can simply
  continue.
- Per-schedule permission lists written at creation — the needs are not knowable in advance.

**Acting in the person's name.** No per-schedule switch. What a plugin can do outward is limited by
the tools it exposes — e.g. the mail plugin creates drafts and doesn't send, as in the owner's own
setup. Buying needs the person to sign in and pay, which is consent by itself. Payments as such are
out of scope. (2026-11-08, owner)

**Rejected.**

- A per-schedule "may send and publish in your name unattended" switch, with plugins marking
  outward-acting tools — proposed by the design agent; plugins exposing only safe tools does the job.

## D33

Retired in part 2026-11-11: "archived automatically when finished" dropped; rewritten in place as [D33](../DECISIONS.md#d33).

**The app's structure.** (2026-11-09, owner, on the design agent's proposals)

- **Sidebar:** profile switcher at the top, shown only once there is more than one profile; then
  "Waiting for you", Memory, Downloads, Plugins, Schedules, and the projects, with "App setup" an
  ordinary project pinned first.
- **Projects in the sidebar** expand to show their recent conversations, plus a view of the project's
  whole conversation history.
- **Main area has tabs** for whatever is open — conversations and files — opened and closed like an
  editor's tabs, not a store of every conversation (history lives under the project).
- **A project holds many conversations;** "New conversation" is one click. Scheduled runs are
  conversations too, archived automatically when finished.
- **"Waiting for you"** collects everything across the profile that needs the person: confirmations,
  a browser waiting for a login, sessions with a question, skipped runs.
- **Files** are edited without visible Markdown syntax (a rich editor such as Tiptap writing plain
  Markdown underneath); other files get a preview; a syntax view is an option, not the default.
- **Plugins** are one sidebar item with Installed and Marketplace beneath it; a plugin's page shows the
  projects it is attached to, what it knows about the person (links to its files), and "Set up again",
  which reruns its onboarding.

**Rejected.**

- One continuous conversation per project — results of schedules would need a separate place, and
  it grows forever.
- Tabs as the list of all open conversations (Paseo's model) — tabs here also hold files and are
  opened and closed constantly; history belongs under the project (owner).
- Schedules owned by projects — a project is only the folder an agent starts in (owner).
- Markdown syntax visible by default — most users don't know Markdown.

**Unchecked.** How faithfully Tiptap round-trips arbitrary Markdown the agent writes (tables, nested
lists, front matter).

# Retired decisions

Full text of decisions no longer in force, under their original IDs. Never edited after writing,
except to append the next retired form.

Retired in part 2026-11-11: the rejection of project-owned schedules reversed; rewritten in place as [D33](../DECISIONS.md#d33).

**The app's structure.** (2026-11-09, owner, on the design agent's proposals)

- **Sidebar:** profile switcher at the top, shown only once there is more than one profile; then
  "Waiting for you", Memory, Downloads, Plugins, Schedules, and the projects, with "App setup" an
  ordinary project pinned first.
- **Projects in the sidebar** expand to show their recent conversations, plus a view of the project's
  whole conversation history.
- **Main area has tabs** for whatever is open — conversations and files — opened and closed like an
  editor's tabs, not a store of every conversation (history lives under the project).
- **A project holds many conversations;** "New conversation" is one click. Scheduled runs are
  conversations too; nothing is archived ([D29](#d29)). The project's history is one list of all its
  conversations, scheduled runs marked as such; the sidebar's recent conversations show only those
  the person started or opened, plus any run that needs them, so runs don't crowd the workspace.
  (2026-11-11, the last clause is the design agent's proposal, not confirmed)
- **"Waiting for you"** collects everything across the profile that needs the person: confirmations,
  a browser waiting for a login, sessions with a question, skipped runs.
- **Files** are edited without visible Markdown syntax (a rich editor such as Tiptap writing plain
  Markdown underneath); other files get a preview; a syntax view is an option, not the default.
- **Plugins** are one sidebar item with Installed and Marketplace beneath it; a plugin's page shows the
  projects it is attached to, what it knows about the person (links to its files), and "Set up again",
  which reruns its onboarding.

**Rejected.**

- One continuous conversation per project — results of schedules would need a separate place, and
  it grows forever.
- Tabs as the list of all open conversations (Paseo's model) — tabs here also hold files and are
  opened and closed constantly; history belongs under the project (owner).
- Schedules owned by projects — a project is only the folder an agent starts in (owner).
- Markdown syntax visible by default — most users don't know Markdown.

**Unchecked.** How faithfully Tiptap round-trips arbitrary Markdown the agent writes (tables, nested
lists, front matter).
