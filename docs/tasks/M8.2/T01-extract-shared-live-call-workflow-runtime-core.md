# T01: Extract Shared Live-Call Workflow Runtime Core

> **Milestone**: M8.2-control-plane-refactor-hardening
> **Status**: Completed
> **Estimate**: L (4-8h)
> **Depends on**: None
> **Execution**: Completed on 2026-03-30 on branch `feat/M8.2-T01-shared-live-call-runtime-core`.
> **Checklist Rows**: `docs/requirements/checklist.md:228-233` — call monitoring, transcripts, observe/takeover continuity, alerts, and historical/live event-contract continuity depend on these workflows staying behaviorally aligned.

---

## Activation Guardrails

1. **Activation satisfied** — M8.2/T01 was explicitly activated by the human on 2026-03-30
2. **Requirement-first** — revalidate checklist rows `228-233` before coding; if scope widens, update the task contract first
3. **After activation: One Task = One Commit** — commit message: `feat: M8.2 T01 - extract shared live-call workflow runtime core`
4. **Active branch** — `feat/M8.2-T01-shared-live-call-runtime-core`
5. Update `docs/tasks/M8.2/PROGRESS.md` after completing

---

## Description

`VoiceCallWorkflow` and `InboundCallWorkflow` both own the same live-call runtime mechanics: buffering transcript segments, appending live events, projecting runtime snapshots, persisting pending rows, and handling manual-takeover terminal bookkeeping. That duplication is why every M8 fix had to be threaded through two workflows. Extract the shared runtime state and persistence helpers into a boring, deterministic module so both workflows orchestrate the same behavior instead of reimplementing it.

## Subtasks

- [x] Activate milestone/task tracking for implementation on 2026-03-30
- [x] Create a shared live-call runtime state/helper module under `packages/grove/src/grove/temporal/`
- [x] Move duplicated event-buffer, snapshot-shaping, and persistence helpers out of both workflow files
- [x] Reuse the shared helper from outbound and inbound workflows without inheritance
- [x] Keep existing query/signal contracts unchanged
- [x] Add or update tests to prove parity for both workflow types

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/temporal/live_call_runtime_state.py` | Create | Shared runtime-state and persistence helpers for live voice workflows |
| `packages/grove/src/grove/temporal/voice_call_workflow.py` | Modify | Reduce to outbound orchestration over the shared runtime core |
| `packages/grove/src/grove/temporal/inbound_call_workflow.py` | Modify | Reduce to inbound orchestration over the shared runtime core |
| `packages/grove/tests/unit/temporal/test_voice_call_workflow.py` | Modify | Verify outbound workflow behavior remains unchanged |
| `packages/grove/tests/unit/temporal/test_inbound_call_workflow.py` | Modify | Verify inbound workflow behavior remains unchanged |

## Implementation Notes

- Do not use workflow inheritance. Keep the shared logic as plain helpers/dataclasses that Temporal workflows call explicitly.
- Preserve existing signal/query names and persisted payload shapes. This is a refactor, not a contract change.
- The shared module should own state transitions and snapshot/event item construction, not business decisions about inbound vs outbound call setup.

## Acceptance Criteria

- [x] Duplicate live-event and runtime-snapshot helper code is removed from the two workflow modules
- [x] Outbound and inbound workflows still expose the same queries/signals
- [x] Existing workflow tests pass without contract regressions
- [x] File size of both workflow modules is materially reduced

## Completion Notes

- Added `packages/grove/src/grove/temporal/live_call_runtime_state.py` as the shared deterministic runtime-state core for both workflows.
- Kept workflow-specific differences explicit: outbound workflow ID fallback, tenant-schema patch handling, direction, retry policy, and room-name fallback remain in the workflow files.
- Shared manual-takeover success bookkeeping moved out of `voice_call_workflow.py` so both workflows depend on the same Grove-owned helper.
- Added direct unit coverage in `packages/grove/tests/unit/temporal/test_live_call_runtime_state.py` and kept the existing workflow and takeover lifecycle tests green.

## References

- Milestone: [M8.2-control-plane-refactor-hardening.md](../../milestones/M8.2-control-plane-refactor-hardening.md)
- Related: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
