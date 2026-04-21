Status: Completed

# Issue 502: Release Rollout k3d Tier 0 Fix

## Checklist Row

- `docs/requirements/checklist.md` row 379: deployment release rollout management stays regression-covered and runnable in CI.

## Problem

- Tier 0 `k3d` regression is failing in the release rollout E2E lane that runs `apps/api/tests/e2e/test_release_rollout_compose_e2e.py`.
- The E2E helper already tolerates the case where the synchronous rollout request times out after Temporal started work.
- It still fails when `k3d` ingress drops the initial `POST /admin/tenants/{tenant_id}/release` before the API writes `tenant_release_assignments`, because the helper only polls `GET` and never reissues the request.

## Plan

1. Retry the rollout `POST` when the transient failure left no assignment row.
2. Keep the retry bounded so the helper stays honest about real failures.
3. Add unit coverage for the missing-row retry path.

## Verification

- `uv run pytest apps/api/tests/unit/test_release_rollout_e2e_helpers.py -q --tb=short`
