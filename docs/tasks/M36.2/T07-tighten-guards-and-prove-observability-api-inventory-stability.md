# T07: Tighten guards and prove observability API inventory stability

> **Milestone**: M36.2-observability-investigation-api-decomposition
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T06

---

## Description

Finish the milestone with the enforcement and proof pass. Tighten the
observability route-size and import-surface guards, prove the package exports
and API inventory are stable, and record the named shrink-only deferrals:
`reports.py` for the later KPI/report milestone plus over-target API-side
investigation helper modules for a later cleanup pass.

## Subtasks

- [x] **Tighten package guards**: update the route import-surface and
      file-size checks for the new observability package shape.
- [x] **Prove inventory stability**: regenerate and check the API inventory so
      the route split does not silently change published routes.
- [x] **Record final proof**: update the progress tracker with verification
      evidence and the explicit report/helper deferrals.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tests/architecture/test_platform_api_route_import_surface.py` | Modify | Freeze the final observability package surface after the decomposition. |
| `tests/architecture/test_repo_file_size.py` | Modify | Add or tighten the observability investigation route ceilings. |
| `docs/arch/generated/api_inventory.json` | Modify | Refresh generated API inventory after the route/package split. |
| `docs/arch/generated/api_inventory.md` | Modify | Refresh the human-readable inventory after the route/package split. |
| `docs/tasks/M36.2/PROGRESS.md` | Modify | Record final verification evidence and the explicit report/helper deferrals. |

## Implementation Notes

- The milestone ends only when the guards reflect the new package shape.
- Do not touch `docs/requirements/checklist.md`.
- Keep `reports.py` and over-target helper deferrals explicit so later cleanup
  starts from a clean contract instead of implicit debt.

## Acceptance Criteria

- [x] Mechanical checks fail if the observability investigation API regrows into
      the old god-module shape, endpoint/shim modules exceed the 500-line
      target, or named over-target helpers grow.
- [x] `tools/scripts/check_api_inventory.py` passes after the split.
- [x] The final proof and report/helper deferrals are captured in
      `docs/tasks/M36.2/PROGRESS.md`.

## References

- Milestone: [M36.2-observability-investigation-api-decomposition.md](../../milestones/M36.2-observability-investigation-api-decomposition.md)
- Depends on: [T06-replace-the-observability-god-router-with-thin-tenant-admin-routes-and-presenters.md](T06-replace-the-observability-god-router-with-thin-tenant-admin-routes-and-presenters.md)
