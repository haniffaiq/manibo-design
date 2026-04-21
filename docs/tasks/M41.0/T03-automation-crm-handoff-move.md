# T03: Automation CRM And Handoff Move

> **Milestone**: M41.0-appointment-booking-package-structure
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02

---

## Description

Move post-call automation, reminder workflow code, CRM adapter code, and any
handoff support into capability-owned packages.

## Subtasks

- [x] **Create automation package**: move Temporal workflow/activity/reminder
      code into `appointment_booking.automation`.
- [x] **Create CRM package**: move clinic webhook CRM adapter code into
      `appointment_booking.crm`.
- [x] **Create handoff package**: add the package surface reserved for live
      human-handoff support used by later Affidea work.
- [x] **Update manifests and tests**: keep workflow/activity registration and
      tests green.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/appointment_booking/src/appointment_booking/automation/__init__.py` | Create | Automation package export surface |
| `solutions/appointment_booking/src/appointment_booking/automation/workflows.py` | Move | Former `workflows.py` |
| `solutions/appointment_booking/src/appointment_booking/automation/activities.py` | Move | Former `activities.py` |
| `solutions/appointment_booking/src/appointment_booking/automation/reminders.py` | Move | Former `reminders.py` |
| `solutions/appointment_booking/src/appointment_booking/crm/__init__.py` | Create | CRM package export surface |
| `solutions/appointment_booking/src/appointment_booking/crm/client.py` | Move | Former `clinic_webhook_crm.py` |
| `solutions/appointment_booking/src/appointment_booking/handoff/__init__.py` | Create | Handoff package export surface |
| `solutions/appointment_booking/src/appointment_booking/manifest.py` | Modify | Point workflow/activity entry points at new modules |

## Implementation Notes

- Preserve Temporal names: `sol.appointment_booking.*` stays stable.
- Do not introduce new handoff behavior. This task creates the package surface
  only when there is no existing code to move yet.
- Keep direct peer-solution imports forbidden.

## Acceptance Criteria

- [x] Existing reminder workflow and post-call activity tests pass.
- [x] Temporal workflow/activity entry points still resolve.
- [x] CRM webhook adapter tests still pass.
- [x] No new solution-to-solution imports are introduced.

## Evidence

2026-04-20:

```bash
uv run pytest solutions/appointment_booking/tests/integration/test_appointment_reminder_workflow.py solutions/appointment_booking/tests/integration/test_post_call_activities.py -q
# 8 passed

uv run pytest solutions/appointment_booking/tests/unit/test_clinic_webhook_crm.py solutions/appointment_booking/tests/unit/test_appointment_booking.py -q
# 56 passed

uv run pytest apps/temporal-worker/tests/unit/test_inbound_call_orchestrator_budget.py -q
# 8 passed

uv run pyright solutions/appointment_booking/src/appointment_booking/automation solutions/appointment_booking/src/appointment_booking/crm solutions/appointment_booking/src/appointment_booking/handoff solutions/appointment_booking/src/appointment_booking/manifest.py apps/temporal-worker/src/temporal_worker/workflows/inbound_call_orchestrator.py
# 0 errors

uv run ruff check solutions/appointment_booking/src/ apps/temporal-worker/src/temporal_worker/workflows/inbound_call_orchestrator.py
# All checks passed

uv run python -c "from appointment_booking.manifest import manifest; print(manifest.temporal_activities[0], manifest.temporal_workflows[0]); from appointment_booking.activities import create_activities; from appointment_booking.automation.workflows import AppointmentReminderWorkflow; from appointment_booking.clinic_webhook_crm import create_clinic_webhook_crm_adapter; print(create_activities.__name__, AppointmentReminderWorkflow.__name__, create_clinic_webhook_crm_adapter.__name__)"
# appointment_booking.automation.activities:create_activities appointment_booking.automation.workflows.AppointmentReminderWorkflow
# create_activities AppointmentReminderWorkflow create_clinic_webhook_crm_adapter

uv run pytest packages/grove/tests/unit/architecture/test_doc_integrity.py -q --tb=short
# 10 passed

git diff --check
# passed
```

Notes:

- Temporal activity/workflow names stay stable as `sol.appointment_booking.*`.
- Manifest entry points now resolve through
  `appointment_booking.automation.activities` and
  `appointment_booking.automation.workflows`.
- Top-level `activities`, `workflows`, `reminders`, and `clinic_webhook_crm`
  modules are temporary compatibility shims for T06 cleanup.

## References

- Depends on: [T02](T02-booking-package-move.md)
- Milestone: [M41.0-appointment-booking-package-structure.md](../../milestones/M41.0-appointment-booking-package-structure.md)
