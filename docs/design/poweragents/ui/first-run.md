# First run: from installing the app to the first conversation

## The product, in two paragraphs

A desktop app (macOS and Windows) that gives people who don't program the kind of AI-agent setup
developers build for themselves: an agent that works on their files, browses the web in its own
browser, runs on schedules, remembers them, and can be extended with plugins. The person signs in with
the AI subscription they already have (ChatGPT or Claude). Everything the agent does runs inside an
isolated environment the app ships, so nothing gets installed on the person's computer.

The users are not technical. They don't know what Markdown, a terminal or a folder path is, and many
don't navigate folders at all. The first market is Poland; the app is multilingual from the start.

## Purpose of this path

Get a person from a freshly installed app to a conversation with the agent, asking only what the app
cannot work without. Everything else — who they are, what they want help with, which plugins to
install — happens afterwards as a conversation, not as forms.

## The user's task

"I installed this thing someone recommended. I want to get to the point where it does something for
me." They have no idea yet what it can do.

## Screens, in order

1. **Welcome.** Answers: *what is this, and how long will setup take?* One sentence about what the app
   does; the promise that setup takes two steps and then the app will ask about them.

2. **Preparing the agent's environment.** Answers: *is it working, and do I need to do anything?*
   - macOS: runs on its own, a few seconds to a few minutes (first download of the environment). Show
     progress, not technical steps.
   - Windows: the system needs one administrator approval and a restart the first time. The screen
     must explain *before* the system dialog appears why this is needed (the agent works in a separate,
     safe space on the computer) and that the app continues where it left off after the restart.
     After the restart the app reopens on this step and finishes.

3. **Sign in to your AI.** Answers: *which account do I use?* Two equal options: ChatGPT (Plus/Pro) and
   Claude (Pro/Max). An "I have an API key" path exists but is secondary. Choosing one opens the
   provider's own sign-in page in the system browser; the app waits and confirms when it's done.
   - Claude specifics: the sign-in belongs to Claude Code running inside the environment; the person
     only sees the provider's sign-in page and a confirmation. They never type a password into our app.

4. **Where your files live.** Answers: *where does my stuff go?* A choice of *kind of place*, not a
   folder: "On this computer" is preselected; cloud drives (iCloud, Google Drive, OneDrive) appear later
   as further options. A small "change location" link for people who care. While there is only one
   option, this step may be shown as information rather than a question.

5. **The app opens on the "App setup" project**, and the agent starts the conversation on its own:
   who are you, what do you do, what could I help with. This is the real onboarding (see
   [daily work in a project](daily-work-in-a-project.md) for what the app looks like from here).

## States

- **Environment download slow or interrupted** — progress keeps its place; on failure, a plain retry,
  and the person learns that nothing is broken on their computer.
- **Windows: approval declined** — the app cannot run the agent without it. Explain what will not work
  and offer to try again; don't dead-end.
- **Sign-in: browser tab closed or sign-in abandoned** — the screen still waits; offer "open again".
- **Sign-in: plan doesn't allow it** (e.g. a free ChatGPT or Claude plan) — say which plans work.
- **Returning after a restart mid-wizard** — resume at the step they were on.

## Failures that must be visible

- The environment could not be set up (no virtualization support, not enough disk) — the person must
  understand it's their machine, not their mistake, and what to do.
- Signed in, but the provider later rejects requests (subscription lapsed) — this surfaces in the
  conversation later, not here, but the sign-in screen must be reachable again from settings.

## Technical constraints

- The environment must be running before sign-in (the Claude route signs in a program inside it).
- The environment's first download size and time are not known yet; design for "seconds to minutes".
- On Windows the first enablement needs admin rights and a reboot; there is no way around it.
- Sign-in happens in the system browser, not inside the app.

## Questions this design should settle

- How to make the Windows admin-and-restart moment feel expected rather than alarming.
- Whether the "where your files live" step is shown at all while it has a single option.
- How the jump from wizard into the first conversation feels — the person should sense that the
  "real" setup is the conversation, not more forms.
