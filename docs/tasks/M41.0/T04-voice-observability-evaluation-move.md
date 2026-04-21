# T04: Voice Observability And Evaluation Move

> **Milestone**: M41.0-appointment-booking-package-structure
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T03

---

## Description

Move voice profile/rehearsal/template code, observability helpers, and eval
support into their target capability packages.

## Subtasks

- [x] **Create voice package**: move agent profile, template, and rehearsal
      helpers into `appointment_booking.voice`.
- [x] **Create observability package**: move solution observability projection
      helpers under `appointment_booking.observability`.
- [x] **Create evaluation package**: move eval helpers under
      `appointment_booking.evaluation`.
- [x] **Update tests and references**: move imports to the new package paths.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/appointment_booking/src/appointment_booking/voice/__init__.py` | Create | Voice package export surface |
| `solutions/appointment_booking/src/appointment_booking/voice/agent_profiles.py` | Move | Former `agent_profiles.py` |
| `solutions/appointment_booking/src/appointment_booking/voice/agent_template.py` | Move | Former `agent_template.py` |
| `solutions/appointment_booking/src/appointment_booking/voice/rehearsal.py` | Move | Former `voice_rehearsal.py` |
| `solutions/appointment_booking/src/appointment_booking/observability/__init__.py` | Create | Observability package export surface |
| `solutions/appointment_booking/src/appointment_booking/observability/service.py` | Move | Former `observability.py` |
| `solutions/appointment_booking/src/appointment_booking/evaluation/__init__.py` | Create | Evaluation package export surface |
| `solutions/appointment_booking/src/appointment_booking/evaluation/eval_support.py` | Move | Former `eval_support.py` |

## Implementation Notes

- Preserve existing clinic-registration starter behavior.
- Keep compatibility shims only when needed until T06.
- No UI changes belong in this task.

## Acceptance Criteria

- [x] Existing voice rehearsal tests pass.
- [x] Existing eval support tests pass.
- [x] Manifest starter tests still pass.
- [x] No existing clinic-registration defaults change.

## Evidence

2026-04-20:

```bash
uv run pytest solutions/appointment_booking/tests/unit/test_voice_rehearsal.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py solutions/appointment_booking/tests/unit/test_eval_support.py solutions/appointment_booking/tests/unit/test_appointment_booking.py -q
# 73 passed

uv run pytest solutions/appointment_booking/tests/api_integration/test_clinic_browser_session.py -q
# 2 passed

uv run pytest solutions/appointment_booking/tests/integration/test_clinic_registration_runtime_plugin_tools.py -q
# 1 passed

uv run pyright solutions/appointment_booking/src/appointment_booking/voice solutions/appointment_booking/src/appointment_booking/observability solutions/appointment_booking/src/appointment_booking/evaluation solutions/appointment_booking/src/appointment_booking/manifest.py tools/scripts/run_clinic_voice_room_smoke.py tools/scripts/run_clinic_booking_two_agent_monitor.py
# 0 errors

uv run ruff check solutions/appointment_booking/src/appointment_booking/voice solutions/appointment_booking/src/appointment_booking/observability solutions/appointment_booking/src/appointment_booking/evaluation solutions/appointment_booking/tests/unit/test_voice_rehearsal.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py solutions/appointment_booking/tests/unit/test_eval_support.py solutions/appointment_booking/tests/unit/test_appointment_booking.py solutions/appointment_booking/tests/api_integration/test_clinic_browser_session.py solutions/appointment_booking/tests/integration/test_clinic_registration_runtime_plugin_tools.py tools/scripts/run_clinic_voice_room_smoke.py tools/scripts/run_clinic_booking_two_agent_monitor.py
# All checks passed

uv run python -c "from appointment_booking.manifest import manifest; print(manifest.agent_template); from appointment_booking.voice.agent_profiles import clinic_registration_agent_base_config_path; print(clinic_registration_agent_base_config_path().name); from appointment_booking.voice.rehearsal import build_clinic_browser_room_name; print(build_clinic_browser_room_name(conversation_id='conv_123')); from appointment_booking.observability import build_appointment_booking_observability_enricher; from appointment_booking.evaluation.eval_support import validate_required_tool_chain; print(build_appointment_booking_observability_enricher.__name__, validate_required_tool_chain([]))"
# appointment_booking.voice.agent_template:template
# clinic_registration_agent.yaml
# clinic-browser-conv_123
# build_appointment_booking_observability_enricher Missing or out-of-order required tool: search_clinic_booking_options

rg -n "from appointment_booking\.(agent_profiles|agent_template|voice_rehearsal|eval_support)|appointment_booking\.(agent_profiles|agent_template|voice_rehearsal|eval_support)" solutions/appointment_booking/src solutions/appointment_booking/tests tools/scripts/run_clinic_voice_room_smoke.py tools/scripts/run_clinic_booking_two_agent_monitor.py -S
# no matches

uv run pytest packages/grove/tests/unit/architecture/test_doc_integrity.py -q --tb=short
# 10 passed

git diff --check
# passed
```

Notes:

- `appointment_booking.observability` remains importable as the platform
  loader target and re-exports the builder from
  `appointment_booking.observability.service`.
- The voice config path resolver was adjusted for the deeper
  `appointment_booking.voice.agent_profiles` module path.
- Top-level voice and eval compatibility shims remain for T06 cleanup.

## References

- Depends on: [T03](T03-automation-crm-handoff-move.md)
- Milestone: [M41.0-appointment-booking-package-structure.md](../../milestones/M41.0-appointment-booking-package-structure.md)
