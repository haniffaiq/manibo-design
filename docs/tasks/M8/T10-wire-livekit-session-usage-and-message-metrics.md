# T10: Wire LiveKit Session Usage and Message Metrics

> **Milestone**: M8-v2-voice-control-plane
> **Status**: Complete
> **Estimate**: M (2-4h)
> **Depends on**: T09
> **Checklist Rows**: `docs/requirements/checklist.md:228-229` — preserve billing/observability continuity while adopting LiveKit 1.5.1 runtime reporting

---

## Description

Adopt the LiveKit 1.5.1 reporting surfaces without breaking the existing Manibo post-call rails. This task bridges `session_usage_updated` and `ChatMessage.metrics` into the current billing and latency contracts instead of replacing those contracts outright. The point is richer LiveKit data, not a dashboard regression.

## Subtasks

- [x] Capture LiveKit per-model session usage during the call lifecycle
- [x] Add typed workflow payloads for model-usage data
- [x] Translate `ChatMessage.metrics` into the existing turn-latency schema
- [x] Keep the deprecated `metrics_collected` bridge for runtime details still missing from per-message metrics
- [x] Centralize usage-event creation so inbound/outbound workflows stop duplicating partial billing logic
- [x] Persist serialized model-usage data in post-call metadata
- [x] Add focused tests for latency bridging, usage-record mapping, and post-call metadata

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/temporal/voice_call_workflow.py` | Modify | Add typed model-usage payloads to workflow signals/results |
| `packages/grove/src/grove/temporal/inbound_call_workflow.py` | Modify | Carry typed model-usage payloads through inbound results |
| `packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py` | Modify | Capture `session_usage_updated` and `conversation_item_added` metrics |
| `packages/grove-voice-livekit/src/grove_voice_livekit/voice_latency_collector.py` | Modify | Bridge LiveKit `ChatMessage.metrics` into current latency fields |
| `apps/temporal-worker/src/temporal_worker/workflows/voice_usage.py` | Create | Shared usage-record builder for inbound and outbound workflows |
| `apps/temporal-worker/src/temporal_worker/workflows/call_with_retry.py` | Modify | Use shared usage builder and persist model-usage metadata |
| `apps/temporal-worker/src/temporal_worker/workflows/inbound_call_orchestrator.py` | Modify | Use shared usage builder and persist model-usage metadata |
| `apps/temporal-worker/tests/unit/test_voice_usage.py` | Create | Verify billing fallback and per-model mapping |

## Acceptance Criteria

- [x] LiveKit `session_usage_updated` data is captured and propagated through workflow completion payloads
- [x] Existing billing event types stay intact while per-model metadata is added when available
- [x] Existing post-call latency fields keep working while LiveKit `ChatMessage.metrics` is adopted
- [x] Post-call metadata includes serialized `voice_model_usages` when present
- [x] Focused workflow/runtime tests pass

## Verification

```bash
uv run python -m pytest --import-mode=importlib \
  packages/grove-voice-livekit/tests/unit/test_voice_latency_collector.py \
  apps/temporal-worker/tests/unit/test_voice_usage.py \
  apps/temporal-worker/tests/unit/test_call_with_retry.py \
  apps/temporal-worker/tests/unit/test_inbound_call_orchestrator_clinic_metadata.py \
  apps/temporal-worker/tests/unit/test_inbound_call_orchestrator_budget.py \
  packages/grove/tests/unit/temporal/test_voice_call_workflow.py \
  packages/grove/tests/unit/temporal/test_inbound_call_workflow.py \
  -q --tb=short
```

## References

- Milestone: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
