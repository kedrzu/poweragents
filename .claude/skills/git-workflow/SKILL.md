---
name: git-workflow
description: >-
    How a change moves in poweragents — one task, one Paseo worktree, one branch, one PR; kept up to
    date with main by merging, squash-merged on the owner's word; Conventional Commits; GitHub Issues as
    the tracker, stacked PRs through GitHub's native stacks — all through git and `gh`. The dev pipeline
    (/dev:*) relies on it; reach for it whenever you open a branch, commit, push, catch up with main,
    resolve a merge conflict, open or describe a PR, comment on an issue, build a PR stack or merge.
---

# git-workflow — poweragents

Fulfils the `git-workflow` contract of the `dev` plugin (`skills/pipeline/references/contracts.md`).

Several tasks may run at once, each in its own Paseo worktree on its own branch with its own PR.

Facts this rests on (checked 2026-11-08):

- Remote `origin` = `https://github.com/kedrzu/poweragents.git` (private), main line `main`; `gh` is
  logged in as `kedrzu`.
- Repository settings: squash merge only (merge commits and rebase merges are off), the squash commit
  takes the PR title and body, and a PR's branch is deleted on merge.
- The repository is private on GitHub's free plan, so GitHub refuses rulesets and branch protection:
  nothing on the server stops a push to `main`. Agents never push to `main` anyway: `.claude/git.json`
  lists it in `protectedBranches`, and the `git` plugin's hook blocks such a push.
- Tracker: GitHub Issues in the same repository. A task may have no issue.
- Commit messages, PR titles, PR descriptions, issues and issue comments are in English. Polish is only
  for the conversation with the owner.
- Branch names: `<type>/<slug>`, with an issue `<type>/<N>-<slug>` (`feat/12-session-list`).
- `nzyme` is a git submodule (`https://github.com/kedrzu/nzyme.git`, no `branch =`); the gitlink is the
  pin.

## Titles

Conventional Commits: `<type>[(scope)][!]: <description>`, a lowercase imperative description, in
English: `feat: list agent sessions in the sidebar`, `fix: keep the chat scrolled to the last message`.

The **PR title** is what counts: the squash makes it the commit on `main`. Commits on a branch use the
same form, but they vanish in the squash. Update the title when the PR's scope changes. No CI checks the
title yet, so get it right by hand.

|Type|Use for|
|-|-|
|`feat`|something new a user can do or see|
|`fix`|a user-visible defect|
|`perf`|something faster for the user|
|`refactor`, `docs`, `test`, `build`, `ci`, `chore`|everything else|

- A scope is optional and names the package or area the change is confined to; leave it out when the
  change spans several.
- `!` after the type or scope (`feat!:`) marks a breaking change.
- A revert takes the type of what it does for users (`fix: …` for a revert that removes a defect).

## Start

Paseo cuts the worktree's branch from `origin/main`, and its setup (`paseo.json` → `setup.sh`) has
already merged `origin/main` into it, copied the local files from the main checkout, checked out the
pinned nzyme and built the workspace.

1. As soon as the task is known, rename the generated branch (`somber-rabbit`) before its first push:
   `git branch -m <type>/<N>-<slug>`. Find or create the issue first, when the task has one:
   ```bash
   gh issue view <N>
   gh issue create --title "<title>" --body "<description>"   # prints the URL with the number
   ```
2. Rename the Paseo workspace too: `mcp__paseo__list_workspaces` (match `cwd` with the working
   directory) shows its title; `mcp__paseo__rename_workspace` without `workspaceId` renames the current
   one. A few Polish words the owner recognises the task by („Lista sesji”). Rename a generated name
   (`somber-rabbit`, `null`, `poweragents`); leave a meaningful one. No Paseo tools → skip.
3. No draft PR at start: the PR opens at the first push (Publish).

Not in a fresh worktree: `git fetch origin main` and
`git switch -c <type>/<N>-<slug> origin/main --no-track` (otherwise the branch tracks `origin/main`
until its first push).

- In the main checkout `~/Dev/poweragents`, other sessions may share the directory, so ask once before
  switching branches there.
- In the same worktree, when the owner asks for a new PR there after the last one merged: once on the
  new branch, `git branch -D <old branch>`. The squash makes it look unmerged, so `-d` refuses.

## Sync

Other worktrees land on `main` while you work, and the later you notice, the bigger the conflict. At
least **before every push and before Land**:

```bash
git fetch origin main
git log --oneline HEAD..origin/main     # anything listed → merge
git merge --no-edit origin/main
```

Merge, never rebase or force-push: review comments keep their anchors, and the merge commits vanish in
the squash. In a stack only the bottom node merges `main` (Stack).

After a merge that moved the `nzyme` gitlink, `bun.lock` or a `package.json`, rerun `zsh setup.sh`.

A conflict is yours to resolve (the `git` plugin's `fix-conflicts` skill). Read what each side changed
and why (`git log` and `git diff` from `git merge-base HEAD origin/main` to each side), then write what
one author doing both changes would have written — never keep one side blindly. Generated files are
regenerated, not hand-merged: `bun.lock` with `bun install`, `*.loc.ts` and tsconfigs with
`bun run localise` and `bun run monorepo`. Bring it to the owner only when the two sides made
contradictory product or design decisions. Then the full `verify`, and commit the merge.

## Checkpoint

Commit everything that belongs to the change and push:

```bash
git add -A
git status --short          # nothing unrelated (.env, screenshots) staged
git commit -F - <<'EOF'
<type>[(scope)]: <imperative summary>

<why, when the subject does not say it>

<attribution trailer the session gives, if any>
EOF
git push -u origin HEAD     # Paseo creates branches without upstream; later just `git push`
```

**Confirm it landed:** `git status --porcelain` prints nothing and `git rev-parse HEAD` equals
`git rev-parse @{u}`.

- **Only a given set of files:** `git restore --staged :/` (empty the index), then
  `git add -- <file1> <file2> …`, `git diff --cached --name-only` must list exactly that group,
  `git commit`. Repeat per group.
- **Push what is already committed:** `git push` (no commit), then confirm as above.
- **Push rejected** (the remote branch moved): `git pull --no-rebase`, then push again. Never `--force`.
- **Submodule (`nzyme`) moved:** the nzyme commit must be on `kedrzu/nzyme` before the poweragents
  commit that pins it is pushed — push the nzyme branch first (`git -C nzyme push -u origin HEAD`) and
  open its PR there (its own conventions: `nzyme/.claude/skills/git-workflow`). A poweragents PR may not
  land while its pin is reachable only from an nzyme feature branch: it must be on nzyme `main`
  (`nzyme/docs/consumers.md`).

## Publish

PRs open ready for review, not as drafts, at the first push of the branch. Publish means the PR exists
and its title and description are current. The pipeline supplies the texts.

- **No PR for the branch** (`gh pr view` fails):
  ```bash
  gh pr create --base main --title "<type>[(scope)]: <description>" --body-file - <<'EOF'
  <what changed and why>

  Closes #<N>

  <attribution line the session gives, if any>
  EOF
  ```
  `Closes #<N>` only when the branch has an issue; keep that line whenever the body is rewritten. The
  body becomes the squash commit's message. GitHub refuses a PR with no diff from `main`. When the owner
  wants it open before there is anything to commit, one `git commit --allow-empty` gives it a diff; the
  commit vanishes in the squash.
- **PR exists:** read the body with `gh pr view --json body --jq .body`, write the new one with
  `gh pr edit --body-file - <<'EOF' … EOF`; `gh pr edit --title "…"` when the scope changed.
- **A draft exists anyway** (opened by hand): `gh pr ready`.
- **Issue:** the number in the branch name (`<type>/<N>-<slug>`) and in `Closes #<N>`;
  `gh issue comment <N> --body-file <file>` posts the summary. No issue → no comment, say so in the
  hand-off.
- End with the PR URL: `gh pr view --json url,isDraft --jq .url`.

## Stack

GitHub's native stacked pull requests, driven through `gh api` (no `gh` subcommand). One change, several
PRs, each based on the one below; every node lands as its own squash commit titled by its PR. Node 1 is
the task branch; node `k` is `<branch>-<k>` (`feat/30-session-list-2`).

- **Read the chain** (stack number, then nodes bottom to top):
  ```bash
  gh api "repos/kedrzu/poweragents/stacks?pull_request=<any node>" \
    --jq 'if length == 0 then "not stacked" else .[0] | .number, (.pull_requests[] | "\(.number) \(.head.ref) \(.state)") end'
  ```
- **Add a node** on top of node `k`, which must be committed and pushed:
  ```bash
  git switch -c <branch>-<k+1>
  # commit the node's changes (Checkpoint), then:
  git push -u origin HEAD
  gh pr create --base <branch of node k> --title "…" --body-file - <<'EOF'
  Part <k+1> of <n>; previous: #<PR of node k>. Closes #<N> only in the last part.
  EOF
  # the first extra node creates the stack, bottom first; later ones append:
  echo '{"pull_requests":[<pr 1>,<pr 2>]}' | gh api -X POST repos/kedrzu/poweragents/stacks --input -
  echo '{"pull_requests":[<new pr>]}' | gh api -X POST repos/kedrzu/poweragents/stacks/<stack>/add --input -
  ```
- **Check out the tip / node `k`:** `git switch <branch of that node> && git pull --no-rebase`. A branch
  another worktree holds cannot be switched to here: work on it in that worktree.
- **Propagate an edit to a lower node** without force-pushing: commit and push it on node `k`, then for
  each node above, in order: `git switch <node k+1> && git merge --no-edit <node k> && git push`. A
  conflict stops the walk on that node: resolve it there, commit, push, carry on upward.
- **Catching up with `main`:** Sync on the **bottom** node only, then propagate upward. Never merge
  `main` into a higher node.
- **GitHub rewrites upper branches itself** after a partial merge or its „Rebase stack” button. Keep
  every node pushed, so after `git fetch` a rewritten node is taken from the remote:
  `git switch -C <node> origin/<node>`.
- **Must stay in the bottom node:** a moved `nzyme` gitlink, `package.json` / `bun.lock` changes that
  later nodes depend on.
- **Landing a stack:** the whole chain at once — Land. Never merge a mid-stack PR in the GitHub UI.

## Land

Only on the owner's word („mergujemy”, „merge it”) — it is irreversible and lands on `main`.

1. Sync, the full `verify`, push; the PR must be out of draft.
2. No required checks and no server-side rules (Facts), so nothing on GitHub stops a bad merge: before
   merging, list unresolved review threads and act on each one or bring it to the owner — never resolve
   one just to clear the way:
   ```bash
   gh api graphql -f query='{repository(owner:"kedrzu",name:"poweragents"){pullRequest(number:<PR>){reviewThreads(first:100){nodes{isResolved path line comments(first:1){nodes{body}}}}}}}' \
     --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved | not)'
   ```
3. Merge:
   - **One PR:** `gh pr merge <PR> --squash --match-head-commit "$(git rev-parse HEAD)"` — the PR title
     becomes the commit on `main`; the branch is deleted on merge.
   - **A stack:** `gh pr merge` cannot merge a stacked PR. Merge the **top** PR asynchronously; GitHub
     lands it and every node below, one squash commit each. The method must be explicit (the API
     defaults to a merge commit):
     ```bash
     uuid=$(echo '{"merge_method":"squash"}' \
       | gh api -X PUT repos/kedrzu/poweragents/pulls/<top PR>/merge-async --input - --jq .uuid)
     gh api repos/kedrzu/poweragents/pulls/<top PR>/merge-async/$uuid --jq .status   # poll until not pending
     ```
4. `gh pr view <PR> --json state,mergeCommit` confirms `MERGED`. A merged PR with `Closes #<N>` closes
   its issue.
