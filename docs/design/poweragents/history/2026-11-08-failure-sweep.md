# Failure sweep, 2026-11-08

A blind agent got the model (profiles, projects, plugins, manifest, reach confirmations, scheduled
sessions, browser tunnel, agent orchestration, first run) without rationale and generated 16 cases.
Classification by the design agent:

**Already handled.** Half-installed plugin after a network drop — applying the manifest is idempotent,
re-applying converges ([D25](../DECISIONS.md#d25)). Conflict in an agent-authored plugin — blocks with
a reason ([D26](../DECISIONS.md#d26)). Empty Memory — agent behaviour; onboarding can be rerun.

**Implementation detail, nothing to decide.** A late run should know it is late; runs failing for
environmental reasons (no network on wake) retry instead of using up the single missed run; revoking
a connection mid-run stops the run and it reports what was done; a yanked package fails a rebuild and
schedules wait until it is resolved; schedules use local wall-clock time across DST and travel;
confirming the same proposal twice applies it once.

**Credible failures, put to the owner:**
1. A steering agent answers a confirmation meant for the person (via the daemon MCP).
2. A plugin *update* widens reach (new outward tools, new scopes) without the confirmation an install
   would need.
3. The next run of a schedule fires while the previous run's session still waits for the person.
4. Parallel agents and the person share one browser per profile: commands landing on the wrong tab.
5. A project referenced by a plugin is renamed, moved in Finder or deleted.
6. Pattern across several cases: project and Memory files have no history — no undo of a bad agent
   edit, no guard against two sessions writing the same file, a corrected Memory fact rewritten by a
   parallel run, plugin upgrades misreading the person's files.

**Owner's dispositions (2026-11-08).** 1 fixed: confirmations only from the UI (D28). 2 accepted risk:
plugins are made carefully (D28). 3 fixed: no new run while the previous waits (D29). 4 fixed: agents
act in their own hidden windows (D27). 5 fixed: stable project identifiers, warning on delete (D20).
6 open, owner considering a local git repository (D9).
