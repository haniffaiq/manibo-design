# T05: API Route Surface Isolation

> **Milestone**: M41.0-appointment-booking-package-structure
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T04

---

## Description

Isolate the appointment-booking FastAPI route surface so API transport code is
thin and domain behavior stays in `solutions/appointment_booking`.

## Subtasks

- [x] **Create route package**: add
      `apps/api/src/platform_api/routes/appointment_booking`.
- [x] **Move transport helpers only**: keep APIRouter, dependencies,
      presenters, request/response schemas, and route composition in the app
      shell.
- [x] **Keep domain logic in solution packages**: route handlers call
      solution services rather than owning booking behavior.
- [x] **Update manifest wiring**: point the solution router factory at the new
      route package or a tiny solution-owned compatibility factory.
- [x] **Run API integration proof**: prove all current clinic endpoints behave
      the same.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/appointment_booking/__init__.py` | Create | Route package marker |
| `apps/api/src/platform_api/routes/appointment_booking/router.py` | Create | Router factory / aggregator |
| `apps/api/src/platform_api/routes/appointment_booking/dependencies.py` | Create | FastAPI dependencies |
| `apps/api/src/platform_api/routes/appointment_booking/schemas.py` | Create | HTTP request/response schemas if needed |
| `apps/api/src/platform_api/routes/appointment_booking/presenters.py` | Create | HTTP presentation helpers if needed |
| `apps/api/src/platform_api/routes/appointment_booking/bookings.py` | Create | Booking result and availability routes |
| `apps/api/src/platform_api/routes/appointment_booking/browser_rehearsal.py` | Create | Browser rehearsal routes |
| `apps/api/src/platform_api/routes/appointment_booking/follow_ups.py` | Create | Follow-up routes |
| `apps/api/src/platform_api/routes/appointment_booking/automation.py` | Create | Automation status routes |
| `apps/api/src/platform_api/routes/appointment_booking/runtime.py` | Create | Runtime/integration status routes |
| `solutions/appointment_booking/src/appointment_booking/api.py` | Modify | Thin compatibility factory or removal target |
| `solutions/appointment_booking/src/appointment_booking/manifest.py` | Modify | Router factory path |

## Implementation Notes

- `apps/api` may import the solution because apps are layer-4 composition
  shells; the solution must not import `apps/api`.
- Do not move domain data transforms into `apps/api` unless they are strictly
  HTTP presentation concerns.
- If this task changes API inventory, regenerate and check it in this task.
- Current implementation direction:
  - route registration moves to
    `apps/api/src/platform_api/routes/appointment_booking`;
  - solution-owned booking and automation helpers hold the SQL row transforms,
    status builders, and integration-status assembly;
  - the old `appointment_booking/api.py` god module is split rather than kept
    as a large compatibility factory.

## Acceptance Criteria

- [x] `appointment_booking/api.py` is no longer a mixed-responsibility god
      module.
- [x] Domain behavior stays in solution packages.
- [x] Existing clinic API integration tests pass.
- [x] API inventory is regenerated if route ownership or signatures change.

## Verification Evidence

- `uv run python -c "from platform_api.routes.appointment_booking import create_router; from appointment_booking.manifest import manifest; print(manifest.route_specs[0].factory); print(len(create_router().routes))"` — passed, 16 routes.
- `uv run python tools/scripts/generate_api_inventory.py` — passed, endpoints=254.
- `uv run python tools/scripts/check_api_inventory.py` — passed, endpoints=254.
- `uv run pytest solutions/appointment_booking/tests/api_integration/ -q` — 21 passed.
- `uv run pytest apps/api/tests/integration/test_observability_solution_enrichers.py apps/api/tests/integration/test_observability_solution_enrichers_details.py -q` — 7 passed.
- `uv run pytest tests/architecture/test_app_layer_boundaries.py tests/architecture/test_solution_isolation.py -q` — 9 passed.
- `uv run pyright solutions/appointment_booking/src/appointment_booking/booking/records.py solutions/appointment_booking/src/appointment_booking/automation/service.py solutions/appointment_booking/src/appointment_booking/automation/schemas.py solutions/appointment_booking/src/appointment_booking/observability/service.py apps/api/src/platform_api/routes/appointment_booking apps/api/src/platform_api/routes/observability/observability_enrichers.py` — 0 errors.
- `uv run ruff check ...` on touched route/solution/test files — passed.

## Carry-Forward

- `tests/architecture/test_repo_file_size.py` still fails because
  `solutions/appointment_booking/src/appointment_booking/booking/tools.py`
  is 1347 lines after the T02 move. Do not paper over this with an allowlist;
  split the file in T06/T07.

## References

- Depends on: [T04](T04-voice-observability-evaluation-move.md)
- Milestone: [M41.0-appointment-booking-package-structure.md](../../milestones/M41.0-appointment-booking-package-structure.md)
