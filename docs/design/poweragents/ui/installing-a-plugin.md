# Installing a plugin, with its onboarding

## The product, in two paragraphs

A desktop app (macOS and Windows) that gives people who don't program the kind of AI-agent setup
developers build for themselves: an agent that works on their files, browses the web, runs on
schedules, remembers them, and can be extended with plugins. Everything the agent does runs in an
isolated environment the app ships.

The users are not technical. They install ready-made capabilities, not tools: "email sorting", not
"a Gmail MCP server". Most will never build a plugin themselves.

## What a plugin is

One kind of thing, made of whatever parts it needs: instructions for the agent (skills), access to
outside services (e.g. Gmail), a setup conversation that runs right after installation, schedules, and
programs installed into the agent's environment (e.g. Blender for a 3D plugin). Tags in the
marketplace ("workflows", "creative", "for work") are only for browsing.

A plugin keeps what it learns about the person — e.g. email-sorting rules — as ordinary files in a
project. It can create its own project when installed (e.g. "Email sorting") or be installed into the
project the person is in. It is **attached** to projects: in those projects the agent has its tools at
hand.

## Purpose of this path

Get from "I want my email sorted" to a working, scheduled email sorting set up the way the person
works — through a conversation, not configuration screens.

## Two ways in

- **From the Marketplace** (Plugins → Marketplace → a plugin → Install).
- **From a conversation** — the agent suggests it ("I can sort your email every morning — want that?")
  during onboarding or any chat, as part of a batched approval.

## Screens, in order (example: email sorting)

1. **Marketplace.** Browse and search plugins by what they do for you. Tags filter.
   *Answers: what could this app do for me?*

2. **Plugin page (before install).** What it does in plain words, an example of the result, what it
   will need (access to your email, a daily schedule, a project where its rules live), and what it
   will *not* do (e.g. "creates drafts, never sends email on its own").
   *Answers: is this what I want, and what am I letting it do?*

3. **Install = one approval.** The same batched approval as inside a conversation: the plugin, its
   project, its schedule, listed together, approved with one button. Account access is asked for
   during setup, not here.

4. **Setup conversation starts on its own** in the plugin's project. The agent asks, e.g.: which email
   provider (Gmail / Outlook), then starts that provider's sign-in (the provider's own page opens; if
   the Google account is already connected for another plugin, only one extra "Allow" for the new
   service); what kinds of email you get and what should happen to them (parcels, newsletters, bills);
   when it should run. Answers come as clicks where possible (choices, time picker). The rules it
   learns are saved as files in the project, which the person can open.
   *Answers: is it set up the way I want?*

5. **Done.** A summary of what was set up: the project, the schedule, the connected account, where the
   rules live. The first run can be started right away.

## After installation

- **Plugin page (installed):** projects it is attached to; what it knows about you (links to its
  files); its schedules; **"Set up again"**, which reruns the setup conversation to change anything;
  remove.
- Changing setup is always that conversation — there is no separate settings form.

## States

- **Setup abandoned halfway** — the plugin is installed but not fully set up; this shows on the plugin
  page and in Waiting for you, and "Set up again" continues.
- **Account sign-in cancelled or failed** — the conversation says so and offers to retry.
- **Installation of the plugin's programs in progress** (can take a while for large ones like Blender).
- **Installation blocked by a conflict** with an already installed plugin (both need incompatible
  versions of something) — say which plugin it conflicts with, in plain words.
- **Plugin installed from inside an existing project** — no new project is created; it attaches there.

## Failures that must be visible

- The plugin's programs failed to install (no network, download failed) — retry; nothing half-working
  is presented as working.
- The connected account stops working later — the plugin's runs ask for reconnection.
- Removing a plugin whose project holds the person's files — say what happens to those files.

## Technical constraints

- Installing programs into the agent's environment is asynchronous and can take minutes.
- Google shows its own consent screen; for an unverified app it shows an "unverified app" warning (a
  verification process on our side is pending).
- One Google account connection serves all Google plugins; each new Google service costs one more
  "Allow" on Google's page.

## Questions this design should settle

- How the plugin page communicates what the plugin may and may not do, for someone who doesn't know
  what "access" means technically.
- How the batched approval reads when it lists a plugin, a new project and a schedule together.
- How "Set up again" is discovered.
