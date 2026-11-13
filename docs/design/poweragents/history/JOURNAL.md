# Journal

Append-only. One line per turn that settled something, was rejected, or got an answer from the owner.

- 2026-11-08 — Session opened. Owner's brief (Polish, long) captured: an agent harness on top of
  OpenCode for non-technical users. Problem: non-technical users stop at ChatGPT/Claude chat or
  Cowork-style apps with a few plugins; they don't know skills exist, don't know they'd want them, and
  lack the confidence to ask an agent to build a workflow. Setting up what power users have (workspace,
  repo, AGENTS.md, skills, Python/Node runtime, Playwright, …) is too much. Owner's stated shape:
  one installable app; built-in agent-controlled Chromium shown inside the app (user can log in there,
  agent never gets the user's own browser); plugin marketplace (Gmail, Google Docs, …) with ready
  *workflows*, not just connectors (example: daily email triage with labels and learning); projects as
  folders of markdown files browsed/edited in-app like Obsidian, storage location abstract (local
  default; Google Drive / iCloud / private cloud later); onboarding that interviews the user (who are
  you, what do you do, what could an agent help with) implemented as a rerunnable "configuration"
  plugin of skills; sign-in with ChatGPT or Claude subscription; daemon + thin client like Paseo, the
  signed desktop client works with any daemon (local, remote, custom); open source; all agent work runs
  sandboxed in a bundled container runtime (no user-installed Docker), only project folders mounted;
  one reproducible manifest (compose-like) describing the whole agent environment, portable to another
  machine or a cloud; profiles (work / private) with runtime per profile, per-project isolation at
  config level only (owner's lean, asked whether it's needed); built-in voice transcription with a
  smart-default model; multilingual, Polish market first; schedules, agent-to-agent communication and
  orchestration (like Paseo MCP). Later: mobile companion app with notifications, cloud-hosted agents.
  Owner asked: what else matters for usability for non-technical users.
- 2026-11-08 — Dispatched three checks: OpenCode subscription sign-in status and server API; embeddable
  sandbox runtimes on macOS/Windows; Paseo architecture and existing products (Cowork, OpenWork).
  Nothing folded into README yet beyond the opening.
- 2026-11-08 — Check returned (Paseo / market): Paseo is Apache-2.0, daemon on ws://127.0.0.1:6767,
  clients (Electron desktop, Expo mobile/web, CLI) connect to it, E2E-encrypted opt-in relay, MCP with
  agent/schedule/heartbeat tools, plain-file storage under ~/.paseo. OpenWork (different-ai/openwork,
  MIT outside ee/, ~24k stars) is already "open-source Cowork alternative built on OpenCode": Electron,
  OpenCode server on :4096, skills via OpenPackage, ChatGPT sign-in, built-in browser; sandboxing and
  scheduling only partial; desktop schedules need the app open. Cowork moved to cloud sandboxes by
  default (local VM only for pre-2026-10-06 tasks). ChatGPT Work exists (2026-11-06). No local-first
  product has a hard sandbox by default. Not yet put to the owner.
- 2026-11-08 — Owner was asked: (1) did they know OpenWork and what put them off; (2) write the
  "what is different" scene together. Framed the fork: build own daemon-first product vs start from
  OpenWork and spend effort on onboarding/workflows/Polish market/sandbox. No answer yet.
- 2026-11-08 — Check returned (OpenCode / sign-in). Claude: Anthropic forbids third-party apps offering
  claude.ai login or holding Claude tokens (code.claude.com/docs/en/legal-and-compliance, fetched
  2026-11-08); carve-out: an end user signing in to the *unmodified* Claude Code binary, also when a
  platform hosts it; requires Commercial Terms. OpenCode v2.2.3 (2026-10-30) added a "Claude Agent"
  provider that drives the user's own `claude` login — this is what the owner meant by "Claude login in
  OpenCode". ChatGPT: OpenAI's Sign in with ChatGPT page lists OpenCode among open-source integrations;
  plan usage allowed for open-source and personal-local apps, paid/hosted apps go through a waitlist.
  OpenCode: MIT, repo now anomalyco/opencode, `opencode serve` HTTP+SSE API, OpenAPI at /doc, JS SDK,
  skills in .opencode/.claude/.agents skills dirs, subagents, custom agents, plugins with hooks, MCP
  local+remote with OAuth. Latest v2.2.6 (2026-11-06).
- 2026-11-08 — Check returned (sandbox runtimes). Cowork (pre-cloud) used Virtualization.framework on
  macOS and its own HCS VM + SYSTEM service on Windows, VirtioFS for folders, vsock for control (Anthropic
  architecture page + third-party analyses). Options: Virtualization.framework directly; libkrun/krunkit
  (Apache-2.0, no Windows yet); Apple `container` (macOS 26 + Apple silicon only, needs sudo for host
  DNS); microsandbox (beta, libkrun); WSL2 import of own rootfs (first-time feature enable needs admin +
  reboot, no admin-free path found). Minimal VZ VM boots ~0.3–0.9 s in community benchmarks; Cowork VM
  allocated ~4 GB RAM; partial memory ballooning on macOS. CDP: Chrome rejects non-IP/localhost Host
  headers → relay inside guest over vsock is the practical shape. Not yet put to the owner.
- 2026-11-08 — Owner corrected me: Claude subscriptions do work in OpenCode now. Re-checked: correct.
  OpenCode v2.2.3 (2026-10-30) Claude Agent provider runs the user's unmodified `claude` via the Agent
  SDK; OpenCode contributor on PR #58782: "We got permission from Anthropic and everything here is fully
  tos compliant" (reported by dalao.ai 2026-10-31; no separate Anthropic announcement). Constraints from
  OpenCode docs as reported: Claude Code ≥2.1.248 on the same machine as the OpenCode server; Claude
  Code's own settings/CLAUDE.md/hooks/MCP not loaded; not available in OpenCode remote workspaces.
  My earlier "won't work as you imagine" was wrong in direction; the real consequences are where
  `claude` runs (inside our sandbox) and how its browser sign-in reaches the user.
- 2026-11-08 — Owner doesn't know OpenWork, sees it as a Cowork clone, asked how it differs from our
  assumptions. Read their README (fetched 2026-11-08): positions itself as Cowork alternative with
  "Migrate from Claude Cowork"; business model is OpenWork Den (org control plane, RBAC, team skill
  marketplace, MCP gateway; source-available, free ≤5 users).
- 2026-11-08 — Owner gave the scene: his wife on Paseo + Claude Code with a basic CLAUDE.md and an
  Obsidian vault where the agent keeps memory about her; LinkedIn job-search schedule, Instagram post
  design, and a self-built health/skin-care assistant sending daily routines. Individual is the entry
  point; money from companies later (shared workspaces, toolsets, cloud/intranet, collaboration, custom
  development). Differentiation: opinionated memory / "digital twin". Folded into README ("What is
  different", "Who it is for"). DECISIONS.md created with D1–D7 (engine, sign-in, audience, memory,
  daemon+client, sandbox, multilingual).
- 2026-11-08 — Owner: projects are separate folders (D8, rejecting my one-vault-per-profile
  recommendation); memory about the person global across projects in a profile (D9, mechanism open);
  wife gets notifications via a Telegram bot today, which needed setup → mobile companion from the
  start (D10). Owner asked about relay (Paseo) vs Headscale tunnel without a VPN on the phone.
- 2026-11-08 — Owner: relay/mobile deferred; v1 desktop-only local, mobile in v2 soon after (D12,
  retires D10). Memory = "Pamięć", a plain folder of files per profile, agentic search, nothing magic,
  nothing per project (D9 rewritten). Projects organise work, not isolation; per-project tool visibility
  to keep context small, idea of usage-based promotion with a limit (D11, mechanism open). Schedules
  only when awake; background running is the cloud offering's value (D13).
- 2026-11-08 — Owner: MCP context size deferred as a future optimisation (idea: progressive
  disclosure — agent sees which servers exist, reads a server's tools only when it needs them).
  Plugins are post-v1 but discussed: made of skills, MCP servers with config, preferences, additions
  to the sandbox environment (dependencies), idempotent onboarding when installed and on demand,
  possibly their own file space (project-like, less visible), dependencies on other plugins (soft,
  e.g. by mail provider chosen at onboarding; hard if useful). Email triage example: provider-agnostic
  skill, onboarding asks which provider and runs its sign-in, many rules about what goes where.
  Recorded D14 (agent can configure anything the app can), D15 (browser handoff for login/CAPTCHA),
  D16 (one sign-in per account per profile). Dispatched check on Google restricted Gmail scopes /
  CASA and Microsoft equivalents.
- 2026-11-08 — Proposed to owner (not yet confirmed): split plugins into "connection" (one per account
  per profile: sign-in, MCP, maybe a usage skill, no files) and "workflow" (rules, schedule, onboarding;
  installing it creates a visible project, e.g. "Maile", rules are files there; needs a connection of a
  kind, not a specific provider). Google check returned and attached to D16: gmail.modify restricted →
  verification needed past 100 users; CASA possibly avoidable for local-only, unresolved; no incremental
  auth for desktop apps.
- 2026-11-08 — Owner rejected the connection/workflow split: one composite plugin, tags only (D17);
  onboarding = skill marked in manifest to auto-run after install, rerunnable chat (D18); plugin data =
  plain files in the plugin's own folder, shown under the plugin, not a project, because projects feel
  time-bounded (D19). Google consent-per-service recommendation not answered yet.
- 2026-11-08 — Owner: turning one's own project into a plugin is out of scope for now; typical users
  won't author plugins; authoring model unknown. Plugin files live in projects referenced from the
  plugin's configuration; a plugin may create a project at install or be installed into an existing
  one; may use several (D20, retires D19). Still unanswered and recorded nowhere as decided: Google
  consent per service when added; missed schedule runs → run once, latest.
- 2026-11-08 — Owner: plugin attachment decides a project's default tools (D11 sharpened). Silence
  taken on consent-per-Google-service (D16) and missed-run-once (D13). Sequencing out of the design:
  design the full first version incl. plugins, marketplace, mobile, relay (D21, retires D12). First
  run: wizard with sign-in + data location, then first project "App setup" with the configuration
  plugin's onboarding chat (D22). Generative UI in chat, OpenUI candidate (D23, checked).
- 2026-11-08 — Owner: OpenUI as built-in tool + skill with spec and supported components (D23 how);
  data location "on this computer" default folder, changeable, cloud drives later; sandbox → sign-in →
  App setup order and silent first profile agreed (D22). README: "The first run" section added.
- 2026-11-08 — Owner: Python+uv and Bun built into the sandbox with a skill (D24); everything else in
  the manifest, one install method per kind (JS, Python, Linux), idempotent on running and fresh
  sandbox, no order-dependent scripts (D25). Format still open.
- 2026-11-08 — Owner rejected uv/Bun project files as manifest and frozen apt date (block updates;
  describe the container, not its source). Manifest = installed plugins (versions, config) + base
  environment version; packages derived from plugin declarations; marketplace controls versions (D26).
- 2026-11-08 — Owner: agent installs by authoring its own local plugins (D26). Owner read my "system
  packages move with the base environment" as "Blender preinstalled in base" — clarifying: the point
  was apt versions come from the distro release; open question how a plugin pins a system tool version.
- 2026-11-08 — Owner: system-tool install method (apt vs pinned archive) deferred until real plugins, neither ruled out (D26).
- 2026-11-08 — Browser discussion. Owner: browser may live outside the sandbox (its own isolation is
  enough), must be a separate Chromium we control, not the user's browser; agent drives it through a
  tunnel from the sandbox; "inside the app window" is a soft requirement, great UX is the real one;
  asked whether a headless session can be shown later as the *same* session (JS state, CAPTCHA,
  paywall), whether a custom Chromium build makes sense, and heard DevTools is cheaper than Playwright.
  Checked 2026-11-08: headless/headed is a launch flag, cannot switch a running Chrome
  (developer.chrome.com/docs/automation-and-testing/headless; OpenClaw issue #75879 does stop→start
  headed with the same profile, losing page state). Same-session options: headed Chrome with a hidden
  window shown on demand, or CDP screencast of the live tab. Token cost (doccraft.dev 2026-10-26, 19
  tasks ×2): median tokens/task Playwright MCP 31K, Chrome DevTools MCP 46K, agent-browser CLI with a
  short AGENTS.md block 6.9K, with 3 rules + output cap 4.1K; all equally accurate — the interface
  (CLI + short instructions vs MCP) matters more than the engine; "DevTools is cheaper" not supported.
- 2026-11-08 — Owner agreed browser shape (D27). Owner asked: file:// clicks, forcing downloads into the project, Playwright window always on top. Checked and attached to D27.
- 2026-11-08 — Owner agreed: tunnel blocks file:// navigation, profile-level Downloads folder visible to agent (D8, D27), window-hiding work + early prototype. README: browser section.
- 2026-11-08 — Owner: no replaceable daemon for now; build our own, kept separate from the client; customisation later (D5 rewritten, old form to history).
- 2026-11-08 — Owner: reach-widening changes need confirmation, batched by the agent (D28). Asked whether scheduled sessions should be visible/interactive like Paseo, whether permissions can be defined at schedule creation, whether escalation works in an interactive session → recorded D29 as proposal (interactive session, inherits project reach, escalates and waits); open: outward actions in the person's name.
- 2026-11-08 — Owner: no per-schedule outward-action switch; plugins expose safe tools (mail: drafts only); buying needs login = implicit consent; payments out of scope (D29).
- 2026-11-08 — Owner: agent orchestration via daemon MCP like Paseo (D30); voice model deferred, anything for now (D31); i18n via nzyme i18n (D32). Next: failure sweep.
- 2026-11-08 — Failure sweep run; classified in history/2026-11-08-failure-sweep.md; six credible failures put to owner.
- 2026-11-08 — Sweep dispositions recorded (D9 open file history, D20, D27, D28, D29).
- 2026-11-09 — Owner closed screen-level questions (D33): many conversations, sidebar expands project to recent conversations + full history, editor-style tabs for conversations and files, Waiting-for-you inbox, rich Markdown editor (Tiptap), Plugins item with Installed/Marketplace, schedules per profile with optional starting project (D29). Next: UI briefs.
- 2026-11-09 — UI briefs written: ui/first-run.md, ui/daily-work-in-a-project.md, ui/installing-a-plugin.md; README section 'What the person sees' links them.
- 2026-11-11 — Owner will design the main screen first, then onboarding. Added a 'day one' state to ui/daily-work-in-a-project.md (onboarding lands on the main screen).
- 2026-11-11 — Owner: workflows like email sorting are projects; plugins installed at profile level (general access, e.g. Gmail) or project level (workflow, keeps its info in the project), usually one workflow per project, not enforced (D34). Scheduled runs never archived, found from the schedule's page; one history list (D29, D33 rewritten; old forms to history). Proposed: sidebar recents show only person-started/opened conversations + runs needing them.
- 2026-11-11 — Owner: plugin level set by author, not changeable for now (D34). Schedules belong to projects; profile-wide Schedules page for overview and basic settings; runs marked, project history filterable by schedule (D29, D33 rewritten, reverses 2026-11-09 profile-owned schedules). Sidebar-recents proposal accepted.
- 2026-11-12 — Daily-work design round 1 in the app: screen 11 finished, screens 12–18 for the brief's states and failures, five Variants frames (19–33) for the owner to pick; log in history/daily-work-in-a-project.md.
- 2026-11-12 — Owner picked the daily-work variants: Waiting card stays, schedule header, files in the sidebar plus a side view from the conversation, agent waits only while she edits. Memory is plain files with no view of its own (D9 Rejected updated, brief clarified); the sidebar says Memory again, per D9.
- 2026-11-12 — Delivery start (working agent). Owner: one sandbox per profile; isolation between projects logical only, agent may look into other projects (D6, D8 rewritten, old forms to history); runtime left to the delivery agent — Lima on macOS, Windows later (D6); agent runs without approvals inside the sandbox, as D28 already says.
- 2026-11-12 — First-run design round 1 in the app: screens 35–41 (preparing the environment, its failure, connecting Claude with the pasted code and its failures, connected) and a `First run · components` frame; log in history/first-run.md.
- 2026-11-13 — Design round from .context/projects-brief.md: first-run screens synced with the build (round 5 in history/first-run.md, new 50 and `atoms/Check badge`); projects in the first working version, screens 51–55 with a projects-only sidebar and a new-project dialog; log in history/projects.md.
- 2026-11-13 — Owner: Sonnet by default with Claude, Terra with ChatGPT; a model and reasoning-effort switch later (D35).
- 2026-11-13 — Conversations design round from .context/conversation-brief.md: screens 56–61 (agent working, finished, a project's conversations with *Nowa rozmowa* in the sidebar, the agent could not answer, signed out of Claude, usage limit) and five step and error molecules; log in history/conversations.md.
