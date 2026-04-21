# T03: Move workflow-run decoding and builders into platform-core observability

> **Milestone**: M36.2-observability-investigation-api-decomposition
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02

---

## Description

Move workflow-run investigation logic below the API shell. This task creates
the new `platform_core.observability.investigation` package and moves workflow
payload decoding, step parsing, and workflow-run detail/timeline assembly into
that reusable owner.

## Subtasks

- [x] **Create the investigation package**: add the new platform-core package
      structure and export surface for reusable investigation logic.
- [x] **Move workflow decoding**: extract Temporal payload decoding, trace
      context extraction, and workflow-step parsing into platform-core.
- [x] **Move workflow read-model builders**: extract workflow-run detail and
      timeline builders out of the route layer.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/observability/investigation/__init__.py` | Create | Export the reusable observability investigation package surface. |
| `packages/platform-core/src/platform_core/observability/investigation/models.py` | Create | Own reusable internal investigation models and bundle types. |
| `packages/platform-core/src/platform_core/observability/investigation/workflows.py` | Create | Own workflow payload decoding, step parsing, and workflow-run builders. |
| `packages/platform-core/src/platform_core/observability/investigation/service.py` | Create | Provide reusable workflow investigation entry points consumed by the API shell. |
| `apps/api/src/platform_api/routes/observability/router.py` | Modify | Delegate workflow investigation logic to platform-core. |
| `packages/platform-core/tests/unit/test_observability/test_investigation_workflows.py` | Create | Prove workflow decoding and workflow-run builders at the platform-core layer. |
| `apps/api/tests/integration/test_observability.py` | Modify | Keep tenant/admin workflow-run detail, timeline, and compare behavior unchanged. |

## Implementation Notes

- Anything in this task that can run without FastAPI belongs in
  `platform_core`.
- Keep API response shaping and route href generation in the API shell.
- Reuse the existing Temporal and call-history primitives instead of
  re-inventing them.

## Acceptance Criteria

- [x] Workflow payload decoding and workflow-step parsing no longer live in the
      route layer.
- [x] Workflow-run detail/timeline builders are reusable from
      `platform_core.observability.investigation`.
- [x] Tenant/admin workflow investigation endpoints return the same data after
      the move.

## References

- Milestone: [M36.2-observability-investigation-api-decomposition.md](../../milestones/M36.2-observability-investigation-api-decomposition.md)
- Depends on: [T02-extract-observability-route-schemas-and-dependencies.md](T02-extract-observability-route-schemas-and-dependencies.md)
