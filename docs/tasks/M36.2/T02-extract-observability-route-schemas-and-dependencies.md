# T02: Extract observability route schemas and dependencies

> **Milestone**: M36.2-observability-investigation-api-decomposition
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Move route-owned response models and repeated route-only dependency helpers out
of `apps/api/src/platform_api/routes/observability/router.py` into explicit
package-local owners. This is the first thin-route step before reusable
diagnosis logic moves into `platform_core`.

## Subtasks

- [x] **Create route schema owner**: move the observability investigation
      response models into `schemas.py`.
- [x] **Create route dependency owner**: move repeated auth/scope/query helper
      logic into `dependencies.py`.
- [x] **Keep behavior unchanged**: switch the route module to import those
      owners without changing endpoint contracts.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/observability/schemas.py` | Create | Own the FastAPI request/response models for the investigation API. |
| `apps/api/src/platform_api/routes/observability/dependencies.py` | Create | Own repeated route-only auth, scope, and parameter helpers. |
| `apps/api/src/platform_api/routes/observability/router.py` | Modify | Stop owning inline schemas and repeated dependency helpers. |
| `apps/api/tests/integration/test_observability.py` | Modify | Keep tenant/admin investigation route behavior covered after schema/dependency extraction. |
| `apps/api/tests/integration/test_public_ingress_observability.py` | Modify | Keep interactive-channel and channel-runtime route behavior covered after extraction. |

## Implementation Notes

- Route schemas stay in `platform_api`; they are HTTP contracts, not
  platform-core domain models.
- Route dependencies stay in `platform_api`; they are transport/auth concerns.
- Do not move reusable diagnosis logic in this task. That belongs to later
  platform-core tasks.

## Acceptance Criteria

- [x] Investigation response models no longer live inline in `router.py`.
- [x] Repeated route-only auth/scope/query helpers live in
      `dependencies.py`.
- [x] Tenant and admin investigation routes behave the same after the
      extraction.

## References

- Milestone: [M36.2-observability-investigation-api-decomposition.md](../../milestones/M36.2-observability-investigation-api-decomposition.md)
- Depends on: [T01-freeze-observability-investigation-api-contract-and-import-surface.md](T01-freeze-observability-investigation-api-contract-and-import-surface.md)
