Status: Completed
Owner: Codex
Updated: 2026-03-15

# V2 Runtime Smoke Port Stability

## Objective
- Remove the worktree env regeneration bug that kept changing compose host ports across reruns and broke runtime smoke consumers that rely on the generated env file as the port source of truth.

## Outcome
- Fixed `tools/scripts/compose-worktree.sh` so `regen-env` reuses existing valid/free ports instead of pre-reserving them and forcing a reshuffle on every run.
- Added an architecture regression test that runs `regen-env` twice in a temporary git repo and proves the generated host-port map stays stable.

## Verification
- `uv run pytest tests/architecture/test_local_observability_wiring.py -q --tb=short`
- `tools/scripts/compose-worktree.sh down`
- `tools/scripts/compose-worktree.sh regen-env`
- `tools/scripts/compose-worktree.sh up-e2e`
