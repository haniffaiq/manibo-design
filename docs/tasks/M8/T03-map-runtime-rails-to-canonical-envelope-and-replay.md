# T03: Map Runtime Rails to Canonical Envelope and Replay

> **Milestone**: M8-v2-voice-control-plane
> **Status**: Planning
> **Estimate**: M (2-4h)
> **Depends on**: T01
> **Checklist Rows**: `docs/requirements/checklist.md:228-229,233` — active calls dashboard, live transcripts, and historical/live event-contract continuity.

---

## Activation Guardrails

1. **Planning-only backlog** — do not implement until the active tracker explicitly activates M8
2. **Requirement-first** — replace the planning-only checklist placeholder with exact checklist row(s) before coding
3. **After activation: One Task = One Commit** — commit message: `feat: M8 T03 - map runtime rails to canonical envelope and replay`
4. **After activation: One Milestone = One PR** — reserved branch: `feat/M8-v2-voice-control-plane`
5. Update `docs/tasks/M8/PROGRESS.md` after completing

---

## Description

Converge the existing persisted runtime-event rails onto the canonical control-plane envelope and replay semantics. The repo already has `call_runtime_events` plus `after_seq` replay on SSE. This task formalizes that into the control-plane contract instead of leaving replay as route-local behavior.

## Subtasks

- [x] **Map `call_runtime_events` rows** into canonical event envelopes
- [x] **Map transcript stream rows** into canonical envelopes with compatible cursor semantics
- [x] **Standardize replay semantics** for `after_seq` and cursor boundaries
- [x] **Ensure ordering rules are explicit** across transcript and runtime-event rails
- [x] **Update SSE tests** to assert replay works through canonical envelope mapping
- [x] **Document bridge rules** from current rails to future control-plane transport

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/calls/history_service.py` | Modify | Support canonical replay/mapping helpers where needed |
| `apps/api/src/platform_api/routes/calls.py` | Modify | Project existing replayable rails through canonical envelope semantics |
| `apps/api/tests/integration/test_call_ops_stream.py` | Modify | Replay assertions on canonical runtime-event envelope |
| `apps/api/tests/integration/test_calls_transcript_stream.py` | Modify | Replay assertions on canonical transcript envelope |

## Implementation Notes

- Do not collapse transcript and runtime-event storage into one table in this task. That would be speculative churn.
- The goal is semantic convergence, not schema overreach.
- Preserve current `after_seq` behavior while clarifying what counts as a cursor boundary for future transports.
- This is the safest reuse point: exploit the repo’s existing persisted rails instead of inventing a second outbox first.

## Acceptance Criteria

- [x] Existing runtime-event and transcript replay semantics are defined in one canonical mapping layer
- [x] `after_seq` continues to work without regression
- [x] Canonical envelopes emitted from replayable SSE streams preserve ordering guarantees
- [x] `uv run pytest apps/api/tests/integration/test_call_ops_stream.py apps/api/tests/integration/test_calls_transcript_stream.py -q --tb=short` passes
- [x] If the implementation touches `apps/*/src/**`, `packages/*/src/**`, or `solutions/*/src/**`, the PR body includes `OTLP spans emitted: Yes` plus captured output from `tools/scripts/obs/traceql.sh`, `tools/scripts/obs/logql.sh`, and `tools/scripts/obs/promql.sh`

## References

- Milestone: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
- Related: [T01-define-canonical-control-plane-envelopes.md](./T01-define-canonical-control-plane-envelopes.md)
