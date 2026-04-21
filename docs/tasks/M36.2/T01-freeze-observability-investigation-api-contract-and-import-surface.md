# T01: Freeze observability investigation API contract and import surface

> **Milestone**: M36.2-observability-investigation-api-decomposition
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Description

Freeze the live package surface for `platform_api.routes.observability` before
any code moves. This task records which public and private package exports are
still used by tests or callers so later cleanup stays evidence-based instead of
guessing.

## Subtasks

- [x] **Inventory live imports**: update the route import-surface guard for the
      `platform_api.routes.observability` package, its modules, and any
      currently-used private exports.
- [x] **Record the intended package split**: add the approved API-shell vs
      platform-core boundary and the `reports.py` deferral to the milestone
      progress notes.
- [x] **Freeze the compatibility seams**: keep the current package exports
      explicit so later tasks can narrow them safely instead of breaking tests
      by accident.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tests/architecture/test_platform_api_route_import_surface.py` | Modify | Freeze the observability package/module import surface and current private compatibility seams. |
| `docs/tasks/M36.2/PROGRESS.md` | Modify | Record the live contract, current package surface, and deferred `reports.py` scope. |

## Implementation Notes

- Treat `platform_api.routes.observability` as the published package surface.
- Private helpers still imported by tests are allowed only as temporary
  compatibility seams with explicit caller proof.
- Do not broaden this task into code movement. It exists to stop later churn
  from deleting a seam blindly.

## Acceptance Criteria

- [x] The observability package import surface is explicitly frozen in
      architecture tests.
- [x] The progress tracker records the current package surface and the
      `reports.py` deferral.
- [x] Later M36.2 tasks can point to concrete caller evidence before removing a
      private compatibility export.

## References

- Milestone: [M36.2-observability-investigation-api-decomposition.md](../../milestones/M36.2-observability-investigation-api-decomposition.md)
- Related: [wiki/architecture/architecture.md](../../../wiki/architecture/architecture.md)
