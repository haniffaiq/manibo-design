# T02: Telnyx evaluation adapter

> **Milestone**: M13.1-telephony-autonomous-evaluation
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T01

## Description

Add the first provider-owned evaluation adapter for Telnyx. The shared adapter protocol stays in `platform-core`, while the Telnyx implementation lives in `solutions/provider_telnyx` alongside the existing Telnyx telephony integration. The adapter owns call creation, webhook normalization for evaluation runs, media-stream session lifecycle, and the provider-specific correlation fields needed by the evaluation service.

## Subtasks

- [ ] Define the Telnyx adapter interface and implementation
- [ ] Normalize Telnyx call/webhook/media identifiers into evaluation-run correlation fields
- [ ] Keep provider-specific behavior isolated from scoring logic

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/telephony/evaluation/provider_protocol.py` | Create | Narrow adapter contract |
| `solutions/provider_telnyx/src/provider_telnyx/telephony_evaluation_adapter.py` | Create | Telnyx control-plane adapter |
| `solutions/provider_telnyx/src/provider_telnyx/telephony_evaluation_events.py` | Create | Webhook/event normalization |
| `solutions/provider_telnyx/src/provider_telnyx/telephony_evaluation_media.py` | Create | Media-session helpers |
| `solutions/provider_telnyx/tests/unit/test_telephony_evaluation_adapter.py` | Create | Adapter contract proof |

## Acceptance Criteria

- [ ] Telnyx adapter can launch an evaluation call and return provider correlation ids
- [ ] Telnyx event normalization does not leak raw provider payloads through the rest of the framework
- [ ] Provider logic remains isolated from scoring logic
