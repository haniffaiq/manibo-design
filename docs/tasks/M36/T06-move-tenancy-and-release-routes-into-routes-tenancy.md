# T06: Move tenancy and release routes into `routes/tenancy`

> **Milestone**: M36-platform-api-route-topology-phase1
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Create the `routes/tenancy` domain package and move the tenancy, release, billing, and solution-governance route files under it while preserving the current factory imports. This task defines the tenancy ownership seam without touching the underlying business logic.

## Subtasks

- [x] **Create `routes/tenancy/`**: add the domain package that will own tenancy and release-adjacent route implementations.
- [x] **Move tenancy/release implementations**: relocate `tenants.py`, `tenant_settings.py`, `team_users.py`, `releases.py`, `billing.py`, and `solutions.py`.
- [x] **Keep top-level compatibility shims**: preserve the current flat filenames as thin re-export shims so main wiring does not need semantic changes.
- [x] **Preserve current mounting order**: keep the same factories mounted from `platform_api.main` after the move.
- [x] **Retain focused proof**: keep or add tests that prove tenancy/admin route wiring still behaves the same.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/tenancy/` | Create | Domain package for tenancy and release route implementations |
| `apps/api/src/platform_api/routes/tenants.py` | Modify | Compatibility shim to `routes.tenancy.tenants` |
| `apps/api/src/platform_api/routes/tenant_settings.py` | Modify | Compatibility shim to `routes.tenancy.tenant_settings` |
| `apps/api/src/platform_api/routes/team_users.py` | Modify | Compatibility shim to `routes.tenancy.team_users` |
| `apps/api/src/platform_api/routes/releases.py` | Modify | Compatibility shim to `routes.tenancy.releases` |
| `apps/api/src/platform_api/routes/billing.py` | Modify | Compatibility shim to `routes.tenancy.billing` |
| `apps/api/src/platform_api/routes/solutions.py` | Modify | Compatibility shim to `routes.tenancy.solutions` |
| `apps/api/src/platform_api/main.py` | Modify selectively | Preserve tenancy and release route imports/mounting |
| `apps/api/tests/` | Modify/Create | Focused route-wiring coverage for tenancy surfaces |

## Implementation Notes

- Planning-only task. Do not execute until the human explicitly activates M36.
- `solutions.py` stays in this package for phase 1 because the goal is topology clarity inside `platform_api.routes`, not a larger product-layer rethink.
- Do not split inline schemas out of `tenants.py` or `billing.py` in this task. That is phase 2 work.
- Preserve any direct imports of helper functions or `__all__` exports that current tests rely on.

## Acceptance Criteria

- [x] The six tenancy/release route files live under `routes/tenancy/`.
- [x] Existing flat module imports continue to work through thin shims.
- [x] Main route mounting and focused tenancy route tests remain green after the move.

## Verification

```bash
uv run ruff check \
  apps/api/src/platform_api/routes/tenancy \
  apps/api/src/platform_api/routes/tenants.py \
  apps/api/src/platform_api/routes/tenant_settings.py \
  apps/api/src/platform_api/routes/team_users.py \
  apps/api/src/platform_api/routes/releases.py \
  apps/api/src/platform_api/routes/billing.py \
  apps/api/src/platform_api/routes/solutions.py \
  apps/api/src/platform_api/main.py \
  apps/api/tests

uv run pyright \
  apps/api/src/platform_api/routes/tenancy \
  apps/api/src/platform_api/main.py

uv run pytest \
  apps/api/tests/integration/test_tenants.py \
  apps/api/tests/integration/test_tenant_settings.py \
  apps/api/tests/integration/test_team_users.py \
  apps/api/tests/integration/test_release_rollout.py \
  apps/api/tests/integration/test_tenant_state_enforcement.py \
  apps/api/tests/integration/test_solutions_api.py \
  apps/api/tests/integration/test_billing.py \
  apps/api/tests/unit/test_span_correlation_routes.py \
  apps/api/tests/unit/test_tenants_pagination.py \
  apps/api/tests/unit/test_team_users_service_adapter.py \
  apps/api/tests/unit/test_logging_configuration.py \
  -q --tb=short
```

## References

- Milestone: [M36-platform-api-route-topology-phase1.md](../../milestones/M36-platform-api-route-topology-phase1.md)
- Design: `wiki/queries/2026-04-11-design-platform-api-route-topology-refactor.md`
