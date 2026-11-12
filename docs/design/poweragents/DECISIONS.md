# Decisions

The decisions in force: grepped and re-entered, never read front to back. A heading is the
decision's ID alone, so `DECISIONS.md#d3` keeps resolving after the wording is sharpened. Retired
decisions, the journal and notes from reviews live in [history/](history/).

**Before proposing a change in an area, read the Rejected lines of its decisions and the history
they link to.** Reopening a rejected option is right when its premise changed; repeating it without
knowing it was rejected is not.

## D1

**The agent engine is OpenCode, run headless (`opencode serve`) and driven over its HTTP API.**
(2026-11-08, owner)

**Why.** Open source (MIT), provider-agnostic, and already has what the product needs underneath:
skills, subagents, custom agents, plugins with hooks, local and remote MCP with OAuth, an SSE event
stream and permission requests over HTTP.

> **Checked 2026-11-08:** `opencode serve` exposes sessions, messages, permissions, `/event` SSE, `/mcp`,
> `/agent`, provider auth; OpenAPI at `/doc` — [server docs](https://docs.opencode.ai/docs/server/).
> Skills from `.opencode/skills`, `.claude/skills`, `.agents/skills` —
> [skills](https://opencode.ai/docs/skills/). Subagents run in child sessions —
> [agents](https://opencode.ai/docs/agents/). License MIT; repo is now `anomalyco/opencode`, latest
> v2.2.6 (2026-11-06).

**Rejected.**

- Building on OpenWork (fork or contribution) — same engine and much of the plumbing, but aimed at
  companies replacing Cowork, onboarding assumes the user knows what to ask, no default sandbox;
  the product difference is in exactly the parts it would not give us (2026-11-08, design agent's
  reading of their README, owner agreed it is a Cowork clone).

## D2

**Sign-in uses the AI subscription the user already has: ChatGPT (Plus/Pro) and Claude (Pro/Max)
as equal options, API keys as a fallback.** (2026-11-08, owner)

**Why.** Paying for an API key is a step non-technical users won't take; both subscriptions now work
in OpenCode.

> **Checked 2026-11-08:** OpenCode v2.2.3 (2026-10-30) added the Claude Agent provider: it runs the
> user's own unmodified `claude` (Claude Code ≥2.1.248) via the Agent SDK, on the same machine as the
> OpenCode server; Claude Code's own settings/CLAUDE.md/hooks/MCP are not loaded; unavailable in
> OpenCode remote workspaces — [release](https://github.com/anomalyco/opencode/releases/tag/v2.2.3),
> reported by [dalao.ai](https://dalao.ai/news/a/w21FAWr86a) with the PR author's statement "We got
> permission from Anthropic". Anthropic's terms forbid third-party apps holding Claude credentials
> but allow "signing in to the unmodified Claude Code binary", also when a platform hosts it —
> [legal-and-compliance](https://code.claude.com/docs/en/legal-and-compliance).

> **Checked 2026-11-08:** OpenAI's Sign in with ChatGPT page lists OpenCode among open-source
> integrations; plan usage is open to open-source and personal-local apps, paid or remotely hosted
> apps go through a waitlist — [OpenAI](https://learn.chatgpt.com/docs/sign-in-with-chatgpt).

**Consequences carried forward.** `claude` must live inside the sandbox next to OpenCode, and its
browser sign-in has to be surfaced by the app. Whether the Claude route works for cloud-hosted agents
is unchecked. A paid or hosted company offering may need OpenAI's waitlist.

## D3

**The first user is one person on their own computer; companies are where the money is expected to
come from, later.** (2026-11-08, owner)

**Why.** A product individuals like is easier to bring into their organisation. Company features
named so far: a shared team workspace with shared workflows, skills and full toolsets including
installed programs, cloud or intranet hosting, collaboration between people, custom development.
None of them is in scope now; the design must not rule them out.

## D4

**The product is opinionated about memory: the agent builds and keeps knowledge about the user in
plain files the user can read, out of the box.** (2026-11-08, owner)

**Why.** The owner's wife's setup worked because of this, not because of any one tool; it is what
she could not have built herself and what market products leave to the user.

## D5

**A daemon of ours runs in the background and exposes everything over a port; the desktop app is a
thin client of it. Daemon and client are kept clearly separate, but the daemon is not designed to be
replaceable by other implementations — how to customise it is decided later.** (2026-11-08, owner)

**Why.** The split serves the phone, the agent configuring the app from its sandbox ([D14](#d14)) and
a later cloud version. A replaceable daemon would make its whole API — sessions, files, schedules,
browser, plugins, sign-ins, relay — a public contract before anyone needs one: a company that only
wants its own file storage would have to rewrite all of it.

> **Checked 2026-11-08:** Paseo's daemon listens on `ws://127.0.0.1:6767`; desktop (Electron), mobile
> (Expo), web and CLI connect to it; remote access via an opt-in E2E-encrypted relay —
> [getpaseo/paseo](https://github.com/getpaseo/paseo), [security](https://paseo.sh/docs/security).

**Rejected.**

- The signed app working with any compatible daemon, local, remote or custom
  ([history](history/DECISIONS.md#d5)) — owner deferred replaceability (2026-11-08).
- Narrow replaceable parts inside the daemon (a file-storage provider, where the VM runs) as the
  customisation model — proposed by the design agent; not decided now, part of the later question.

## D6

**All agent work runs inside a Linux sandbox shipped with the app; the user installs nothing else, and
the agent sees only the folders mounted into it.** (2026-11-08, owner)

**Why.** The agent can install whatever it needs (Python, Node, Playwright…) without touching the
user's machine, and the environment can be described and rebuilt elsewhere.

> **Checked 2026-11-08:** Cowork's local mode ran a Linux VM via Apple Virtualization.framework on
> macOS and Hyper-V/HCS on Windows, folders over VirtioFS —
> [Anthropic](https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview);
> since 2026-10-06 Cowork defaults to cloud sandboxes. On Windows, enabling WSL / VM Platform the
> first time needs admin and a reboot — [Microsoft](https://learn.microsoft.com/en-us/windows/wsl/install);
> no admin-free path found. Apple `container` needs macOS 26 + Apple silicon and sudo for host DNS —
> [apple/container](https://github.com/apple/container/blob/main/docs/host-integration.md).
> Community benchmarks put a minimal VZ VM boot at ~0.3–0.9 s.

**Open.** Which runtime per OS; per-profile vs per-project sandbox (owner leans per profile).

## D7

**Multilingual from the start; Poland is the first market.** (2026-11-08, owner)

## D8

**Each project is its own folder; the agent working in a project sees that project's folder.**
(2026-11-08, owner)

**Why.** Owner's choice. Keeps projects movable and storable elsewhere independently.

**What the agent sees.** The project's folder, the profile's Memory ([D9](#d9)) and the profile's
Downloads folder ([D27](#d27)). (2026-11-08)

**Rejected.**

- One vault per profile with projects as plain subfolders the agent sees all at once (the shape of
  the owner's wife's Obsidian setup) — proposed by the design agent 2026-11-08; owner chose separate
  folders, with knowledge about the person handled by [D9](#d9) instead.

## D9

**Each profile has a "Memory" (Pamięć): an ordinary folder of files about the person that the user can
open and edit like any project, and that the agent reads with ordinary file search in every project.
There is no other memory mechanism — not per profile, not per project.** (2026-11-08, owner)

**Why.** Memory that works "like Claude's" — hidden, opaque, managed by rules nobody can see — is what
the owner explicitly does not want. Nobody will think to create a "personal" project, so the app
provides the place. Inside a project nothing special is needed: a project is files, and the agent
organises them as the project requires.

**Open — file history.** Nothing yet lets the person undo a bad agent edit, stops two sessions
overwriting each other's changes to one file, or keeps a parallel run from rewriting a Memory fact
the person just corrected. Owner is considering a local git repository to keep history of the files
(2026-11-08, from the failure sweep).

**Rejected.**

- A name like "About me" (O mnie) — owner prefers "Memory" (2026-11-08).
- A managed memory store (embeddings, automatic summaries, a memory API) — opaque to the user.
- Showing Memory in a structure of its own (topics, sentences with their sources, cards to confirm) — Memory is
  shown as its files, opened like any project's files (2026-11-12, owner).
- A separate memory mechanism per project — a project is already just files.

## D11

**Projects organise work; they are not an isolation boundary. Per-project tool settings exist to keep
the agent's context small, not to restrict access.** (2026-11-08, owner)

**Why.** Examples: designing a wardrobe, shopping research, health and skin care, work, social media —
one project each. A hundred tools listed in every project crowds the agent's context; a project
should see the tools it needs by default, with the rest still findable.

**How.** A project's default tools are those of the plugins attached to it ([D20](#d20)); other
plugins stay findable, and attaching one to a project (by the user or the agent) makes its tools
default there. (2026-11-08, design agent proposal, owner agreed.)

**Rejected.**

- Counting tool usage per project and promoting frequent tools into a default set with a soft or hard
  limit (owner's first idea) — attaching plugins gives the same result with no counters.

**Deferred.** Shrinking what MCP servers put into the context — e.g. the agent sees which servers
exist and reads a server's tools only when it needs them. An optimisation for later (owner).

## D13

**Schedules run only while the computer is awake; running in the background regardless is the value
of the future cloud offering, and version one does not promise it.** (2026-11-08, owner)

**Why.** That is how the reference setup behaves today (routines arrive when the laptop is unlocked),
and it is acceptable.

**Missed runs.** A schedule whose time passed while the computer slept runs once on wake, for the
latest missed time only — a daily 7:00 routine after a closed weekend arrives once, Monday's.
(2026-11-08, design agent proposal, owner did not object.)

## D14

**Anything the user can configure in the app, the agent can configure too — connecting an account,
starting a sign-in, installing or reconfiguring a plugin — so the user never needs to find a settings
screen.** (2026-11-08, owner)

**Why.** Non-technical users won't find or understand configuration UIs; e.g. MCP sign-in in Claude
happens outside the chat, through a command and a click.

**Open.** Which agent-initiated changes need the user's confirmation in the UI (a web page the agent
read could ask it to install something).

## D15

**When the agent's browser hits something only the person can do — a login, a CAPTCHA — the agent
asks the person in the conversation, with a small screenshot; one click opens that exact tab live in
the app, the person does it and says so, and the agent continues.** (2026-11-08, owner)

**Why.** The agent has its own browser, never the user's (sessions exist only where the user signed
in for it); handing over the live tab is how it gets those sessions without the user knowing where
the browser is.

## D16

**One sign-in per external account per profile: connecting e.g. a Google account once serves every
plugin that needs it (Gmail, Calendar, Drive), each still a separate MCP server.** (2026-11-08, owner)

**Why.** Signing in again for every plugin is exactly the friction this product removes.

> **Checked 2026-11-08:** `gmail.modify` and `gmail.readonly` are *restricted* scopes —
> [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes). Public apps need OAuth
> verification; unverified apps get a warning screen and a lifetime cap of 100 new users; testing-mode
> grants expire after 7 days — [Google](https://support.google.com/cloud/answer/15549945). The annual
> CASA security assessment applies to apps that can access restricted data "from or through a
> third-party server"; no explicit on-device exemption found — unresolved, needs confirmation from
> Google — [restricted-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification).
> "Incremental authorization is not supported for installed apps or devices" —
> [native apps](https://developers.google.com/identity/protocols/oauth2/native-app): adding Calendar to
> an existing Google connection from a desktop app means a new consent screen (or asking for all
> scopes up front). Desktop clients are public clients; PKCE + loopback redirect. Microsoft Graph
> `Mail.ReadWrite` delegated needs no admin consent and works for personal accounts; unverified
> publishers show "Unverified" and may be blocked by tenant policy —
> [permissions](https://learn.microsoft.com/en-us/graph/permissions-reference).

**Consent.** Each Google service asks for its own consent when it is first added; the account is
connected once, a later service costs one more "Allow" on Google's screen. (2026-11-08, design agent
proposal, owner did not object.)

**Rejected.**

- Asking for all Google scopes (mail, calendar, Drive) at the first connection — Google does not let
  desktop apps add scopes later, but a first screen saying the app may read, send and delete all mail,
  calendars and files scares a non-technical user before any value is shown.
- All Google tools as one MCP server — too broad; acceptable only if individual endpoints can be
  switched on and off (owner, 2026-11-08).

## D17

**There is one kind of plugin, and it is a composite: any mix of skills, MCP servers with their
configuration, an onboarding skill, schedules, additions to the sandbox environment (e.g. installing
Blender), and further parts as needed. "Workflow", "creative", "for work" are marketplace tags for
filtering, not kinds.** (2026-11-08, owner)

**Why.** A 3D plugin that installs Blender and tells the agent it exists, and an email-triage plugin
with rules and a schedule, are the same thing with different parts; separate kinds would force a
choice nobody needs to make.

**Rejected.**

- Two kinds — a "connection" (account sign-in + tools, no files) and a "workflow" (rules, schedule,
  onboarding, creates a project) — proposed by the design agent 2026-11-08; owner prefers one
  composite with tags.

## D18

**A plugin's onboarding is an ordinary chat driven by a skill the plugin's manifest marks to run right
after installation; the user can start it again any time to change the setup.** (2026-11-08, owner)

## D20

**A plugin has no folder of its own. Its files live in one or more ordinary projects, and the plugin's
configuration records which. A plugin can create a project when installed (e.g. "Email sorting") or be
installed from inside an existing project, which it then uses.** (2026-11-08, owner)

**Why.** Keeps one place for files — projects — and covers both a plugin that needs one dedicated
project and one that works across several.

**References survive renames.** A plugin points at a project by a stable identifier, not by name or
path. Deleting a project that has plugins or schedules attached warns and says what stops working.
(2026-11-08, owner, from the failure sweep)

**Rejected.**

- A per-plugin folder shown under the plugin, not as a project
  ([history](history/DECISIONS.md#d19)) — owner replaced it the same day with projects referenced
  from plugin configuration.
- Installing a plugin always creates its own project — too rigid; a plugin may use an existing project
  or several.

## D21

**The design describes the full first version: desktop app, plugins, a basic marketplace, the mobile
companion and the relay that connects it. In what order they are built is decided later and is not
part of this design.** (2026-11-08, owner)

**Rejected.**

- Fixing now that version one is desktop-only and the phone comes in version two
  ([history](history/DECISIONS.md#d12)) — owner moved sequencing out of the design.

## D22

**First run is a short wizard with only the formal steps — sign in to an AI provider (ChatGPT or
Claude), choose where the data lives — after which the app opens its first project, "App setup", and
the configuration plugin's onboarding chat starts on its own.** (2026-11-08, owner)

**Why.** Everything that can be a conversation is one; the wizard holds only what the conversation
cannot run without. Onboarding the user to the product is the configuration plugin's onboarding
([D18](#d18)).

**Order.** Set up the sandbox environment first (on Windows this is where the one-time admin consent
and reboot happen, before the user has put anything in), then sign in, then the "App setup" project.
Sign-in needs the sandbox because the Claude route signs in the `claude` program inside it ([D2](#d2)).
The first profile is created silently, unnamed; work/private comes up only when someone wants a
second profile. (2026-11-08, design agent proposal, owner agreed.)

**Where data lives.** The wizard asks for a kind of place, not a path: "On this computer", a default
folder the app picks (e.g. under Documents or home), changeable by those who want to. iCloud, Google
Drive and OneDrive come later as further kinds. (2026-11-08, owner)

**Rejected.**

- A folder picker in the wizard — the users this is for don't navigate folders.
- iCloud as the default — files evicted by "Optimize Mac Storage" and sync conflicts under an agent
  writing quickly are unexamined risks (not checked; design agent's concern).
- Rebooting for the sandbox at the first conversation instead of first — interrupts the moment the
  user has started.

## D23

**The chat supports generative UI: the agent can show choices, forms and other components that fit
the moment instead of making the user type everything.** (2026-11-08, owner)

**Why.** More general than the question tool coding agents use, and it removes typing for people who
don't know what to type. Owner named OpenUI as a candidate format.

> **Checked 2026-11-08:** OpenUI (thesysdev/openui, spec 1.0) — the model writes "OpenUI Lang", a
> line-oriented language, from a component library the app defines; the client renders it while it
> streams; a click can send a message back to the model (`@ToAssistant`), which the chat sends as a
> new user turn. Runtimes for React, Vue, Svelte, Angular, React Native —
> [spec](https://github.com/thesysdev/openui/blob/main/spec/overview.md),
> [chat UI](https://www.openui.com/docs/build-agents/chat-ui). The model learns it from a system
> prompt generated from the component library.

**How.** A built-in tool the agent calls to show UI, plus a skill holding the OpenUI spec and the
components we support, which the agent reads when it needs them — not a permanent system-prompt
addition. (2026-11-08, owner)

## D24

**The sandbox comes with the basics built in: a Python runtime with uv, a JavaScript runtime with Bun,
and their package managers; a built-in skill tells the agent what is available and how to use it.**
(2026-11-08, owner)

**Why.** The agent should never have to install the language it writes scripts in.

## D25

**Everything beyond the basics is declared in the profile's environment manifest — by a plugin or by
the agent — and the environment is built only from it. Each kind of thing (Python packages, JS
packages, Linux system packages) has exactly one way of being installed. Applying the manifest is
idempotent: the same result on the running sandbox and on one built from scratch, e.g. after it was
destroyed, after a runtime version change or after a serious failure.** (2026-11-08, owner, on the
design agent's proposal that the agent installs only by changing the manifest)

**Why.** The problem this product starts from is that an agent setup on one machine cannot be
reproduced on another, because nothing records what was installed. Imperative install scripts give
different results depending on order; a declaration per kind does not.

**Rejected.**

- A persistent sandbox where the agent installs freely — the manifest stops describing reality.
- A sandbox rebuilt from the manifest while the agent still installs freely — its installs silently
  vanish on the next rebuild.
- Install scripts run in sequence — results depend on order and history.

## D26

**The profile's manifest — what the environment is rebuilt from — is the list of installed plugins
with their versions and configuration, plus the version of the base environment. The packages in the
sandbox are derived from what those plugins declare; nothing is copied out of plugins into a
hand-maintained package list.** (2026-11-08, owner)

**Why.** Installing a plugin is the primary way anything enters the environment, and the user chose
the plugin, not its packages. A package list in the sandbox describes what the sandbox is, not where
it came from, so it can't be rebuilt or updated from it. Since the marketplace is ours, plugin versions
and the dependencies they declare can be updated safely: updating means a new plugin version.

**Rejected.**

- The sandbox's own uv / Bun project files (with lockfiles) as the manifest — proposed by the design
  agent 2026-11-08; they record the result, not the source, and make updates awkward.
- Linux system packages from a repository frozen at a fixed date — proposed by the design agent; as
  a standalone rule it blocks updates (owner).

**Agent's own installs.** The agent can create local plugins: it writes a plugin manifest declaring
what it needs, and installing that plugin installs it — the same path as any plugin. (2026-11-08,
owner)

**Rejected.**

- A single fixed local plugin per profile ("My additions") holding everything the agent installs —
  proposed by the design agent; owner prefers letting the agent author plugins generally.
- A separate "installed by hand" section of the manifest — two kinds of entries for every mechanism
  to handle.

**Deferred until real plugins are built (owner).** How a plugin installs a Linux system tool: as a
distribution package via apt (version is whatever the base environment's distribution carries), as a
pinned release archive with a checksum (the plugin controls the version), or both as two kinds.
Neither is ruled out.

## D27

**Each profile has its own Chromium on the host (its own user-data directory), separate from whatever
browser the user uses. The daemon launches it headed with its window hidden, so it works with the app
closed; the agent drives it from the sandbox through a tunnel the daemon provides. When a person is
needed, the app shows a thumbnail and one click brings that real window forward — the same process,
tab and page state. A remote client (the phone) sees the same tab as a screencast.** (2026-11-08,
design agent proposal, owner agreed)

**Why.** Schedules run with the app closed, so the browser cannot live in the app. Headless Chrome
cannot be made visible later, and restarting it headed loses the page state (CAPTCHA, paywall, a
half-done flow). The owner holds that a browser's own isolation is enough outside the sandbox; "inside
the app window" was a soft requirement, great UX the real one.

> **Checked 2026-11-08:** headless vs headed is fixed at launch —
> [Chrome headless](https://developer.chrome.com/docs/automation-and-testing/headless); OpenClaw's
> handoff restarts the profile headed, keeping cookies but not page state —
> [openclaw#75879](https://github.com/openclaw/openclaw/issues/75879).

> **Checked 2026-11-08:** Playwright MCP is headed by default ("headed by default") —
> [options](https://playwright.dev/mcp/configuration/options). On macOS each new Chromium page
> activates the app; `Target.createTarget` with `background: true` avoids that —
> [playwright#41282](https://github.com/microsoft/playwright/pull/41282) — but un-hides a hidden
> browser, so a re-hide watcher was needed —
> [hexisteme 2026-11-04](https://hexisteme.github.io/notes/playwright-new-page-brought-chrome-to-front.html).
> macOS won't place a window fully off-screen; `Browser.setWindowBounds` with `windowState:
> minimized` works — [playwright-cli#318](https://github.com/microsoft/playwright-cli/issues/318).

> **Checked 2026-11-08:** cost per task depends on how the agent gets the browser more than on the
> engine: median tokens/task Playwright MCP 31K, Chrome DevTools MCP 46K, agent-browser CLI with a
> short instruction 4–7K, equal accuracy —
> [doccraft.dev 2026-10-26](https://doccraft.dev/blog/playwright-mcp-vs-devtools-mcp-vs-agent-browser).

**The tunnel keeps the agent inside its boundary.** Chrome already refuses navigation from web pages
to `file://` (clicked links, scripts, redirects) with no override, so the remaining path is the
controller itself navigating there; the tunnel rejects `file://` targets in navigation commands.
Downloads are pinned with `Browser.setDownloadBehavior` (`downloadPath`, per browser context) to the
profile's Downloads folder, and the tunnel rejects attempts to change it. One browser per profile
means one download location, so it is per profile, not per project; the agent moves a file into a
project when it belongs there. (2026-11-08, owner agreed)

**Agents act in hidden windows.** Each agent session works in its own browser window, kept hidden;
a window is shown only for a handoff, while its agent waits. The person never clicks in a window an
agent is driving, and parallel agents don't share tabs; logins are shared because the profile's
cookies are. (2026-11-08, owner, from the failure sweep; per-session windows are the design agent's
reading of "the agent clicks in a hidden window")

**Keeping the window out of the way.** We launch the browser and every command passes the tunnel, so
we force background page creation, keep the window minimized and re-hide it if it surfaces. Fiddly on
macOS; worth an early prototype, since a browser that jumps to the front breaks "the agent works in
the background without getting in your way".

> **Checked 2026-11-08:** "Not allowed to load local resource" for `file://` navigation from
> non-file pages, no option to disable in Chrome —
> [textslashplain](https://textslashplain.com/2019/10/09/navigating-to-file-urls/);
> `setDownloadBehavior` takes `downloadPath` and `browserContextId` —
> [cdproto](https://github.com/chromedp/cdproto/blob/main/browser/browser.go).

**Rejected.**

- Chromium inside the sandbox, shown in the app as a screencast — no native window, passkeys and
  Touch ID likely unavailable; kept only as the remote view of the same browser.
- Headless browser restarted headed for the handoff — loses the page state.
- A Chromium fork — security releases every few weeks would have to be followed; a shipped stock
  build plus our launcher is enough.

## D28

**The agent may change anything inside its current reach without asking; whatever widens its reach —
a new plugin, a new account connection, a new schedule that acts without a person, a new destination
in the browser tunnel — needs the person's confirmation in the conversation. The agent batches these:
one confirmation covering everything it proposes at that point, not one click per item.**
(2026-11-08, owner)

**Why.** A web page the agent reads can try to instruct it ("install X, schedule daily mail to this
address"); a confirmation on reach-widening changes stops that from becoming a permanent foothold.
Batching keeps onboarding — which may propose several plugins, a connection and two schedules at
once — to one decision. Inside the sandbox and project nothing needs asking: the sandbox and the
tunnel are the boundary, unlike coding agents running directly on the computer.

**Confirmations come only from the app's interface** (a button the person presses), never as a
message in a conversation, whoever sent it — otherwise an agent steering another agent ([D30](#d30))
could approve on the person's behalf. (2026-11-08, owner, from the failure sweep)

**Accepted risk.** A plugin *update* that widens reach (e.g. adds sending to a drafts-only mail
plugin) is not caught; plugins are expected to be made carefully. (2026-11-08, owner, from the
failure sweep — owner doubts it can be detected reliably)

**Rejected.**

- A separate confirmation per setting or plugin — too many clicks (owner).
- Letting the agent configure everything silently — one malicious page gets a lasting foothold.

## D29

**A scheduled run is an ordinary, visible, interactive session. It inherits the reach the project already has and
needs no permissions of its own; if it hits something that needs the person, it asks in that session
and waits, and the person is notified.** (2026-11-08, design agent proposal at the owner's request;
not confirmed)

**Why.** Defining permissions per schedule up front is impractical — what the agent will need is
decided while it runs — and unnecessary, because the reach is already set by the project's plugins
and connections ([D28](#d28)). A visible session lets the person see what happened and answer the
agent there, instead of a run that silently stalls or gives up.

**Where schedules live.** Every schedule belongs to a project, which is the folder its agent starts
in. One profile-wide Schedules page lists all of them, with their basic settings editable there. A
run's conversation is marked as coming from its schedule; the project's history can be filtered by
schedule, and the schedule's page shows its runs. (2026-11-11, owner)

**Never archived.** Conversations, scheduled or not, are not archived when they finish or when their
tab closes; they stay in history. Hiding a conversation for good may come later as an action taken
from history. (2026-11-11, owner)

**Overlap.** While a schedule's previous run still waits for the person, the next run does not start;
the notification says today's run was skipped. (2026-11-08, owner, from the failure sweep)

**Rejected.**

- Schedules owned by the profile, with a project optional and, without one, the agent seeing only
  Memory and Downloads ([history](history/DECISIONS.md#d29)) — no case needs a project-less schedule
  yet (even a cross-project morning brief can live in its own project and reach others through
  [D30](#d30)); add it when one appears (owner, 2026-11-11).
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

## D30

**Agents start, steer and watch other agents through the daemon, exposed to them as an MCP server the
way Paseo does it: create an agent in any project of the profile, send it a prompt, read its status
and activity, see the profile's projects.** (2026-11-08, owner)

**Why.** Lets work cross projects — the email-sorting agent finds a recruiter's reply and hands it to
an agent in the job-search project — beyond OpenCode's own subagents, which live inside one session.
Starting an agent in another project of the same profile does not widen reach ([D28](#d28)), since
projects are not walls ([D11](#d11)).

> **Checked 2026-11-08:** Paseo's MCP exposes `create_agent`, `send_agent_prompt`,
> `get_agent_status`, `list_agents`, `get_agent_activity`, workspaces, schedules and heartbeats;
> `daemon.mcp.injectIntoAgents` gives agents it launches access — [docs](https://paseo.sh/docs/mcp).

## D31

**Voice transcription is built in with a smart default model; which one is decided later and tuned
afterwards — anything reasonable for now.** (2026-11-08, owner)

## D32

**App translations use the nzyme i18n framework (`@nzyme/i18n`, `.loc.yaml` compiled to `.loc.ts`).**
(2026-11-08, owner)

> **Checked 2026-11-08:** present in this repository — `nzyme/packages/i18n`,
> `nzyme/packages/i18n-compiler` ("Compiles .loc.yaml translations to .loc.ts"), `nzyme/packages/vue-i18n`
> (INDEX.md).

## D33

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
- **Schedules** is one sidebar item: the profile-wide list of every project's schedules ([D29](#d29)).
- **Plugins** are one sidebar item with Installed and Marketplace beneath it; a plugin's page shows the
  projects it is attached to, what it knows about the person (links to its files), and "Set up again",
  which reruns its onboarding.

**Rejected.**

- One continuous conversation per project — results of schedules would need a separate place, and
  it grows forever.
- Tabs as the list of all open conversations (Paseo's model) — tabs here also hold files and are
  opened and closed constantly; history belongs under the project (owner).
- Markdown syntax visible by default — most users don't know Markdown.

**Unchecked.** How faithfully Tiptap round-trips arbitrary Markdown the agent writes (tables, nested
lists, front matter).

## D34

**A plugin is installed either for the whole profile or into a project. A plugin that gives general
access (e.g. Gmail: connect and read mail) belongs to the profile and is available in every project.
A plugin that is a specific workflow (e.g. email sorting) belongs to a project, and that project is
where the workflow keeps everything it needs — its rules, pending decisions, things waiting.
Usually one workflow per project ("Email" holds email sorting), but nothing enforces it.**
(2026-11-11, owner)

**Why.** "Email" is a perfectly good project: everything the agent needs to sort mail lives there, so
a workflow needs no space of its own. Access to Gmail, on the other hand, is useful in job search,
health (receipts) and anywhere else.

**The plugin's author decides its level**, and for now it cannot be changed: a profile plugin can't be
installed into a project, nor the reverse. (2026-11-11, owner)

**Open.** How a workflow plugin states that it needs a profile-level one (email sorting needs a mail
plugin, Gmail or Outlook).

**Consequence.** Profile-level plugins put their tools in every project, which [D11](#d11)'s
attachment was meant to avoid; keeping that small is the MCP-context optimisation already deferred
there.

**Rejected.**

- Every plugin attached to projects only — general access like Gmail would have to be attached to
  every project that ever needs mail (owner).
