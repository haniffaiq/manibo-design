# T10: Add route topology guards and prove inventory stability

> **Milestone**: M36-platform-api-route-topology-phase1
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T02, T03, T04, T05, T06, T08, T09

---

## Description

Finish phase 1 by adding a dedicated topology guard and proving the regroup did not change the published API surface. This task is where the milestone becomes enforceable instead of depending on documentation alone.

## Subtasks

- [x] **Add a topology architecture test**: create `tests/architecture/test_platform_api_route_topology.py` that asserts the allowed domain packages and the explicit `health.py` exception.
- [x] **Assert shim thinness where practical**: verify that top-level compatibility files for grouped domains are shims, not places where new logic keeps growing.
- [x] **Prove API inventory stability**: run the API inventory checks and update generated artifacts only if they changed for an intentional, documented reason.
- [x] **Retain existing main-wiring proof**: keep `test_admin_agents_main_wiring.py`, `test_api_inventory_contract.py`, and `test_m8_2_refactor_guards.py` green after the regroup.
- [x] **Capture deferred cleanup explicitly**: if any odd flat file survives beyond `health.py`, document it as an intentional temporary exception instead of silently accepting drift.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tests/architecture/test_platform_api_route_topology.py` | Create | Enforce the approved package topology and explicit flat-file exceptions |
| `tests/architecture/test_api_inventory_contract.py` | Modify selectively | Keep inventory proof aligned with the regroup if needed |
| `tests/architecture/test_admin_agents_main_wiring.py` | Modify selectively | Preserve main-wiring proof if import paths changed underneath |
| `tests/architecture/test_m8_2_refactor_guards.py` | Modify selectively | Preserve existing refactor-hardening assertions if helper paths moved |
| `docs/arch/generated/api_inventory.md` | Modify only if intentional drift exists | Regenerated artifact if the inventory script requires a sync |
| `docs/arch/generated/system_graph.mmd` | Modify only if intentional drift exists | Regenerated artifact if the inventory tooling updates the system graph |

## Implementation Notes

- Planning-only task. Do not execute until the human explicitly activates M36.
- `health.py` is the only flat-file exception that should survive phase 1 without extra approval.
- The guard should enforce structure without hardcoding every individual filename more than necessary. Prefer explicit allowed package families plus a short exception list.
- Do not use this task to delete shims. Phase 1 still depends on compatibility.
- If `check_api_inventory.py` reports drift, treat that as a review gate. Do not hand-wave it away.

## Acceptance Criteria

- [x] A dedicated architecture test enforces the approved route topology and explicit flat-file exceptions.
- [x] Existing main-wiring and refactor-hardening tests remain green after the regroup.
- [x] API inventory proof confirms no accidental surface drift from the phase-1 move.
- [x] Any temporary exceptions beyond `health.py` are documented explicitly instead of left implicit.

## Verification

```bash
uv run ruff check \
  tests/architecture/test_platform_api_route_topology.py \
  tests/architecture/test_admin_agents_main_wiring.py \
  tests/architecture/test_api_inventory_contract.py \
  tests/architecture/test_m8_2_refactor_guards.py

uv run pyright tests/architecture/test_platform_api_route_topology.py

uv run pytest \
  tests/architecture/test_platform_api_route_topology.py \
  tests/architecture/test_admin_agents_main_wiring.py \
  tests/architecture/test_api_inventory_contract.py \
  tests/architecture/test_m8_2_refactor_guards.py \
  apps/api/tests \
  -q --tb=short

uv run python tools/scripts/generate_api_inventory.py

uv run python tools/scripts/check_api_inventory.py
```

## References

- Milestone: [M36-platform-api-route-topology-phase1.md](../../milestones/M36-platform-api-route-topology-phase1.md)
- Design: `wiki/queries/2026-04-11-design-platform-api-route-topology-refactor.md`
