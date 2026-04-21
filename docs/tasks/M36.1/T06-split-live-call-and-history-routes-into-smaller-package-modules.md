# T06: Split live call and history routes into smaller package modules

> **Milestone**: M36.1-platform-api-route-entropy-phase2
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T04

---

## Description

Shrink the main runtime-heavy call-ops surfaces after the shared dependency work
lands. `calls_live.py` is over 600 LOC and `calls_history.py` still mixes
schemas, transcript shaping, and route wiring. This task decomposes those files
without changing the API surface.

## Subtasks

- [ ] **Split live-call schemas and orchestration**: move models and Temporal /
      LiveKit detail assembly out of `calls_live.py`.
- [ ] **Split history schemas and transcript helpers**: move response models and
      transcript/quality helpers out of `calls_history.py`.
- [ ] **Reduce route files**: keep route registration and endpoint functions in
      the router files, targeting sub-500 LOC for `calls_live.py`.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/call_ops/calls_live.py` | Modify | Thin route file after extracting models and orchestration helpers. |
| `apps/api/src/platform_api/routes/call_ops/calls_live_runtime.py` | Create | Active-call query and room/detail assembly helpers. |
| `apps/api/src/platform_api/routes/call_ops/calls_history.py` | Modify | Thin route file after extracting models and transcript logic. |
| `apps/api/src/platform_api/routes/call_ops/calls_history_models.py` | Create | History response models and transcript-related shapes. |
| `apps/api/tests/...` | Modify | Update tests that import or patch moved live-call/history helpers. |

## Implementation Notes

- If `calls_observability.py` can consume shared models from T04 instead of
  keeping private duplicates, do that instead of inventing a third copy.
- Keep the route factory names unchanged.
- Do not mix this task with browser voice changes; that belongs in T05.
- 2026-04-14 follow-up from the stale-live-call hardening PR:
  - terminal runtime events must veto lingering LiveKit room participants
    instead of letting non-empty rooms resurrect completed calls
  - point lookups like `/calls/{call_id}/livekit-token`, takeover, and
    terminate-transfer must not reuse a capped `/calls/active` collection scan;
    exact-call resolution has to keep searching until the requested workflow is
    found or the tenant scope is exhausted
  - when runtime snapshots and events are absent, room-name-only evidence from
    the selected workflow still has to reach the LiveKit participant check;
    otherwise live sibling workflows disappear even though the room is active
  - fail-open room-name query outages must increment the same degraded-mode
    verification metric/alert path as snapshot, events, and LiveKit participant
    verification failures
  - once point-route gating selects the live sibling workflow, takeover /
    terminate-transfer must carry that exact `workflow_id` into the coordinator
    instead of re-deriving from the bare `call_id`
  - when multiple running workflows share one `call_id`, detail routes must not
    trust the call-level snapshot fast path because the snapshot row is not
    workflow-scoped and can leak stale sibling `room_name` / `call_state`
  - the same sibling rule applies to terminal call-level snapshot vetoes: when
    sibling disambiguation disables call-level proof, a stale
    `call_runtime_snapshots` row with `completed` / `error` must not suppress a
    newer live sibling before workflow-scoped snapshot and event evidence runs
  - degraded verification is acceptable for operator visibility, but takeover /
    terminate-transfer retry resolution must require positive liveness evidence
    instead of fail-open sibling selection
  - large live-call integration regressions belong in focused companion test
    modules, not as continued growth of already-near-limit files

## Acceptance Criteria

- [ ] `call_ops/calls_live.py` is below 500 LOC.
- [ ] Live-call and history route files no longer define large inline schema
      clusters.
- [ ] Focused live-call/history API tests remain green.

## References

- Milestone: [M36.1-platform-api-route-entropy-phase2.md](../../milestones/M36.1-platform-api-route-entropy-phase2.md)
- Depends on: [T04-extract-call-ops-dependencies-and-presenters-and-delete-duplicate-helpers.md](T04-extract-call-ops-dependencies-and-presenters-and-delete-duplicate-helpers.md)
