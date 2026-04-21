# T04: Move call-session investigation builders into platform-core observability

> **Milestone**: M36.2-observability-investigation-api-decomposition
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02

---

## Description

Move call-session investigation logic below the API shell. This task extracts
call detail, timeline, compare, availability, and integrity-gap builders into
the new platform-core investigation package.

## Subtasks

- [x] **Create call investigation owner**: add a platform-core module for
      call-session investigation builders.
- [x] **Move call read-model assembly**: extract call detail, timeline,
      compare, and availability/integrity analysis out of the route layer.
- [x] **Keep solution enrichers working**: keep the route layer responsible for
      HTTP presentation while preserving the current enricher integration.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/observability/investigation/calls.py` | Create | Own call-session detail, timeline, compare, and integrity-gap builders. |
| `packages/platform-core/src/platform_core/observability/investigation/service.py` | Modify | Expose reusable call-session investigation entry points. |
| `apps/api/src/platform_api/routes/observability/router.py` | Modify | Delegate call-session investigation logic to platform-core. |
| `packages/platform-core/tests/unit/test_observability/test_investigation_calls.py` | Create | Prove call-session investigation builders at the platform-core layer. |
| `apps/api/tests/integration/test_observability.py` | Modify | Keep tenant/admin call-session behavior unchanged. |
| `apps/api/tests/integration/test_observability_solution_enrichers.py` | Modify | Keep shared solution enricher behavior stable after the move. |
| `apps/api/tests/integration/test_observability_solution_enrichers_details.py` | Modify | Keep enriched call detail behavior stable after the move. |
| `apps/api/tests/integration/test_observability_solution_enrichers_driver_verification.py` | Modify | Keep driver-verification call detail enrichment stable after the move. |

## Implementation Notes

- Call investigation builders belong in `platform_core`; solution enricher
  loading still belongs in the API shell because it depends on `Request`,
  `app.state`, and API-facing response shaping.
- Preserve tenant/admin differences only where the API shell adds
  links/hrefs/recording paths.

## Acceptance Criteria

- [x] Call-session detail, timeline, compare, availability, and integrity
      analysis no longer live in the route layer.
- [x] Solution-enricher-backed call detail responses stay behavior-preserving.
- [x] Tenant/admin call-session investigation endpoints remain unchanged.

## References

- Milestone: [M36.2-observability-investigation-api-decomposition.md](../../milestones/M36.2-observability-investigation-api-decomposition.md)
- Depends on: [T02-extract-observability-route-schemas-and-dependencies.md](T02-extract-observability-route-schemas-and-dependencies.md)
