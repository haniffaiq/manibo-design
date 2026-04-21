# T01: Define Canonical Control-Plane Envelopes

> **Milestone**: M8-v2-voice-control-plane
> **Status**: Planning
> **Estimate**: M (2-4h)
> **Depends on**: None
> **Checklist Rows**: `docs/requirements/checklist.md:228-229,232-233` — active calls dashboard, live transcripts, operator-alert/control-plane projections, and historical/live event-contract continuity.

---

## Activation Guardrails

1. **Planning-only backlog** — do not implement until the active tracker explicitly activates M8
2. **Requirement-first** — replace the planning-only checklist placeholder with exact checklist row(s) before coding
3. **After activation: One Task = One Commit** — commit message: `feat: M8 T01 - define canonical control-plane envelopes`
4. **After activation: One Milestone = One PR** — reserved branch: `feat/M8-v2-voice-control-plane`
5. Update `docs/tasks/M8/PROGRESS.md` after completing

---

## Description

Define the typed event-envelope contract for the control plane. The repo already emits transcript segments and runtime events, but they are route-local payloads. This task creates the canonical envelope schema and mapping rules that every future realtime transport must share.

## Subtasks

- [x] **Create envelope types** in `packages/platform-core/src/platform_core/control_plane/envelopes.py`
- [x] **Define minimum shared fields**: envelope id, tenant/scope, topic, event type, sequence/cursor, occurred_at, correlation metadata, payload version
- [x] **Define current voice event mappings** for transcript events, call runtime events, manual-takeover state transitions, and operator-event/control-plane alert projections
- [x] **Add mapping helpers** from current `call_runtime_events` rows and transcript rows into canonical envelopes
- [x] **Document sequencing rules** for replay boundaries and ordering guarantees
- [x] **Add unit tests** for envelope validation and mapping

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/control_plane/envelopes.py` | Create | Canonical control-plane event envelope types and mapping helpers |
| `packages/platform-core/src/platform_core/control_plane/__init__.py` | Create | Export envelope types |
| `apps/api/src/platform_api/routes/calls.py` | Modify | Use canonical envelope mapping helpers where current SSE payloads are assembled |
| `apps/api/tests/integration/test_call_ops_stream.py` | Modify | Assert canonical envelope fields on live ops stream payloads |
| `apps/api/tests/integration/test_calls_transcript_stream.py` | Modify | Assert canonical transcript envelope fields |

## Implementation Notes

- Do not invent a massive schema versioning framework. One explicit `payload_schema_version` field is enough for v1.
- Reuse existing `seq` ordering where it already exists for `call_runtime_events`.
- Keep transcript and runtime-event payload specifics inside `payload`; do not flatten every business field into the outer envelope.
- This task defines the contract. It does not introduce WebSocket transport yet.

## Acceptance Criteria

- [x] Canonical envelope types exist in `platform_core.control_plane`
- [x] Current voice transcript and runtime-event payloads can be represented by the canonical envelope
- [x] Ordering/replay fields are defined explicitly, not implied by route-local behavior
- [x] Existing SSE routes can map into the envelope without breaking current semantics
- [x] `uv run pytest apps/api/tests/integration/test_call_ops_stream.py apps/api/tests/integration/test_calls_transcript_stream.py -q --tb=short` passes
- [x] If the implementation touches `apps/*/src/**`, `packages/*/src/**`, or `solutions/*/src/**`, the PR body includes `OTLP spans emitted: Yes` plus captured output from `tools/scripts/obs/traceql.sh`, `tools/scripts/obs/logql.sh`, and `tools/scripts/obs/promql.sh`

## References

- Milestone: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
- Related: [v2-architecture-implementation.md](../../milestones/exec-plans/v2_canonical_architecture_refresh.md)
