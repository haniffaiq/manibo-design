Status: Completed

# Issue 561: Regression E2E Tier 0 Fix

## Checklist Rows

- `docs/requirements/checklist.md` row 53: operator-grade observability / deterministic traceability harness in the `k3d` parity lane.
- `docs/requirements/checklist.md` row 378: deployment release rollout management stays regression-covered and runnable in CI.

## Problem

- Regression Tier 0 is failing in the `k3d` lane that runs `tools/scripts/k3d-test-e2e.sh packages/platform-core/tests/e2e apps/api/tests/e2e/test_release_rollout_compose_e2e.py`.
- The same Tier 0 job also expects `TRACEABILITY_HARNESS_MODE=k3d tools/scripts/run_traceability_harness.sh` to stay green against the reused cluster.
- The release-rollout helper already tolerates transient failures on the initial `POST`, but it still treated rollout-state polling `GET` timeouts / `5xx` responses as fatal even though those are the same ingress-class failures in `k3d`.

## Plan

1. Harden the release-rollout polling helper so transient `GET` failures keep polling instead of aborting the suite.
2. Add regression coverage that exercises the transient-poll path after an initial rollout-start failure.
3. Re-run the targeted helper and architecture checks that cover the Tier 0 shell path.

## Verification

- `UV_CACHE_DIR=/tmp/uv-cache uv run pytest apps/api/tests/unit/test_release_rollout_e2e_helpers.py -q --tb=short`
- `UV_CACHE_DIR=/tmp/uv-cache uv run pytest tests/architecture/test_local_pre_pr_ci_harness.py apps/api/tests/unit/test_release_rollout_e2e_helpers.py -q --tb=short`
- `UV_CACHE_DIR=/tmp/uv-cache uv run ruff check apps/api/tests/e2e/test_release_rollout_compose_e2e.py apps/api/tests/unit/test_release_rollout_e2e_helpers.py`
- `UV_CACHE_DIR=/tmp/uv-cache uv run ruff format apps/api/tests/e2e/test_release_rollout_compose_e2e.py apps/api/tests/unit/test_release_rollout_e2e_helpers.py --check`
- `UV_CACHE_DIR=/tmp/uv-cache uv run pyright apps/api/tests/unit/test_release_rollout_e2e_helpers.py`
