# T05: Keep SSE Parity on Canonical Envelope

> **Milestone**: M8-v2-voice-control-plane
> **Status**: Complete
> **Estimate**: M (2-4h)
> **Depends on**: T01, T03
> **Checklist Rows**: `docs/requirements/checklist.md:228-229,233` — active calls dashboard, live transcripts, and historical/live event-contract continuity.

---

## Activation Guardrails

1. **Planning-only backlog** — do not implement until the active tracker explicitly activates M8
2. **Requirement-first** — replace the planning-only checklist placeholder with exact checklist row(s) before coding
3. **After activation: One Task = One Commit** — commit message: `feat: M8 T05 - keep sse parity on canonical envelope`
4. **After activation: One Milestone = One PR** — reserved branch: `feat/M8-v2-voice-control-plane`
5. Update `docs/tasks/M8/PROGRESS.md` after completing

---

## Description

Preserve the working SSE bridge while moving it onto canonical control-plane semantics. The repo already uses SSE heavily. This task keeps that migration path honest instead of forcing every consumer onto WebSocket at once.

## Subtasks

- [x] **Update transcript SSE projection** to emit canonical envelope semantics
- [x] **Update ops SSE projection** to emit canonical envelope semantics
- [x] **Document the bridge rule**: SSE is a read-only projection of the same contract as WebSocket
- [x] **Keep current reconnect/replay behavior** intact for existing consumers
- [x] **Add regression coverage** so old SSE consumers continue to work during the migration window

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/calls.py` | Modify | Align transcript and ops SSE payload semantics with the canonical envelope |
| `apps/api/tests/integration/test_call_ops_stream.py` | Modify | Assert SSE parity with canonical envelope |
| `apps/api/tests/integration/test_calls_transcript_stream.py` | Modify | Assert transcript SSE parity with canonical envelope |
| `docs/milestones/M8-v2-voice-control-plane.md` | Modify | Keep migration wording aligned if implementation forces minor contract adjustments |

## Implementation Notes

- SSE remains read-only. Do not add command submission through SSE.
- The point is parity, not transport perfection.
- Preserve current endpoint shapes if possible so frontend migration can happen incrementally.

## Acceptance Criteria

- [x] Existing SSE endpoints still function
- [x] SSE payloads align with canonical control-plane semantics
- [x] Replay and keepalive behavior are unchanged for current clients
- [x] `uv run pytest apps/api/tests/integration/test_call_ops_stream.py apps/api/tests/integration/test_calls_transcript_stream.py packages/platform-core/tests/unit/test_control_plane/test_envelopes.py -q --tb=short` passes
- [x] If the implementation touches `apps/*/src/**`, `packages/*/src/**`, or `solutions/*/src/**`, the PR body includes `OTLP spans emitted: Yes` plus captured output from `tools/scripts/obs/traceql.sh`, `tools/scripts/obs/logql.sh`, and `tools/scripts/obs/promql.sh`

## References

- Milestone: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
- Related: [T04-add-authenticated-control-plane-websocket-endpoint.md](./T04-add-authenticated-control-plane-websocket-endpoint.md)
