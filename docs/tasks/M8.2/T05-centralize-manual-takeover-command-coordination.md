# T05: Centralize Manual Takeover Coordination Across Workflow Paths

> **Milestone**: M8.2-control-plane-refactor-hardening
> **Status**: Completed
> **Estimate**: L (4-8h)
> **Depends on**: T01, T04
> **Execution**: Completed on 2026-03-30 as its own task commit on milestone branch `feat/M8.2-control-plane-refactor-hardening`.
> **Checklist Rows**: `docs/requirements/checklist.md:228-233` — manual takeover continuity and historical/live event truth depend on this lifecycle staying durable and reviewable.

---

## Activation Guardrails

1. **Activation satisfied** — M8.2/T05 was explicitly continued by the human on 2026-03-30
2. **Requirement-first** — revalidate checklist rows `228-233` before coding; do not widen command scope beyond manual takeover without a new contract
3. **After activation: One Task = One Commit** — commit message: `feat: M8.2 T05 - centralize manual takeover coordination`
4. **Active branch** — `feat/M8.2-control-plane-refactor-hardening`
5. Update `docs/tasks/M8.2/PROGRESS.md` after completing

---

## Description

M8 is the prerequisite for this milestone, so M8.2 assumes the write-ahead manual-takeover command model already exists. T05 is the follow-on hardening cut: move the remaining workflow-target resolution, inbound-orchestrator branching, and terminal bookkeeping behind one persisted coordinator so the route stops choreographing signals and audits directly.

## Subtasks

- [x] Introduce a manual-takeover coordinator/service that owns persisted command creation, workflow target resolution, and dispatch policy
- [x] Preserve the supported inbound-orchestrator takeover path inside that persisted coordinator flow
- [x] Remove any remaining route-local direct-signal choreography now that the M8 durable-command contract exists
- [x] Route terminal command state updates through one workflow-side completion/failure path
- [x] Remove duplicated audit/lifecycle bookkeeping where possible and extend takeover integration coverage

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/control_plane/manual_takeover.py` | Create | Shared takeover coordination and workflow-dispatch policy under the control-plane authority |
| `apps/api/src/platform_api/routes/call_takeover.py` | Modify | Reduce the takeover routes to auth/input normalization plus persisted coordinator calls |
| `packages/grove/src/grove/temporal/voice_call_workflow.py` | Modify | Emit generic workflow terminal status/events the app/control-plane coordinator can consume |
| `packages/grove/src/grove/temporal/inbound_call_workflow.py` | Modify | Reuse the same generic terminal status/event path and preserve orchestrator resolution behavior |
| `apps/api/tests/integration/test_calls.py` | Modify | Extend the existing takeover coverage for voice-workflow and inbound-orchestrator coordinator behavior |

## Implementation Notes

- Do not reintroduce immediate `completed` state on signal acceptance. The workflow still owns terminal truth.
- M8 is assumed to have landed the write-ahead command model first. This task should not preserve a route-local direct-signal fallback once that prerequisite exists.
- Preserve the currently supported inbound-orchestrator lookup behavior unless a new requirement explicitly changes that contract.
- Grove workflows must not import `platform_core`, and they should not grow a takeover-specific control-plane type. Keep workflow output generic and adapt it at the app/control-plane edge.
- Audit emission should follow the same ownership boundary as command state transitions, not live in multiple unrelated helpers.

## Current Plan

1. Create `packages/platform-core/src/platform_core/control_plane/manual_takeover.py` as the shared coordinator that owns command creation, workflow target resolution, dispatch, and request-audit emission.
2. Reduce `apps/api/src/platform_api/routes/call_takeover.py` to auth/access normalization plus a coordinator call for both takeover endpoints.
3. Extend `packages/grove/src/grove/temporal/live_call_runtime_state.py` with shared manual-takeover failure bookkeeping so both workflows use one success/failure helper path.
4. Preserve the inbound child-workflow path and keep the UUID-only persistence limitation explicit instead of letting the route hide it.
5. Add focused integration and workflow lifecycle coverage for the coordinator boundary and the unchanged terminal-truth contract.

## Outcome

1. `packages/platform-core/src/platform_core/control_plane/manual_takeover.py` now owns command creation, lifecycle entry transitions, workflow dispatch policy, and request-audit emission for both takeover endpoints.
2. `apps/api/src/platform_api/routes/call_takeover.py` is now a thin adapter over that coordinator plus tenant access checks.
3. `packages/grove/src/grove/temporal/live_call_runtime_state.py` now owns both success and failure terminal bookkeeping helpers, and both workflows reuse the same failure-side command/audit path.
4. The UUID-only persistence limitation stays explicit: non-UUID active call IDs still use the coordinator boundary, but they do not fabricate persisted command rows the schema cannot support.
5. Integration coverage now proves both `/takeover` and `/terminate-transfer` share the same coordinator behavior for UUID call IDs, while workflow lifecycle tests still prove terminal truth remains workflow-owned.

## Acceptance Criteria

- [x] HTTP takeover routes stop owning workflow target resolution and dispatch choreography
- [x] Voice-workflow and inbound-orchestrator takeover paths are covered by integration tests
- [x] Workflow success/failure paths surface one generic terminal status/event path that the coordinator maps into audit/command truth
- [x] Every manual takeover request flows through the persisted command/coordinator path before workflow dispatch
- [x] Manual takeover regressions are easier to review because lifecycle ownership is singular

## Verification Evidence

```bash
uv run ruff check apps/api/src/platform_api/routes/call_takeover.py apps/api/tests/integration/test_calls_takeover.py packages/platform-core/src/platform_core/control_plane/manual_takeover.py packages/platform-core/src/platform_core/control_plane/__init__.py packages/grove/src/grove/temporal/live_call_runtime_state.py packages/grove/src/grove/temporal/voice_call_workflow.py packages/grove/src/grove/temporal/inbound_call_workflow.py
uv run ruff format apps/api/src/platform_api/routes/call_takeover.py apps/api/tests/integration/test_calls_takeover.py packages/platform-core/src/platform_core/control_plane/manual_takeover.py packages/platform-core/src/platform_core/control_plane/__init__.py packages/grove/src/grove/temporal/live_call_runtime_state.py packages/grove/src/grove/temporal/voice_call_workflow.py packages/grove/src/grove/temporal/inbound_call_workflow.py --check
uv run pyright -p pyrightconfig.ci.json
uv run pytest apps/api/tests/integration/test_calls_takeover.py apps/api/tests/integration/test_calls.py packages/grove/tests/unit/temporal/test_manual_takeover_workflow_lifecycle.py -q --tb=short
```

Expected results recorded on 2026-03-30:

- Ruff check: passed
- Ruff format `--check` on Python files: passed
- Pyright: `0 errors, 0 warnings, 0 informations`
- Pytest: `27 passed`

## References

- Milestone: [M8.2-control-plane-refactor-hardening.md](../../milestones/M8.2-control-plane-refactor-hardening.md)
- Related: [T01-extract-shared-live-call-workflow-runtime-core.md](./T01-extract-shared-live-call-workflow-runtime-core.md)
