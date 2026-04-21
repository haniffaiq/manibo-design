# T05: Move channel, interactive-session, incident, and composition builders into platform-core observability

> **Milestone**: M36.2-observability-investigation-api-decomposition
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T02

---

## Description

Move the remaining non-HTTP investigation builders below the API shell. This
task extracts channel-runtime, interactive-channel-session, control-plane
incident, and tenant-composition investigation builders into platform-core.

## Subtasks

- [x] **Create channel/runtime owner**: add a platform-core module for
      channel-runtime and interactive-session investigation builders.
- [x] **Move control-plane and composition builders**: extract the remaining
      incident/composition read logic out of the route layer.
- [x] **Preserve cross-surface comparisons**: keep compare/sort behavior and
      timeline paging behavior stable after the move.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/observability/investigation/channels.py` | Create | Own channel-runtime and interactive-session investigation builders. |
| `packages/platform-core/src/platform_core/observability/investigation/service.py` | Modify | Expose reusable entry points for channel, incident, and composition investigation. |
| `apps/api/src/platform_api/routes/observability/router.py` | Modify | Delegate channel/runtime, incident, and composition logic to platform-core. |
| `packages/platform-core/tests/unit/test_observability/test_investigation_channels.py` | Create | Prove channel/runtime and related builders at the platform-core layer. |
| `apps/api/tests/integration/test_public_ingress_observability.py` | Modify | Keep interactive-channel and channel-runtime investigation behavior stable. |
| `apps/api/tests/integration/test_observability_control_plane_runtime.py` | Modify | Keep control-plane incident and runtime investigation behavior stable. |
| `apps/api/tests/integration/test_observability_channel_runtime_legacy_materialization.py` | Modify | Keep legacy-channel-runtime handling stable. |

## Implementation Notes

- This task should leave only thin orchestration and HTTP presentation concerns
  in the route layer.
- Preserve cursor behavior, ordering, and cross-kind compare behavior exactly.
- Keep the route layer responsible for API-specific href construction.

## Acceptance Criteria

- [x] Channel-runtime, interactive-session, incident, and composition
      investigation builders no longer live in the route layer.
- [x] Timeline paging and compare behavior remain unchanged.
- [x] Interactive/public-ingress observability endpoints remain unchanged.

## References

- Milestone: [M36.2-observability-investigation-api-decomposition.md](../../milestones/M36.2-observability-investigation-api-decomposition.md)
- Depends on: [T02-extract-observability-route-schemas-and-dependencies.md](T02-extract-observability-route-schemas-and-dependencies.md)
