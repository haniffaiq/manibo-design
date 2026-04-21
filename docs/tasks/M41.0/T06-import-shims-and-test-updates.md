# T06: Import Shims And Test Updates

> **Milestone**: M41.0-appointment-booking-package-structure
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T05

---

## Description

Update remaining internal imports and tests to use the new capability-owned
module paths, then remove temporary top-level compatibility shims when possible.

## Subtasks

- [x] **Update tests**: move solution tests to new import paths except for
      intentional shim tests.
- [x] **Update app/platform callers**: update external callers to stable new
      paths where appropriate.
- [x] **Remove stale shims**: delete unnecessary top-level re-export modules.
- [x] **Document remaining shims**: any kept shim names its removal target.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/appointment_booking/tests/**` | Modify | Use capability-owned imports |
| `apps/temporal-worker/tests/unit/test_inbound_call_orchestrator_budget.py` | Modify | Update workflow import path if moved |
| `packages/platform-core/tests/unit/test_e2e_fixture_contracts.py` | Modify | Update schema import path if moved |
| `solutions/appointment_booking/src/appointment_booking/*.py` | Modify/Delete | Remove or document temporary shims |

## Implementation Notes

- The milestone acceptance criterion prefers no top-level compatibility shims.
  Keep one only if removing it would make this PR too noisy.
- Do not silence failing imports with broad `try/except` or dynamic import
  tricks.

## Acceptance Criteria

- [x] Tests import new capability-owned paths directly.
- [x] Any remaining top-level shim is tiny, tested, and documented with a
      removal target.
- [x] `rg -n "from appointment_booking\\.(api|tools|booking_state|schemas|scheduling|knowledge_base|workflows|activities|reminders|agent_profiles|voice_rehearsal|eval_support)"` has no accidental callers.
- [x] Scoped solution tests still pass.

## Verification Evidence

- `rg -n "from appointment_booking\\.(api|tools|booking_state|schemas|scheduling|knowledge_base|workflows|activities|reminders|agent_profiles|voice_rehearsal|eval_support)" solutions apps packages tests -S` — no matches.
- `uv run pytest solutions/appointment_booking/tests/unit/ -q` — 94 passed.
- `uv run pytest solutions/appointment_booking/tests/integration/ -q` — 12 passed.
- `uv run pytest solutions/appointment_booking/tests/api_integration/ -q` — 21 passed.
- `uv run pytest apps/temporal-worker/tests/unit/test_inbound_call_orchestrator_budget.py packages/platform-core/tests/unit/test_e2e_fixture_contracts.py -q` — 9 passed.
- `uv run pytest tests/architecture/test_repo_file_size.py tests/architecture/test_app_layer_boundaries.py tests/architecture/test_solution_isolation.py -q` — 16 passed.
- `uv run pyright solutions/appointment_booking/src/ apps/api/src/platform_api/routes/appointment_booking` — 0 errors.
- `uv run ruff check ...` on touched solution/app/test files — passed.

## GC Result

- Removed all temporary top-level `appointment_booking.*` compatibility shims.
- Kept no top-level shims.
- Split `appointment_booking.booking.tools` into category modules so final
  file-size verification no longer requires an allowlist change.

## References

- Depends on: [T05](T05-api-route-surface-isolation.md)
- Milestone: [M41.0-appointment-booking-package-structure.md](../../milestones/M41.0-appointment-booking-package-structure.md)
