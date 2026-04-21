Status: Completed

# Issue 517: Tier 0 k3d Regression Fix

## Checklist Row

- `docs/requirements/checklist.md` operator-grade observability / deterministic traceability harness in the `k3d` parity lane.

## Problem

- Tier 0 runs the `k3d` E2E suite and the `k3d` traceability harness back-to-back against the same prebuilt-image cluster.
- `tools/scripts/k3d-test-e2e.sh` still defaulted to restoring dev-mode auth and worker env on cleanup, which adds extra rollouts between those two passes.
- That restore work is already treated as waste in the local pre-PR harness and is a plausible regression point for the Tier 0 job.

## Plan

1. Make `k3d-test-e2e.sh` preserve E2E auth/worker env by default when it is reusing prebuilt k3d images (`K3D_E2E_USE_LOCAL_IMAGES=0`).
2. Lock the Tier 0 workflow to the same preserve behavior explicitly.
3. Add architecture coverage for both the script default and the regression workflow env.

## Verification

- `UV_CACHE_DIR=/tmp/uv-cache uv run pytest tests/architecture/test_local_pre_pr_ci_harness.py tests/architecture/test_regression_e2e_workflow.py apps/api/tests/unit/test_release_rollout_e2e_helpers.py -q --tb=short`
- `UV_CACHE_DIR=/tmp/uv-cache uv run ruff check tests/architecture/test_local_pre_pr_ci_harness.py tests/architecture/test_regression_e2e_workflow.py`
