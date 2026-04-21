# T04: Convert public ingress to a package-backed route module

> **Milestone**: M36-platform-api-route-topology-phase1
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Move `public_ingress.py` into a package-backed module while preserving the optional-route factory strings and current mounting behavior. This task keeps the public ingress/web-chat runtime surface intact but gives it a stable home for future decomposition.

## Subtasks

- [ ] **Create `routes/public_ingress/`**: add `router.py` and `__init__.py` so `public_ingress` becomes a package-backed singleton route module.
- [ ] **Preserve both factory exports**: keep `create_public_ingress_router` and `create_web_chat_runtime_router` importable from `platform_api.routes.public_ingress`.
- [ ] **Keep optional route loading stable**: ensure `platform_api.optional_routes` keeps resolving the same factory paths after the conversion.
- [ ] **Retain focused proof**: keep or add tests that exercise optional-route resolution or public-ingress mounting after the move.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/public_ingress/__init__.py` | Create | Re-export the public ingress route factories |
| `apps/api/src/platform_api/routes/public_ingress/router.py` | Create | New implementation home for the current public-ingress routes |
| `apps/api/src/platform_api/optional_routes.py` | Modify selectively | Keep lazy factory-path loading behavior stable |
| `apps/api/src/platform_api/main.py` | Modify selectively | Preserve direct imports if needed |
| `apps/api/tests/` | Modify/Create | Focused proof for public-ingress route mounting and optional route resolution |

## Implementation Notes

- Planning-only task. Do not execute until the human explicitly activates M36.
- `optional_routes.py` is the real compatibility risk here. Treat the string factory paths as part of the contract.
- Do not change feature-flag or environment-based route loading behavior while moving the module.
- Do not merge `auth` into `public_ingress`; they are separate owners in phase 1.

## Acceptance Criteria

- [ ] `public_ingress` is package-backed with `router.py` plus `__init__.py`.
- [ ] `create_public_ingress_router` and `create_web_chat_runtime_router` remain importable from the same module path.
- [ ] `optional_routes.py` keeps resolving and mounting the same public-ingress factories after the move.

## Verification

```bash
uv run ruff check \
  apps/api/src/platform_api/routes/public_ingress \
  apps/api/src/platform_api/optional_routes.py \
  apps/api/src/platform_api/main.py \
  apps/api/tests

uv run pyright \
  apps/api/src/platform_api/routes/public_ingress \
  apps/api/src/platform_api/optional_routes.py \
  apps/api/src/platform_api/main.py

uv run pytest \
  apps/api/tests \
  -q --tb=short -k "public_ingress or web_chat_runtime or optional_routes"
```

## References

- Milestone: [M36-platform-api-route-topology-phase1.md](../../milestones/M36-platform-api-route-topology-phase1.md)
- Design: `wiki/queries/2026-04-11-design-platform-api-route-topology-refactor.md`
