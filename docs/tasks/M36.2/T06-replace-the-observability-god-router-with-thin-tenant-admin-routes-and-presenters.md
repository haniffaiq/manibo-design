# T06: Replace the observability god router with thin tenant/admin routes and presenters

> **Milestone**: M36.2-observability-investigation-api-decomposition
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T03, T04, T05

---

## Description

Replace the single 8k-line observability route file with thin tenant/admin
route modules and explicit API presenters. This task preserves the package
surface while making the route layer transport-shaped again.

## Subtasks

- [x] **Split tenant/admin routes**: move the tenant and admin route factories
      into separate route modules.
- [x] **Create API presenters**: keep API-specific hrefs, cursors, and response
      shaping in a dedicated route-layer owner.
- [x] **Preserve package imports**: keep `platform_api.routes.observability`
      exporting the supported router factories while narrowing private exports
      only when caller proof allows it.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/observability/tenant.py` | Create | Own tenant-scoped observability investigation routes only. |
| `apps/api/src/platform_api/routes/observability/admin.py` | Create | Own deployment/admin observability investigation routes only. |
| `apps/api/src/platform_api/routes/observability/presenters.py` | Create | Own API-specific href, cursor, and response-envelope shaping. |
| `apps/api/src/platform_api/routes/observability/__init__.py` | Modify | Export the stable package surface and remove unnecessary private exports where safe. |
| `apps/api/src/platform_api/routes/observability/router.py` | Modify | Reduce to a thin compatibility/assembly shim or remove if package exports stay stable without it. |
| `apps/api/tests/integration/test_observability.py` | Modify | Keep tenant/admin router behavior stable after the split. |
| `apps/api/tests/integration/test_public_ingress_observability.py` | Modify | Keep interactive-channel and channel-runtime behavior stable after the split. |
| `apps/api/tests/unit/test_observability_v2_read_models.py` | Modify | Keep private compatibility seams honest if any remain temporarily exported. |
| `tests/architecture/test_platform_api_route_import_surface.py` | Modify | Update the observability package surface after the route split. |

## Implementation Notes

- Route modules should own only FastAPI-specific concerns.
- Do not introduce a generic registration framework to reduce duplication.
- If `router.py` remains, it must be a thin compatibility shim, not a real
  logic owner.

## Acceptance Criteria

- [x] Tenant and admin route factories no longer live together in one god file.
- [x] API-specific presentation logic lives in `presenters.py`.
- [x] The supported `platform_api.routes.observability` package surface stays
      stable while unnecessary private exports are reduced.
- [x] No main observability investigation route file remains above 500 LOC.

## References

- Milestone: [M36.2-observability-investigation-api-decomposition.md](../../milestones/M36.2-observability-investigation-api-decomposition.md)
- Depends on:
  - [T03-move-workflow-run-decoding-and-builders-into-platform-core-observability.md](T03-move-workflow-run-decoding-and-builders-into-platform-core-observability.md)
  - [T04-move-call-session-investigation-builders-into-platform-core-observability.md](T04-move-call-session-investigation-builders-into-platform-core-observability.md)
  - [T05-move-channel-interactive-session-incident-and-composition-builders-into-platform-core-observability.md](T05-move-channel-interactive-session-incident-and-composition-builders-into-platform-core-observability.md)
