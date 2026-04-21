# T02: Booking Package Move

> **Milestone**: M41.0-appointment-booking-package-structure
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T01

---

## Description

Create the `appointment_booking.booking` package and move the booking-state,
knowledge, scheduling, search, schema, runtime-event, and tool modules into it
without changing behavior.

## Subtasks

- [x] **Create booking package**: add `appointment_booking/booking/__init__.py`.
- [x] **Move booking models and state**: move `booking_state.py`, `schemas.py`,
      and booking runtime events under `booking/`.
- [x] **Move knowledge and scheduling**: move `knowledge_base.py`,
      `scheduling.py`, and `search_resolution.py` under `booking/`.
- [x] **Move tools**: move `tools.py` under `booking/` and update plugin
      imports.
- [x] **Prove behavior**: run focused booking-state, tool, and config tests.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/appointment_booking/src/appointment_booking/booking/__init__.py` | Create | Booking package export surface |
| `solutions/appointment_booking/src/appointment_booking/booking/state.py` | Move | Former `booking_state.py` |
| `solutions/appointment_booking/src/appointment_booking/booking/schemas.py` | Move | Former `schemas.py` |
| `solutions/appointment_booking/src/appointment_booking/booking/runtime_events.py` | Move | Former `booking_runtime_events.py` |
| `solutions/appointment_booking/src/appointment_booking/booking/knowledge.py` | Move | Former `knowledge_base.py` |
| `solutions/appointment_booking/src/appointment_booking/booking/scheduling.py` | Move | Former `scheduling.py` |
| `solutions/appointment_booking/src/appointment_booking/booking/search_resolution.py` | Move | Former `search_resolution.py` |
| `solutions/appointment_booking/src/appointment_booking/booking/tools.py` | Move | Former `tools.py` |
| `solutions/appointment_booking/src/appointment_booking/plugin.py` | Modify | Import tools from booking package |

## Implementation Notes

- Use behavior-preserving moves first. Do not split large modules internally in
  this task unless the move requires a small import fix.
- Leave temporary top-level re-export shims only if needed for external callers
  that cannot move until T06.
- Do not introduce Affidea-specific names or behavior.

## Acceptance Criteria

- [x] Booking-owned code lives under `appointment_booking.booking`.
- [x] Plugin registration still exposes the same existing Grove tools.
- [x] Existing clinic-registration agent config validation remains green.
- [x] Top-level shims, if any, are tiny re-exports with a T06 removal target.

## Evidence

Commands run on 2026-04-20:

```bash
uv run pytest solutions/appointment_booking/tests/unit/test_appointment_booking.py solutions/appointment_booking/tests/unit/test_appointment_booking_runtime_events.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q
uv run pytest solutions/appointment_booking/tests/integration/test_clinic_registration_runtime_plugin_tools.py -q
uv run pyright solutions/appointment_booking/src/appointment_booking/booking solutions/appointment_booking/src/appointment_booking/plugin.py
uv run ruff check solutions/appointment_booking/src/
uv run python -c "from appointment_booking.booking.tools import BookClinicAppointmentTool; from appointment_booking.tools import BookClinicAppointmentTool as ShimTool; print(BookClinicAppointmentTool.__name__, ShimTool.__name__)"
```

Results:

- Booking unit/config tests: 59 passed
- Plugin integration test: 1 passed
- Booking/plugin pyright: 0 errors
- Solution source ruff: passed
- New import and compatibility-shim import smoke printed
  `BookClinicAppointmentTool BookClinicAppointmentTool`

Full `uv run pyright solutions/appointment_booking/src/` was checked during
T02 and is still blocked by existing strict-typing errors in
`appointment_booking/api.py`. T05 owns decomposing that route surface.

## References

- Depends on: [T01](T01-import-inventory-and-baseline.md)
- Milestone: [M41.0-appointment-booking-package-structure.md](../../milestones/M41.0-appointment-booking-package-structure.md)
