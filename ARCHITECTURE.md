# poweragents architecture

poweragents is a desktop app (macOS and Windows) that gives people who don't program the agent setup developers build
for themselves: an agent that works in their projects, browses the web in its own browser, runs on schedules and keeps
what it learns about them in plain files. A background daemon of ours does all of that and serves it over a local port;
the desktop app is a thin client of it, and a phone companion will be another. The product design, with every decision
and its reason, is in `docs/design/poweragents/`.

## Stack

- **Runtime and package manager:** Bun, with Bun workspaces.
- **Language:** TypeScript, ESM; Rust for the desktop shell's native side.
- **Framework packages:** `@nzyme/*` (dependency injection, logging, validation, i18n, Vue utilities), built from
  source from the `nzyme/` git submodule.
- **Build orchestration:** Nx, without a daemon, with its cache in each worktree.
- **Frontend:** Nuxt 4 and Vue as a static SPA, SCSS with CSS modules, reka-ui, Storybook.
- **Desktop shell:** Tauri 2, showing the app's static build in a native window.
- **Daemon:** a Bun process listening on `127.0.0.1` only.
- **Design:** in Pen, in `poweragents.pen` at the repo root; the product design and its decisions are in
  `docs/design/poweragents/`.

## Packages

|Package|Path|Owns|
|-|-|-|
|`@poweragents/common`|`packages/common`|Contracts the daemon and its clients share: the daemon's address, the shapes it serves, the languages the product ships. No dependency on either side.|
|`@poweragents/daemon`|`packages/daemon`|The background service: sandbox, agent engine (OpenCode), schedules, the agent's browser, plugins, sign-ins. Runs whether the app is open or not. Today: a `/status` endpoint.|
|`@poweragents/ui`|`packages/ui`|Vue components, their stories and component specs, the design tokens and global styles. No routes and no daemon access.|
|`@poweragents/app`|`packages/app`|The Nuxt app: screens by feature, routes, the IoC container and the services that talk to the daemon.|
|`@poweragents/desktop`|`packages/desktop`|The Tauri shell around the app's build and its native commands.|
|`@poweragents/e2e`|`packages/e2e`|Playwright tests of the built app, and the screen harnesses.|

## Builds

TypeScript packages that are not Vue (`common`, `daemon`) compile with `tsgo --build` into `dist/`, from a hand-written
`tsconfig.esm.json`; `nzyme monorepo` generates each `tsconfig.json` with its project references. Their `exports` map
`./*.js` to `dist` for `import` and to `src` under the `source` condition, so a consumer resolves the built code and an
editor jumps to the source. The daemon runs from `dist` (`start`) or from source under `bun --watch` (`dev`).

The Vue packages are not emitted: `ui` exports its sources and is type-checked by `vue-tsc`, and `app` is type-checked by
`nuxi typecheck` and built with `nuxt generate` into `.output/public`, which is what the desktop shell loads.

## App and UI

- **Rendering:** a SPA (`ssr: false`). Every screen lives inside the desktop shell, so nothing is public or indexed.
- **Routes** are declared only in `packages/app/app/router.options.ts`; a file Nuxt would route fails the build. Nothing
  is auto-imported or auto-registered, and `@/` (the app's root) is the only alias.
- **Services:** `plugins/iocPlugin.ts` creates the one IoC container; every other plugin states
  `dependsOn: ['ioc-plugin']`. The daemon's address reaches the app as `runtimeConfig.public.daemonUrl`, built from
  `@poweragents/common`.
- **Components** live in `packages/ui`. Each has a story per state, run as a Vitest browser test in Chromium by
  `bun run test:stories`, with axe failing a story on any WCAG 2.2 AA violation. Tokens are in
  `packages/ui/src/styles/tokens.scss`, injected into every SCSS block of the repo's packages by `viteShared.ts`, which
  the app, Storybook and Vitest share.
- **Languages:** Polish and English (`APP_LANGUAGES` in `@poweragents/common/appLanguages.js`); every `.loc.yaml`
  key has both. The app's `LanguageStore` starts with the first of them among the system's preferred languages, English
  when neither is, and `AppLanguageContext` gives it to every translating service, `<html lang>` and reka-ui. Storybook
  switches the language from its toolbar. Text goes through `@nzyme/i18n` (`.loc.yaml` compiled by
  `bun run localise`); Poland is the first market (design D7, D32).
- **Env files:** the app's `.env` and `.env.<ENV>` are gitignored and baked into the build, so its `package.json` hashes
  them into the build's cache key (`appEnvironment`), and `scripts/nxInputs.test.ts` guards that.

## Desktop shell and daemon

- The daemon ships inside the app as a Tauri sidecar (`bundle.externalBin`). `bun nx run @poweragents/daemon:sidecar`
  builds it with `tsgo --build`, then compiles `dist/main.js` into one executable with `bun build --compile`
  (`scripts/bundleDaemonSidecar.ts`), named `binaries/poweragents-daemon-<target triple>` for the machine it runs on.
- A release build of the shell runs the app's and the sidecar's builds first, bundles both, and starts the daemon when
  the app starts (`src-tauri/src/daemon.rs`). The daemon keeps running after the app quits; when one already holds the
  port, the new one exits and the app talks to the running one.
- `bun run desktop` starts the shell in development: Tauri runs `nuxt dev` on port 4100 and the daemon from source under
  `bun --watch`, and the shell starts no sidecar.
- The window may call only Tauri's core (`capabilities/default.json`), and its CSP allows connections only to the shell
  itself and to the daemon's port.
- The daemon listens on loopback only (port 47610, `POWERAGENTS_DAEMON_PORT` overrides it). Remote clients will reach it
  through the relay, never through an open port.

## Tooling and workflow

- **Setup:** `zsh setup.sh` catches a worktree up with `main`, copies local files, checks out the pinned submodule,
  builds and generates the code map. `setup.build.sh` is the build half (install, nzyme CLI, generated tsconfigs and
  translations, `tsgo --build`, `nuxt prepare`, Playwright's Chromium), which CI runs too.
- **Checks:** `bun run typecheck`, `lint:check`, `format:check`, `tests`; `test:stories` for components, `e2e` for the
  built app. On a pull request `.github/workflows/build.yml` runs the build and the first four as `Build`, and the Rust
  side (`cargo fmt`, `clippy`, `cargo test`) as `Desktop`; `verify-submodules.yml` checks the nzyme pin as
  `Verify Submodules`. The `main` ruleset requires all three,
  takes only squash merges through a pull request with every review thread resolved, and refuses force pushes and
  deletion; auto-merge is on.
- **Build cache:** `scripts/nxInputs.test.ts` fails when a cached task stops being invalidated by its own sources, by
  the nzyme packages it uses, or by the app's env files.
- **Lint and format:** oxlint (type-aware) and oxfmt for code; ESLint for Vue rules, `package.json` and Markdown. They
  cover this repo, never `nzyme/` (`lint:nzyme` runs nzyme's own config). `lint` and `lint:check` also run
  `bun nzyme pen check` on the design file.
- **Design file:** `poweragents.pen` merges node by node through `bun nzyme pen merge`, the git merge driver
  `setup.sh` registers; `bun nzyme pen diff` shows what changed. Design rounds run the repo's pinned `pen` CLI, which
  needs `bunx pen login` once per machine and no key.
- **Ignores:** each `.gitignore` lists only what the repo produces. The root one holds what any directory can produce;
  output owned by one directory is ignored in that directory's own `.gitignore` (`packages/app`, `packages/ui`,
  `packages/e2e`, `packages/desktop/src-tauri`, `scripts`, `.claude`).
- **Git:** one task, one worktree, one branch, one squash-merged pull request with a Conventional Commits title
  (`git-workflow` skill). A commit moving the gitlink moves the nzyme pin.
- **Agents:** `CLAUDE.md`, the shared settings in `.claude/settings.json` and the skills under `.claude/skills/`: `verify`
  and `git-workflow` for the dev pipeline, and one skill per area (`code-conventions`, `ioc`, `logging`, `testing`,
  `ui`, `composables`, `forms`, `translations`, `design`) holding what is true here and inlining nzyme's practice
  document for it from `nzyme/docs/practice/`. `.claude/skills/nzyme` links nzyme's `architecture` skill at the pinned
  commit.

## Decisions

- **Non-Vue TypeScript packages, the daemon included, are compiled by `tsgo --build`, never built by Bun from source.**
  `tsgo` type-checks the whole graph through project references; Bun alone strips types without checking them.
- **The daemon ships as a Tauri sidecar, compiled from its `tsgo` build by `bun build --compile`.** One installer
  carries everything, and the person installs nothing else (design D6). The executable is compiled from code `tsgo`
  has already checked, so it adds no unchecked path.
- **The daemon is its own process, not part of the Tauri shell.** Schedules run and the agent's browser stays alive while
  the app is closed (design D5, D13, D27), and the phone and a later cloud version are clients of the same daemon.
- **Components live in a separate UI package from the start.** The phone companion (design D21) is a second client that
  will use the same components.
- **The nzyme pin moves by hand, in a pull request; no workflow bumps it.** An automated bump needs a GitHub App
  and its key kept as secrets, which is more upkeep than one repo's pin is worth. `Verify Submodules` still guards
  every pin a pull request sets.
- **Playwright is pinned in the root `package.json`.** `setup.build.sh` installs Chromium with the root's
  `bun x playwright`, so the browser matches the version the story tests and e2e run.
