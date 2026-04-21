# T01: Import Inventory And Baseline

> **Milestone**: M41.0-appointment-booking-package-structure
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Description

Record the current appointment-booking module shape, import callers, and
baseline tests before moving files. This gives later refactor tasks a concrete
reference point and keeps behavior changes separate from topology changes.

## Subtasks

- [x] **Create task pack**: add M41.0 task files and progress tracking.
- [x] **Inventory source modules**: record the current top-level package files,
      oversized modules, and cross-package callers.
- [x] **Run baseline proof**: run the import smoke and scoped appointment
      booking tests before any move.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M41.0/PROGRESS.md` | Create | Live progress for M41.0 |
| `docs/tasks/M41.0/T01-import-inventory-and-baseline.md` | Create | This task and baseline evidence |
| `docs/tasks/M41.0/T02-booking-package-move.md` | Create | Booking package move task |
| `docs/tasks/M41.0/T03-automation-crm-handoff-move.md` | Create | Automation, CRM, and handoff move task |
| `docs/tasks/M41.0/T04-voice-observability-evaluation-move.md` | Create | Voice, observability, and evaluation move task |
| `docs/tasks/M41.0/T05-api-route-surface-isolation.md` | Create | API route-surface isolation task |
| `docs/tasks/M41.0/T06-import-shims-and-test-updates.md` | Create | Import update and compatibility-shim task |
| `docs/tasks/M41.0/T07-ship-pr.md` | Create | Ship-PR cleanup and verification task |
| `docs/milestones/M41.0-appointment-booking-package-structure.md` | Modify | Mark milestone in progress |
| `wiki/log.md` | Modify | Record milestone activation |

## Current Inventory

Top-level source modules under `solutions/appointment_booking/src/appointment_booking`:

- `activities.py`, `workflows.py`, `reminders.py`
- `agent_profiles.py`, `agent_template.py`, `voice_rehearsal.py`
- `api.py`
- `booking_runtime_events.py`, `booking_state.py`, `knowledge_base.py`,
  `scheduling.py`, `schemas.py`, `search_resolution.py`, `tools.py`
- `clinic_webhook_crm.py`
- `eval_support.py`
- `manifest.py`, `plugin.py`, `observability.py`, `__init__.py`

Large files that drive the refactor:

- `api.py`: 2276 lines
- `tools.py`: 1347 lines
- `booking_state.py`: 444 lines
- `activities.py`: 351 lines
- `observability.py`: 350 lines

External callers that must keep working or be updated:

- `apps/temporal-worker/tests/unit/test_inbound_call_orchestrator_budget.py`
  imports `appointment_booking.workflows`.
- `packages/platform-core/tests/unit/test_e2e_fixture_contracts.py` imports
  `appointment_booking.schemas`.
- Solution tests import current top-level modules directly across unit,
  integration, API integration, and e2e suites.

## Baseline Evidence

Commands to run before any move:

```bash
uv run python -c "import appointment_booking; from appointment_booking.manifest import manifest; print(manifest.name)"
uv run pytest solutions/appointment_booking/tests/unit/ -q
uv run pytest solutions/appointment_booking/tests/integration/ -q
uv run pytest solutions/appointment_booking/tests/api_integration/ -q
```

Results on 2026-04-20:

- Import smoke: `appointment_booking`
- Unit tests: 94 passed in 3.29s
- Integration tests: 12 passed in 6.33s with existing warnings
- API integration tests: 21 passed in 8.98s with existing warnings

Note: the original milestone verification command used `manifest.solution_id`,
but `SolutionManifest` exposes `name`. The milestone verification command was
corrected in this task.

## Acceptance Criteria

- [x] M41.0 task files exist and match the approved milestone tasks.
- [x] Current source module and import inventory is recorded.
- [x] Baseline import smoke passes.
- [x] Baseline unit, integration, and API integration tests are run and
      results are recorded here.

## References

- Milestone: [M41.0-appointment-booking-package-structure.md](../../milestones/M41.0-appointment-booking-package-structure.md)
- Design: [nfq-langgraph-affidea-voice-booking.md](../../../wiki/design-docs/nfq-langgraph-affidea-voice-booking.md)
