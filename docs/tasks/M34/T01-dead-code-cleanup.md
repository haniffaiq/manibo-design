# T01: Dead code cleanup + `.gitignore`/`.dockerignore`

> **Milestone**: M34-wiki-as-source-of-truth
> **Status**: Not Started
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

1. **One Task = One Commit** — everything in this file goes into a single commit. Commit message: `feat: M34 T01 - delete dead code and gitignore artifacts`.
2. **One Milestone = One PR** — do not open a PR just for this task.
3. **Follow `AGENTS.md`** — tests/architecture/ boundary tests must still pass after deletions.
4. **Verify dependencies:** None. This is the first task.

---

## Description

Delete dead code identified by the 2026-04-09 source-code audit session. These paths were confirmed HIGH-confidence dead: they either have no source inside them, have no callers, or were superseded by a later monorepo refactor and never cleaned up. Also add `.artifacts/` to both `.gitignore` and `.dockerignore` — it currently holds a CI release-failure JSON that should not be tracked or shipped in container builds.

This task is the foundation for the rest of M34 — every subsequent task assumes these paths do not exist.

## Subtasks

- [ ] **Delete legacy pre-monorepo-refactor Grove paths**
  - `src/grove/` (superseded by `packages/grove/` on 2026-02-16 monorepo refactor)
  - `grove-voice-livekit/` at repo root (same refactor; has its own `.venv/` inside, empty `src/grove_voice_livekit/`)

- [ ] **Delete empty package stub**
  - `packages/platform-sdk/` (only contains `alembic/`, zero Python modules, zero consumers)

- [ ] **Delete empty examples**
  - `examples/logistics_driver/`
  - `examples/doctor_appointment/`
  - `examples/e2e_comprehensive/`
  - All three contain only `__pycache__/`, no source files, last touched 2026-02-16

- [ ] **Delete empty root-level test placeholder dirs**
  - `tests/unit/`
  - `tests/integration/`
  - `tests/e2e/`
  - `tests/parity/`
  - All four contain only `__pycache__/`, no source. Per-package test trees are authoritative (`packages/*/tests/`, `apps/*/tests/`, `solutions/*/tests/`). Root `tests/architecture/` and `tests/evals/` are kept — those have real content.

- [ ] **Delete stub solution**
  - `solutions/outbound_campaigns/` — user confirmed this will be rebuilt from scratch later. Current state: `transcript=""` hardcoded in extract activity, plugin exports no tools, 2.5K LOC of tests exercising a skeleton.
  - Verify nothing imports `outbound_campaigns` from other solutions, platform-core, apps, or tools: `rg "outbound_campaigns" packages/ solutions/ apps/ tools/ tests/`. Expected: zero hits after deletion.
  - Remove any `outbound_campaigns` entry from `packages/platform-core/src/platform_core/solutions/` discovery paths if present.
  - Remove from `pyproject.toml` workspace members if present.

- [ ] **Delete wiki entity redirect stubs**
  - `wiki/entities/m8-voice-control-plane.md`
  - `wiki/entities/m32-contact-identity.md`
  - `wiki/entities/m33-autonomous-runtime.md`
  - All three are 750-byte redirect stubs per the 2026-04-09 wiki audit. Replaced by discovery via `wiki/index.md`.

- [ ] **Add `.artifacts/` to `.gitignore`**
  - Append `.artifacts/` to `.gitignore` (match the pattern already used for `.tmp/`).
  - Do NOT delete the directory from disk; just stop tracking it.
  - Run `git rm -r --cached .artifacts/` to untrack any already-tracked files.

- [ ] **Add `.artifacts/` to `.dockerignore`**
  - Append `.artifacts/` to `.dockerignore` so Docker builds don't include it in image contexts.

- [ ] **Verify pyproject.toml workspace members still resolve**
  - Run `uv sync` after deletions. Expected: clean resolve. If it complains about `packages/platform-sdk` or `solutions/outbound_campaigns`, remove those entries from `pyproject.toml` `[tool.uv.workspace]` members list.

- [ ] **Verify architecture boundary tests still pass**
  - Run `uv run pytest tests/architecture/ -q`. Expected: all tests pass. If any test reference the deleted paths, update the test (that's legitimate cleanup of the test, not a regression).

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/grove/` | Delete (recursive) | Pre-refactor Grove source, superseded 2026-02-16 |
| `grove-voice-livekit/` (root) | Delete (recursive) | Pre-refactor voice bridge, superseded 2026-02-16 |
| `packages/platform-sdk/` | Delete (recursive) | Empty stub package |
| `examples/logistics_driver/` | Delete (recursive) | Empty |
| `examples/doctor_appointment/` | Delete (recursive) | Empty |
| `examples/e2e_comprehensive/` | Delete (recursive) | Empty |
| `tests/unit/` | Delete (recursive) | Empty placeholder |
| `tests/integration/` | Delete (recursive) | Empty placeholder |
| `tests/e2e/` | Delete (recursive) | Empty placeholder |
| `tests/parity/` | Delete (recursive) | Empty placeholder |
| `solutions/outbound_campaigns/` | Delete (recursive) | Stub — rebuild later from scratch |
| `wiki/entities/m8-voice-control-plane.md` | Delete | Redirect stub |
| `wiki/entities/m32-contact-identity.md` | Delete | Redirect stub |
| `wiki/entities/m33-autonomous-runtime.md` | Delete | Redirect stub |
| `.gitignore` | Modify | Append `.artifacts/` |
| `.dockerignore` | Modify | Append `.artifacts/` |
| `pyproject.toml` | Modify (if needed) | Remove deleted workspace members |

## Implementation Notes

- Use `git rm -r <path>` for tracked deletions (not `rm -rf`) so git records the deletion. Exception: `.artifacts/` files use `git rm -r --cached` to untrack without deleting from disk.
- Do not edit `.gitignore` or `.dockerignore` by rewriting them — append the new line only.
- If `uv sync` fails because of a removed workspace member, fix `pyproject.toml` before retrying. This is part of the same commit.
- **DO NOT delete `docs/` files in this task.** `docs/` absorption happens in T15 after the wiki is comprehensive. This task is strictly dead source code + wiki stubs + gitignore.

## Acceptance Criteria

- [ ] `test ! -d src/grove` passes
- [ ] `test ! -d grove-voice-livekit` passes (root, not `packages/grove-voice-livekit`)
- [ ] `test ! -d packages/platform-sdk` passes
- [ ] `test ! -d examples/logistics_driver` passes
- [ ] `test ! -d examples/doctor_appointment` passes
- [ ] `test ! -d examples/e2e_comprehensive` passes
- [ ] `test ! -d tests/unit` passes
- [ ] `test ! -d tests/integration` passes
- [ ] `test ! -d tests/e2e` passes
- [ ] `test ! -d tests/parity` passes
- [ ] `test ! -d solutions/outbound_campaigns` passes
- [ ] `test ! -f wiki/entities/m8-voice-control-plane.md` passes
- [ ] `test ! -f wiki/entities/m32-contact-identity.md` passes
- [ ] `test ! -f wiki/entities/m33-autonomous-runtime.md` passes
- [ ] `grep -q '^\.artifacts/' .gitignore` passes
- [ ] `grep -q '^\.artifacts/' .dockerignore` passes
- [ ] `rg "outbound_campaigns" packages/ solutions/ apps/ tools/ tests/` returns zero hits
- [ ] `uv sync` completes without errors
- [ ] `uv run pytest tests/architecture/ -q` passes
- [ ] `git status` shows only expected deletions + `.gitignore` + `.dockerignore` modifications

## Verification

```bash
# Dead paths gone
for path in src/grove grove-voice-livekit packages/platform-sdk \
            examples/logistics_driver examples/doctor_appointment examples/e2e_comprehensive \
            tests/unit tests/integration tests/e2e tests/parity \
            solutions/outbound_campaigns; do
  test ! -e "$path" && echo "OK: $path deleted" || echo "FAIL: $path still exists"
done

# Wiki stubs gone
for path in wiki/entities/m8-voice-control-plane.md \
            wiki/entities/m32-contact-identity.md \
            wiki/entities/m33-autonomous-runtime.md; do
  test ! -e "$path" && echo "OK: $path deleted" || echo "FAIL: $path still exists"
done

# Ignore files updated
grep -q '^\.artifacts/' .gitignore && echo "OK: .gitignore" || echo "FAIL: .gitignore"
grep -q '^\.artifacts/' .dockerignore && echo "OK: .dockerignore" || echo "FAIL: .dockerignore"

# No leftover references
! rg "outbound_campaigns" packages/ solutions/ apps/ tools/ tests/ && echo "OK: no outbound_campaigns refs"

# Python workspace still resolves
uv sync

# Architecture tests pass
uv run pytest tests/architecture/ -q
```

## References

- Milestone: [M34-wiki-as-source-of-truth.md](../../milestones/M34-wiki-as-source-of-truth.md)
- Related: User approval in 2026-04-09 session for all listed deletions
- Source audit evidence: Agent 1 (grove legacy), Agent 6 (empty examples + test dirs), Agent 3 (outbound_campaigns stub), Agent 7 (wiki redirect stubs)
