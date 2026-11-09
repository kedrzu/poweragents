# poweragents

A desktop app that gives people who don't program the same kind of agent setup that developers have
built for themselves: an AI agent that works inside your projects, uses tools, browses the web, runs on
a schedule and gets better at your work over time. It runs on [OpenCode](https://opencode.ai) under
the hood. You install one app, sign in with the AI subscription you already have, and everything else
comes built in.

## Why

People who use agent tools every day live in a bubble. For them, an agent that writes its own scripts,
follows a skill written for one particular job, checks the inbox every morning and triages it the way
they like is normal. Most people, including those who think of themselves as "AI native", use ChatGPT
or Claude as a chat window. Some go a step further with Cowork-style apps and a couple of plugins or
browser control. Almost nobody outside the bubble builds a system of their own.

Two things stop them. First, they don't know what such a system is, how it differs from a chat, or
that they would want one. Second, even once they've seen a power user's setup and want the same, they
lack the knowledge and the confidence to ask an agent to build a workflow for them, and the setup
itself is out of reach: a workspace, often a repository, an `AGENTS.md`, skills, a Python or Node
runtime so the agent can write scripts, Playwright, and a list of other tools. That is a developer's
afternoon and a non-developer's wall.

## What is different once it exists

The picture we build toward is a real one. The owner set up a coding agent (Claude Code, run through
Paseo) for his wife, who doesn't program: a short instruction file telling the agent who it works for,
and a folder of notes she reads in Obsidian, where the agent keeps everything it learns about her, her
projects and her habits. Then he stepped back.

She now uses it for things he never set up. A schedule searches LinkedIn for jobs for her. She designs
Instagram posts with it. And on her own, without asking him, she built a health and skin-care assistant:
every morning it sends her today's routine — what to apply in the morning and in the evening, which
exercises to do — and it adjusts as it learns what works for her.

What made the difference was not any single tool. It was a setup in which the agent remembers her,
can act on a schedule, and can extend itself when she asks. Once that existed, she kept going alone.
What she could not have done is build that setup in the first place. That is what this app does for
everyone else: it ships the setup, so the first hour already looks like her third month.

The bar is therefore not "can a non-technical person install it", but **does a non-technical person,
a few weeks in, ask the agent for something new nobody prepared for them, and get it.**

## Who it is for, and who pays

The first user is one person on their own computer. That is deliberately the way in, not the business:
money is expected to come from companies — a shared workspace for a team with shared workflows, skills
and whole toolsets (installed programs included), possibly hosted in the cloud or on an intranet,
and custom solutions built for a client. The bet is that a product people genuinely like using alone
is easier to bring into their organisation. So the design serves the individual now, and must not
close the door on a shared, company-run version later.

This is also what separates it from [OpenWork](https://github.com/different-ai/openwork), the
open-source app closest to it technically (also built on OpenCode). OpenWork offers companies an
alternative to Claude Cowork, for people who already know what an agent is. This app is opinionated
about the part those products leave to the user: how the agent remembers you and grows with you.

## Profiles, projects and memory

People keep separate lives: a work profile and a private one, each with its own projects, its own
agent environment and nothing shared between them. Inside a profile, work is split into projects the
way a person would split it — designing a wardrobe, researching a purchase, health and skin care, job
hunting, social media. A project is simply a folder of files the agent works in and organises as it
sees fit. Projects are a way to keep work tidy, not walls: each one shows the agent the tools it
usually needs, so the agent isn't handed a hundred tools everywhere, while everything else stays
findable ([how tools are shown per project](DECISIONS.md#d11) is still open).

What the agent learns about the person — preferences, habits, what matters to them — lives in one
place per profile, called **Memory**: an ordinary folder of files, readable and editable in the app
like any project. The agent reads it from every project by searching the files, the same way it
searches anything else. That is a deliberate choice against memory that works like a black box,
where nobody can see what was stored or why ([why memory is plain files](DECISIONS.md#d9)).

## The first run

Installing the app asks only what nothing else can run without. It prepares the agent's environment —
on Windows this needs one administrator consent and a restart, so it comes first, before anything is
invested. Then the person signs in with the AI subscription they already have, ChatGPT or Claude.
Where their files live is a choice of place, not of folder: "on this computer" is the default and the
app picks the folder; cloud drives come later ([what the wizard asks and in what order](DECISIONS.md#d22)).

Then the app opens on its first project, "App setup", and the agent starts talking: who are you, what
do you do, what could I help with. That conversation is the onboarding — it explores with the person
what an agent could do for them and sets it up. It is an ordinary chat that can be reopened whenever
they have a new idea. Where typing would be a chore, the agent shows choices and small forms in the
conversation instead ([generative UI](DECISIONS.md#d23)).

## The agent's own browser

The agent browses the web in a browser of its own — a Chromium the app ships, one per profile, never
the person's Safari or Chrome with all their sessions. It only has the logins the person gave it.
It runs whether or not the app is open, with its window kept out of the way. When the agent hits
something only a human can do — a login, a CAPTCHA — it says so in the conversation with a small
picture of the page; one click brings up that exact window, page state and all, the person does what
is needed and tells the agent to go on ([how the browser is set up](DECISIONS.md#d27)).

The browser lives outside the agent's sandbox, so the connection between them is where the agent's
limits are enforced: it cannot open files from the computer through the browser, and downloads land
in the profile's Downloads folder, which the agent can see.

## What the person sees

A sidebar holds everything in one profile: a "Waiting for you" list of whatever needs the person
across all projects, Memory, Downloads, Plugins, Schedules, and the projects themselves, each opening
to its recent conversations. Conversations and files open side by side in tabs; files read and edit
as formatted text, never as Markdown syntax ([the app's structure](DECISIONS.md#d33)). Three walks
through the app are written up as briefs for the screen design:
[the first run](ui/first-run.md), [daily work in a project](ui/daily-work-in-a-project.md) and
[installing a plugin](ui/installing-a-plugin.md).

## How far this design goes

This design describes the full first version: the desktop app, plugins and a basic marketplace, and a
phone companion for notifications and talking to the agent, connected through a relay. The order in
which those get built is decided separately, not here ([why sequencing is out of this
design](DECISIONS.md#d21)). Schedules run while the computer is awake; agents that keep working while
the laptop sleeps are what a later cloud offering adds, and are outside this design. Payments made by the agent are outside it too.
