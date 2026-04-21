# T01: Establish package pattern with auth, workflows, and internal routes

> **Milestone**: M36-platform-api-route-topology-phase1
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Description

Establish the two compatibility patterns phase 1 will reuse everywhere else: package-backed singleton route modules (`auth`, `workflows`) and grouped-domain shim modules (`internal/*`). This task proves the regroup strategy on the smallest safe slice before the larger domains move.

## Subtasks

- [ ] **Convert `auth.py` into a package-backed route module**: replace the flat file with `routes/auth/router.py` plus `routes/auth/__init__.py` that re-exports `create_auth_router`.
- [ ] **Convert `workflows.py` into a package-backed route module**: replace the flat file with `routes/workflows/router.py` plus `routes/workflows/__init__.py` re-exports.
- [ ] **Create `routes/internal/` for internal-only route files**: move `internal_agent_config.py`, `internal_llm_policy.py`, and `internal_test_call_runtime.py` under the new domain package.
- [ ] **Keep import compatibility stable**: leave top-level shim modules for the internal routes so `platform_api.main` can keep its current imports during phase 1.
- [ ] **Prove internal-token wiring still works**: add or update focused architecture/runtime tests for `require_internal_token` and the three internal route factories after the move.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/auth/__init__.py` | Create | Re-export `create_auth_router` from the new package |
| `apps/api/src/platform_api/routes/auth/router.py` | Create | New implementation home for the current `auth.py` router |
| `apps/api/src/platform_api/routes/workflows/__init__.py` | Create | Re-export `create_workflows_router` from the new package |
| `apps/api/src/platform_api/routes/workflows/router.py` | Create | New implementation home for the current `workflows.py` router |
| `apps/api/src/platform_api/routes/internal/` | Create | New domain package for internal-only route modules |
| `apps/api/src/platform_api/routes/internal_agent_config.py` | Modify | Top-level shim importing from `routes.internal.internal_agent_config` |
| `apps/api/src/platform_api/routes/internal_llm_policy.py` | Modify | Top-level shim importing from `routes.internal.internal_llm_policy` |
| `apps/api/src/platform_api/routes/internal_test_call_runtime.py` | Modify | Top-level shim importing from `routes.internal.internal_test_call_runtime` |
| `apps/api/src/platform_api/main.py` | Modify selectively | Keep imports stable or reduce them only if the compatibility contract remains equivalent |
| `apps/api/tests/` | Modify/Create | Focused tests for internal route mounting and internal token behavior |

## Implementation Notes

- Planning-only task. Do not execute until the human explicitly activates M36.
- `auth` and `workflows` are the package-backed singleton pattern for phase 1: the module name becomes a package, and callers continue importing from `platform_api.routes.auth` / `platform_api.routes.workflows`.
- `internal` is the grouped-domain pattern for phase 1: implementation moves under `routes/internal/`, while the old flat filenames stay as thin compatibility shims.
- Do not extract schemas or helpers here. The point is to prove the topology pattern, not to clean the internals yet.
- If import churn in `main.py` is avoidable, avoid it. Favor stable imports over aesthetic rewrites.

## Acceptance Criteria

- [ ] `auth` and `workflows` are package-backed modules with `router.py` plus `__init__.py` re-exports.
- [ ] The three internal route files live under `routes/internal/` with top-level compatibility shims preserved.
- [ ] `platform_api.main` still mounts the same auth, workflow, and internal route factories after the move.
- [ ] Internal token enforcement still has focused test coverage after the regroup.

## Verification

```bash
uv run ruff check \
  apps/api/src/platform_api/routes/auth \
  apps/api/src/platform_api/routes/workflows \
  apps/api/src/platform_api/routes/internal \
  apps/api/src/platform_api/routes/internal_agent_config.py \
  apps/api/src/platform_api/routes/internal_llm_policy.py \
  apps/api/src/platform_api/routes/internal_test_call_runtime.py \
  apps/api/src/platform_api/main.py \
  apps/api/tests

uv run pyright \
  apps/api/src/platform_api/routes/auth \
  apps/api/src/platform_api/routes/workflows \
  apps/api/src/platform_api/routes/internal \
  apps/api/src/platform_api/main.py

uv run pytest \
  apps/api/tests \
  -q --tb=short -k "auth or workflow or internal_token or internal_agent_config or internal_llm_policy or internal_test_call_runtime"
```

## References

- Milestone: [M36-platform-api-route-topology-phase1.md](../../milestones/M36-platform-api-route-topology-phase1.md)
- Design: `wiki/queries/2026-04-11-design-platform-api-route-topology-refactor.md`
- Related: `wiki/design-docs/fastapi-best-practices.md`
