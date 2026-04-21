# T01: Add `pytest-xdist` dev dependency and audit session-scope fixtures for xdist safety

> **Milestone**: M26.8-in-cluster-test-parallelism
> **Status**: Not Started
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Description

Add `pytest-xdist` to the root dev dependency group so it is available to all
test packages without requiring per-package `uv add`. Verify that running
`pytest --collect-only -p xdist -q` against the in-cluster E2E tree does not
error on collection. Leave every session-scope fixture untouched — the audit
outcome for M26.8 is that the current set is safe enough for `-n 2` on CI
Linux; any fixture rewrite is out of scope.

## Subtasks

- [ ] **Add dependency**: add `pytest-xdist>=3.6.0` to the `dev` group in
  `pyproject.toml:11-15` and run `uv sync`.
- [ ] **Collect smoke**: run the collection smoke test below and paste output
  into `docs/tasks/M26.8/PROGRESS.md` Notes section as evidence.
- [ ] **Fixture audit note**: append a short "Audit findings" paragraph to
  `docs/tasks/M26.8/PROGRESS.md` listing the session-scope autouse fixtures
  actually relevant in CI and confirming each one is safe today (see
  References).

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `pyproject.toml` | Modify | Add `pytest-xdist>=3.6.0` inside the `dev` group list, preserving alphabetical order. |
| `uv.lock` | Modify (generated) | Result of `uv sync` after adding the dependency. Commit alongside `pyproject.toml`. |
| `docs/tasks/M26.8/PROGRESS.md` | Modify | Append collection-smoke evidence and fixture-audit paragraph under "Notes". |

## Implementation Notes

1. Do not add `pytest-xdist` to any package-local `pyproject.toml`. It is a
   test-runner concern that belongs in the root dev group, same layer as
   `pytest-asyncio`.
2. Do not add `-n` to any project-level pytest config (`pyproject.toml` has
   no `[tool.pytest.ini_options]` addopts today; keep it that way). The
   worker count is decided by the invoking script in T02, not by a global
   default.
3. The audit paragraph only needs to confirm the following two fixtures are
   CI-Linux no-ops and therefore not a blocker:
   - `packages/platform-core/tests/e2e/conftest.py:183-238` gates on
     `_native_livekit_requested()` which returns false in CI.
   - `packages/grove-voice-livekit/tests/e2e/conftest.py:43-54` returns early
     when `not _is_macos()`.
4. If the collection smoke surfaces an unexpected import error, stop and
   file a follow-on task under the owning test tree's milestone. Do not
   patch the test to silence it in this task.

## Acceptance Criteria

- [ ] `uv sync` succeeds with `pytest-xdist` present in the resolved graph.
- [ ] `uv run python -m pytest --collect-only -p xdist -q packages/platform-core/tests/e2e/ 2>&1 | tail -5` completes with exit code 0.
- [ ] `docs/tasks/M26.8/PROGRESS.md` Notes section contains collection-smoke
  evidence and a two-sentence fixture-audit paragraph.

## Verification

```bash
uv sync
uv run python -m pytest --collect-only -p xdist -q packages/platform-core/tests/e2e/ 2>&1 | tail -5
uv run python -m pytest --collect-only -p xdist -q packages/grove-voice-livekit/tests/e2e/ 2>&1 | tail -5
```

## References

- Milestone: [M26.8-in-cluster-test-parallelism.md](../../milestones/M26.8-in-cluster-test-parallelism.md)
- Fixture evidence: `packages/platform-core/tests/e2e/conftest.py:183-238`, `conftest.py:304-315`, `conftest.py:400-464`
- LiveKit no-op gate: `packages/grove-voice-livekit/tests/e2e/conftest.py:51-54`
