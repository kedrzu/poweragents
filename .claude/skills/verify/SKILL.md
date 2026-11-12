---
name: verify
description: >-
    How a change is proven to work in poweragents — a scoped check after each step of work and the full protocol before
    a change is called done (codegen, TypeScript, lint, format, bun tests, Storybook component tests, the app build, the
    desktop shell's Rust checks, Playwright e2e). The dev pipeline (/dev:*) relies on it; reach for it whenever you need
    to check that the repo is green, before committing a finished change, or when asked to "verify", "make it green" or
    "run the checks".
---

# verify — poweragents

Fulfils the `verify` contract of the `dev` plugin (`skills/pipeline/references/contracts.md`).

All commands run from the repo root. A package script is `bun --cwd <package> <script>` — **no `run`**:
`bun --cwd <package> run <script>` prints bun's usage banner and exits 0, a silent false green.

If `nzyme/packages/cli/dist` or `packages/app/.nuxt` is missing (fresh clone or worktree), run `zsh setup.sh` first.
Nothing needs local infrastructure or secrets.

## Scoped

After each piece of work, while more remains. Covers what the change touched; green here is **not** a green codebase.

|Check|Command|When|
|-|-|-|
|Generated files|`bun run codegen`|a `.loc.yaml` or a package's dependencies changed|
|TypeScript (packages)|`bun run build`|always (incremental)|
|TypeScript (Vue packages, e2e)|`bun run typecheck`|anything under `packages/app`, `packages/ui` or `packages/e2e`|
|Lint|`bun run lint:check`|always (whole repo, fast)|
|Format|`bunx oxfmt --disable-nested-config <changed files>`; Markdown is formatted by ESLint: `bunx eslint --fix <changed .md>`|always|
|Unit / integration tests|`TZ=UTC bun test --timeout 10000 --path-ignore-patterns='**/dist/**' ./<changed package or test file>` — always with `./`: a bare `packages/x` is a name filter that scans the whole tree|a `*.test.ts` or the code it covers changed|
|Component tests|`bun --cwd packages/ui test:stories -- <changed component file>`|a component, its story or spec changed|
|E2E|`bun run e2e <spec files, relative to packages/e2e>`; one test by title: `bun run e2e -g "<title>"`|a screen or flow an e2e spec drives changed|
|Desktop (Rust)|`mkdir -p packages/app/.output/public` and `bun nx run @poweragents/daemon:sidecar` (`tauri-build` needs both to exist), then in `packages/desktop/src-tauri`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test`|anything under `packages/desktop`|
|Desktop release build|`bun --cwd packages/desktop tauri build --no-bundle`, then run `packages/desktop/src-tauri/target/release/poweragents` and `curl -s http://127.0.0.1:47610/status` → `{"status":"ok"}` from the bundled daemon; quit the app and `pkill -f poweragents-daemon` after|`tauri.conf.json`, `src-tauri/src/daemon.rs` or the sidecar script changed|

`*.test.ts` = `bun test`; `*.spec.ts` under `packages/ui` = browser component specs run by Vitest through Storybook;
`*.spec.ts` under `packages/e2e` = Playwright; `*.stories.tsx` are tests too (render + axe as errors).

## Full

Once, when all work is believed complete. Every step, in order, nothing skipped; zero errors each.

A change whose `git diff --name-only origin/main...HEAD` lists only `.md` and `.pen` files and files under `docs/` has
nothing to break but the format: `bun run lint` and `bun run format` alone are the full protocol.

|#|Step|Command|Must|
|-|-|-|-|
|1|Codegen|`bun run codegen`|regenerates tsconfigs and `*.loc.ts` cleanly; `git status` shows no unexpected diff|
|2|TypeScript|`bun run build`, then `bun x tsgo -p scripts`|zero errors|
|3|Package typecheck|`bun nx run-many -t typecheck --exclude='@nzyme/*' --skip-nx-cache`|zero errors|
|4|Lint|`bun run lint`|zero errors (applies fixes, Markdown formatting included)|
|5|Format|`bun run format`, then `bun run format:check`|applied, check clean|
|6|Tests|`bun run tests`|zero failures (includes the Nx inputs guard, `scripts/nxInputs.test.ts`)|
|7|Component tests|`bun nx run-many -t test:stories --exclude='@nzyme/*' --skip-nx-cache`|zero failures (stories + specs + a11y)|
|8|App build|`bun --cwd packages/app build`|`packages/app/.output/public` written|
|9|Desktop (Rust)|`bun nx run @poweragents/daemon:sidecar`, then in `packages/desktop/src-tauri`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test`|zero warnings, zero failures|
|10|Storybook build|`bun --cwd packages/ui build-storybook`|builds|
|11|E2E|`bun run e2e`|zero failures; it builds the app through Nx and serves `packages/app/.output/public`|

Rules:

- **Every red is yours** until proven otherwise; fix it, never skip, suppress or disable.
- **Rewind:** a fix that touches code an earlier step checked sends the run back to that step, then forward again.
- `--skip-nx-cache` in steps 3 and 7: a cached green from an earlier tree proves nothing.
- Step 6 briefly edits the app's `.env` files to prove they invalidate the build cache; never run it alongside a build.
- Changes inside `nzyme/` additionally need `bun run lint:nzyme` and nzyme's own tests (`bun run --cwd nzyme test`).

## Where the checks run

Locally, this protocol, before a change is called done. On a pull request CI runs `.github/workflows/build.yml`: the job
`Build` (`setup.build.sh`, typecheck, lint, format, tests) and the job `Desktop` (step 9), plus `Verify Submodules` on
the nzyme pin. Component tests, the builds and e2e run only here, so CI does not replace this run.
