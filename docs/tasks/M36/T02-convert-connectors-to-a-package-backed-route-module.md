# T02: Convert connectors to a package-backed route module

> **Milestone**: M36-platform-api-route-topology-phase1
> **Status**: Not Started
> **Estimate**: S (< 2h)
> **Depends on**: T01

---

## Description

Move `connectors.py` behind a package-backed module so connector route ownership becomes explicit without changing its current import surface. This is a small singleton conversion that should reuse the `auth` and `workflows` pattern proven in T01.

## Subtasks

- [ ] **Create `routes/connectors/`**: introduce `router.py` as the implementation file and `__init__.py` as the compatibility re-export.
- [ ] **Preserve `create_connectors_router` import stability**: keep `from platform_api.routes.connectors import create_connectors_router` working unchanged.
- [ ] **Keep connector route behavior equivalent**: do not touch endpoint paths, tags, schemas, or injected dependencies while moving the file.
- [ ] **Add focused proof**: keep or add a focused wiring test so the regroup shows connector mounting still works.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/connectors/__init__.py` | Create | Re-export `create_connectors_router` |
| `apps/api/src/platform_api/routes/connectors/router.py` | Create | New implementation home for the current connectors routes |
| `apps/api/src/platform_api/main.py` | Modify selectively | Keep imports stable only if needed |
| `apps/api/tests/` | Modify/Create | Focused connector-route wiring coverage if current tests do not already prove it |

## Implementation Notes

- Planning-only task. Do not execute until the human explicitly activates M36.
- This is intentionally boring. Do not use the connectors move as an excuse to split inline Pydantic models or change request validation.
- If the existing module exports more than the router factory, keep the same exports available from the package root.

## Acceptance Criteria

- [ ] `connectors` is package-backed with `router.py` plus `__init__.py`.
- [ ] Existing imports of `create_connectors_router` continue to work without call-site churn.
- [ ] Connector route behavior is unchanged after the move.

## Verification

```bash
uv run ruff check \
  apps/api/src/platform_api/routes/connectors \
  apps/api/src/platform_api/main.py \
  apps/api/tests

uv run pyright \
  apps/api/src/platform_api/routes/connectors \
  apps/api/src/platform_api/main.py

uv run pytest \
  apps/api/tests \
  -q --tb=short -k "connector or connectors"
```

## References

- Milestone: [M36-platform-api-route-topology-phase1.md](../../milestones/M36-platform-api-route-topology-phase1.md)
- Design: `wiki/queries/2026-04-11-design-platform-api-route-topology-refactor.md`
