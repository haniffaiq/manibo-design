# Grove Hygiene — File-Size & Type-Error Cleanup — Session Prompt

> **Scope:** tackle pre-existing hygiene issues in `packages/grove/src/` that are blocking the pre-commit hook on unrelated PRs. This is NOT part of M26.5 / M26.6 or any product milestone — it is a focused cleanup pass that should land in its own tight PR.

## Why this exists

On 2026-04-05, while finishing PR #795 (M26.5 test infrastructure cleanup), the Claude pre-commit hook (`.claude/hooks/pre-commit-check.sh`) blocked a rename-only commit because two pre-existing issues in Grove had been merged to `main`:

1. **`packages/grove/src/grove/bootstrap.py:159`** — pyright strict `reportUnknownArgumentType` error introduced by `5d1a116e` (`refactor: deprecate med_scheduler in Grove (#776)`). Narrowing `Any` with `isinstance(result, list)` produces `list[Unknown]`, which strict mode rejects.
2. **`packages/grove/src/grove/temporal/activities.py`** — file size **523 lines**, above the `test_file_size` allowlist ceiling of **510** (since commit `6bbf853c` `fix(grove): cap conversation history fetches` added 31 lines).

PR #795 applied minimum unblock fixes:
- bootstrap.py: added `cast("list[Any]", result)` on line 159
- test_file_size.py: bumped `temporal/activities.py` ceiling from 510 → 525 with a comment pointing here

> **2026-04-06 update:** the activities.py side of this workstream has been **partially obsoleted by main** — the M33 merge (#798) decomposed `temporal/activities.py` from 523 → 486 lines and extracted `temporal/activity_types.py`. PR #795 dropped the ceiling back to 510 to match. The remaining work in this workstream is the `bootstrap.py` typing cleanup plus the broader "files near ceiling" follow-ups in Workstream 3. The activities.py decomposition section below is **kept as a reference template** for the same pattern on the other near-ceiling files (`config/schema.py`, `temporal/voice_activities.py`, `temporal/voice_call_workflow.py`, voice package files).

Those minimum fixes keep the hook green, but **do not solve the underlying tech debt** for the remaining files. This workstream does.

## Goal

Bring `packages/grove/src/` back to a state where:

1. `uv run pyright packages/grove/src/` is clean under strict mode without suppressions or casts where a proper type would do.
2. No Grove source file is within 50 lines of the `test_file_size` allowlist ceiling for longer than one commit.
3. The remaining near-ceiling files in Workstream 3 are decomposed into topical modules and their allowlist entries are removed (or lowered substantially).

## Hard constraints

1. **Do NOT change runtime behavior.** This is a pure refactor — tests must pass identically before and after each commit.
2. **Do NOT touch Grove's layering rules.** Everything stays inside `packages/grove/src/grove/temporal/` (or an adjacent sibling). No solutions / platform imports allowed.
3. **No `--no-verify` commits.** The Claude pre-commit hook must pass.
4. **Preserve public surface.** External callers import `from grove.temporal.activities import ...` — any new modules must re-export the same names from `grove.temporal.activities` or be migrated atomically with every caller.
5. **One logical split per commit.** If you extract three activity groups, that is three commits, not one.

## Pre-flight (mandatory — first 10 minutes)

```bash
git branch --show-current             # must be main or a fresh branch
git status --short                    # must be clean
git worktree add ../manibo-grove-hygiene -b hygiene/grove-file-limits
cd ../manibo-grove-hygiene

# Confirm the issues still exist
uv run pyright packages/grove/src/grove/bootstrap.py
wc -l packages/grove/src/grove/temporal/activities.py
uv run pytest packages/grove/tests/unit/architecture/test_file_size.py -v
```

If the `bootstrap.py` cast has already been replaced with a proper typed plugin factory upstream, reduce scope to the activities.py split.

## Workstream 1 — bootstrap.py type hygiene

### T01 — Replace `cast("list[Any]", result)` with a typed plugin factory contract

The current code (after the M26.5 unblock fix) is:

```python
result: Any = factory(**(plugin_config.config or {}))
if isinstance(result, list):
    resolved.extend(cast("list[Any]", result))
else:
    resolved.append(result)
```

The `cast` is a lie — we're asserting `list[Any]` without proof. The root cause is that `factory` is typed as a runtime lookup (`getattr(module, func_name)`) and has no contract.

Options:

- **A (preferred):** Introduce a `PluginFactory = Callable[..., GrovePlugin | list[GrovePlugin]]` type and a `_lookup_factory(module_path, func_name) -> PluginFactory` helper that validates the signature. Use `isinstance(result, list)` to narrow without cast.
- **B:** Move `GrovePlugin` out of `TYPE_CHECKING` so the cast can use the real class.
- **C:** Introduce a `Protocol` for plugin factories in `grove/core/plugin.py` and type `factory` against it.

Pick one, implement it, remove the `cast` call, make `uv run pyright packages/grove/src/` pass without the cast. Commit.

## Workstream 2 — temporal/activities.py decomposition

### T02 — Audit activities.py and propose a split

Output: `docs/tasks/hygiene-grove-file-limits/T02-activities-split-plan.md` with:

| Activity | Lines | Proposed new module | Reason |
|----------|-------|---------------------|--------|
| ... | ... | ... | ... |

Group activities by domain: conversation fetch, checkpoint load/save, message fan-out, action dispatch, etc. Each group becomes a file under `packages/grove/src/grove/temporal/activities/` (package), with `activities/__init__.py` re-exporting the old public names.

### T03 — Execute the split

Use `git mv` + careful copy/paste. For each group:

1. Create new module file under `packages/grove/src/grove/temporal/activities/<group>.py`.
2. Move the functions and their private helpers.
3. Update `grove/temporal/activities/__init__.py` to re-export them so no external caller changes.
4. Run the full Grove test suite: `uv run pytest packages/grove/tests/ -x --tb=short`.
5. Commit per group.

### T04 — Remove the allowlist entry

Once `activities/` is a package of topical modules, remove the `"temporal/activities.py": 525` line from `packages/grove/tests/unit/architecture/test_file_size.py`. Verify the test still passes on its own.

## Workstream 3 — Other files approaching the ceiling

The allowlist currently contains several files at or near their ceiling:

| File | Ceiling | Observation |
|------|---------|-------------|
| `config/schema.py` | 557 | "still needs decomposition" |
| `temporal/voice_activities.py` | 564 | "still needs splitting" |
| `temporal/voice_call_workflow.py` | 626 | "still needs splitting" |
| `grove_voice_agent.py` (voice pkg) | 541 | "still needs splitting" |
| `runtime_bridge.py` (voice pkg) | 625 | "still needs splitting" |

These are **out of scope for this workstream** unless the human explicitly extends scope. Note them in the final PR description so they can be tracked as follow-ups.

## Verification

```bash
# Pyright — the whole Grove source tree
uv run pyright packages/grove/src/

# Architecture tests, specifically file size and import boundaries
uv run pytest packages/grove/tests/unit/architecture/test_file_size.py -v
uv run pytest packages/grove/tests/unit/architecture/test_import_boundaries.py -v

# Full Grove test suite — nothing should change behaviorally
uv run pytest packages/grove/tests/ -q

# Lint + format
uv run ruff check packages/grove/src/ packages/grove/tests/
uv run ruff format --check packages/grove/src/ packages/grove/tests/

# Local CI harness
bash tools/scripts/review/pre-pr-ci.sh
```

## Task order

```
T01 (bootstrap.py type) ────────────────────────┐
                                                 ▼
                                       T02 (activities split plan)
                                                 │
                                                 ▼
                                       T03 (execute split — one commit per group)
                                                 │
                                                 ▼
                                       T04 (remove allowlist entry)
                                                 │
                                                 ▼
                                       Verify + open PR
```

**One logical change = one commit.**

## Critical warnings

1. **Grove is Layer 1 — product-agnostic.** Any refactor here must not introduce imports from `solutions/` or `packages/platform-core/`. Check `packages/grove/tests/unit/architecture/test_import_boundaries.py` — it enforces this mechanically.
2. **Temporal workflows are replay-safe.** Do not inline any non-deterministic work when moving activity code. The activity/workflow boundary must not be crossed.
3. **`activities.py` is imported by workflows.** Moving it to a package means `from grove.temporal import activities` still works, but `from grove.temporal.activities import foo` must keep working too. Re-export everything.
4. **The allowlist is a regression signal, not a permission slip.** If the split can't fit under ceiling, escalate to the user before raising the ceiling again.

## Out of scope

- Changing Temporal workflow topology
- Replacing the plugin bootstrap protocol entirely (just type it correctly)
- Refactoring the voice package (`packages/grove-voice-livekit/`) — separate workstream
- Anything in `solutions/*` or `apps/*`
- Any product milestone work (M23.x, M26.x, M28, M32)
