# Daily work in a project

## The product, in two paragraphs

A desktop app (macOS and Windows) that gives people who don't program the kind of AI-agent setup
developers build for themselves: an agent that works on their files, browses the web in its own
browser, runs on schedules, remembers them, and can be extended with plugins. Everything the agent
does runs in an isolated environment the app ships; its browser is a separate one the app controls,
never the person's own.

The users are not technical: no Markdown, no terminal, often no folders. Reference user: a woman with
projects "Health & skin care" (a 7:00 routine arrives every morning), "Job search" (the agent checks
LinkedIn), "Instagram posts" (she designs posts with the agent), and an email-sorting plugin that
labels her Gmail daily.

## Purpose of this path

The everyday loop: open the app, see what's waiting, work with the agent in a project — talk, look at
and edit files, approve what the agent asks to approve, step in when the agent's browser needs a human.

## The user's task

"Check what the agent did and what it needs from me, then get on with something." Sometimes: "ask it
for something new."

## The things on screen, and what they mean

- **Profile** — a separate life (e.g. Private, Work), each with its own projects, memory, plugins and
  agent environment. Most people have one; the switcher appears only when there are two or more.
- **Project** — a folder of files the agent works in, e.g. "Job search". It holds many conversations.
- **Conversation** — a chat with the agent inside a project. Runs started by a schedule are
  conversations too, archived automatically when they finish.
- **Memory** — the profile's files about the person (preferences, habits, what matters). Plain files,
  readable and editable like any project; the agent reads them everywhere.
- **Downloads** — where everything the agent's browser downloads lands.
- **Plugins** — installed capabilities (e.g. Gmail email sorting, 3D design); Installed and Marketplace.
- **Schedules** — everything that runs automatically, for the whole profile; a schedule may start in a
  project.
- **Waiting for you** — everything across the profile that needs the person now.

## Screens and what they answer

1. **App open, sidebar visible.** Sidebar order: profile switcher (only if more than one), Waiting for
   you, Memory, Downloads, Plugins, Schedules, then projects with "App setup" pinned first. Clicking a
   project expands its recent conversations beneath it and offers "all conversations" (the project's
   full history). The main area has tabs for whatever is open — conversations and files — opened and
   closed like an editor's tabs.
   *Answers: where is my stuff, and does anything need me?*

2. **Waiting for you.** One list across all projects: approvals to give, a browser waiting for her to
   log in or solve a CAPTCHA, a conversation where the agent asked a question, a scheduled run that was
   skipped because the previous one was still waiting. Each item opens the place where it is resolved.
   *Answers: what is blocked on me?*

3. **A conversation.** The chat with the agent. Beyond text, the agent can show interactive pieces
   (choices, small forms, cards) instead of making her type — see the elements below. Voice input is
   available in the message box (built-in transcription). A conversation started by a schedule says so
   (which schedule, when it was supposed to run, when it actually ran).
   *Answers: what is the agent doing, and what does it need?*

4. **Files of the project.** A file tree beside the conversation; files open in tabs. Text files are
   edited as formatted text (headings, lists, bold) with no Markdown syntax visible; images, PDFs and
   spreadsheets get a preview. The agent may be changing files while she looks.
   *Answers: what's in this project, and what did the agent write?*

5. **Memory.** Same as a project's files, framed as "what the agent knows about you". She can read and
   correct it.
   *Answers: what does it know about me, and is it right?*

## Elements inside a conversation that need their own design

- **Batched approval.** When the agent wants to widen what it can reach — install plugins, connect an
  account (e.g. Google), create schedules that run without her — it proposes everything at once and
  she approves with one button (or declines, or adjusts). Approval only ever comes from this button;
  typing "yes" in the chat does not count.
- **Browser handoff.** The agent's browser hit a login or a CAPTCHA. The conversation shows a small
  picture of the page and a button. Clicking brings up the real browser window with exactly that page;
  she logs in or solves it, comes back and tells the agent to continue (a "Done, continue" action).
  Meanwhile the agent waits.
- **Generated choices and forms.** E.g. "Which of these labels do you use?" as checkboxes, "When should
  your routine arrive?" as a time picker. Her click goes back to the agent as her answer.
- **The agent asking and waiting** in a scheduled run — the conversation clearly shows it is paused on
  her.

## States

- **Empty project** — no files, no conversations: invite her to start a conversation.
- **Agent working** — streaming answer, files changing; she can keep reading or stop the agent.
- **Conversation waiting on her** — visible in the conversation, in the project in the sidebar, and in
  Waiting for you.
- **Scheduled run in progress / finished / archived.**
- **Agent's environment starting** (after the computer woke up) — conversations may take a moment to
  respond.
- **Signed out of the AI provider / subscription limit reached** — the agent cannot answer; say why and
  how to fix it.

## Failures that must be visible

- A scheduled run was **skipped** because the previous run is still waiting for her.
- A scheduled run happened **late** because the computer was asleep (it runs once on wake, for the
  latest missed time).
- A connected account stopped working (access revoked, password changed) — the agent asks her to
  reconnect.
- A project that plugins or schedules depend on is being deleted — warn and say what stops working.
- The agent changed a file she was editing at the same moment. (No file history exists yet; how this
  is resolved is open.)

## Technical constraints

- Everything arrives asynchronously from a background service; the app may have been closed while
  things happened, so on open it must catch up.
- Several agents can be working at once in different projects.
- Files are plain Markdown underneath; the rich editor must not lose what the agent wrote.
- The browser is a real separate window owned by the app's background service; the app can bring it
  forward but does not embed it.
- No undo/history of file changes exists yet.

## Questions this design should settle

- How Waiting for you, the sidebar and the conversation each signal "needs you" without nagging.
- How a conversation started by a schedule differs from one she started.
- How the file tree and the conversation share the screen, and how she notices the agent editing a
  file she has open.
- How Memory is framed so it reads as "what it knows about me", not as another folder.
