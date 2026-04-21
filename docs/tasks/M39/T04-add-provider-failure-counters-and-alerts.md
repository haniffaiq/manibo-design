# T04: Add Provider Failure Counters And Alerts

> **Milestone**: M39-nfq-gcp-observability-hardening
> **Status**: In Progress
> **Estimate**: M (2-4h)
> **Depends on**: M38, T03

---

## Description

Add first-class runtime counters for LLM, STT, and TTS provider failures so
NFQ GCP alerting can page on direct provider degradation instead of inferring
it from second-order symptoms.

## Subtasks

- [x] **Metric design**: define a small, stable provider-failure metric set for
      LLM, STT, and TTS failures with provider labels that are safe to alert on.
- [x] **Runtime emission**: increment those counters in the runtime paths that
      already classify provider failures.
- [x] **Alert policies**: extend the internal-safe observability Terraform with
      provider degradation alerts based on the new counters.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove-voice-livekit/src/grove_voice_livekit/live_metrics.py` | Modify | Add live voice provider failure counters |
| `packages/grove-voice-livekit/src/grove_voice_livekit/config_mapper.py` | Modify | Emit STT/TTS provider initialization failures |
| `packages/grove-voice-livekit/src/grove_voice_livekit/grove_voice_agent.py` | Modify | Emit live LLM stream failures |
| `infrastructure/terraform/gcp/nfq/modules/observability_internal_safe/main.tf` | Modify | Add provider failure alerts |
| `packages/grove-voice-livekit/tests/unit/test_live_metrics.py` | Modify | Prove metric shape and counter increments |
| `packages/grove-voice-livekit/tests/test_config_mapper.py` | Modify | Prove STT/TTS provider failure emission |
| `packages/grove-voice-livekit/tests/unit/test_grove_voice_agent_turn_completion.py` | Modify | Prove live LLM provider failure emission |

## Implementation Notes

- Keep the counter set narrow. This is for paging, not a telemetry vanity
  project.
- Labels should be bounded and operator-meaningful.
- Do not alert on generic exception counters if the runtime already knows the
  provider and failure class.
- This task covers live voice LLM/STT/TTS provider failures. Broader non-voice
  provider probes remain separate follow-on work.

## Acceptance Criteria

- [x] LLM, STT, and TTS provider failures emit first-class counters
- [x] Internal-safe observability alerts on those counters with launch-safe
      thresholds
- [x] Tests prove the counters are emitted on representative failure paths
- [ ] Live Cloud Monitoring proof confirms the alert policy sees the scraped
      counter in the GCP production environment

## 2026-04-17 Audit Evidence

- Metric:
  `packages/grove-voice-livekit/src/grove_voice_livekit/live_metrics.py`
  defines `voice_provider_failures_total{component,provider,reason}`.
- Runtime emission:
  `packages/grove-voice-livekit/src/grove_voice_livekit/config_mapper.py`
  emits STT/TTS provider initialization failures and
  `packages/grove-voice-livekit/src/grove_voice_livekit/grove_voice_agent.py`
  emits LLM stream failures.
- Alerting:
  `infrastructure/terraform/gcp/nfq/modules/observability_internal_safe/main.tf`
  defines `google_monitoring_alert_policy.voice_provider_failures`.
- Local proof run during this audit:
  the targeted provider/metrics unit tests passed. Live Cloud Monitoring proof
  remains part of the environment verification step.

## References

- Milestone: [M39-nfq-gcp-observability-hardening.md](../../milestones/M39-nfq-gcp-observability-hardening.md)
- Related: [launch-observability-alert-matrix.md](../../../wiki/design-docs/launch-observability-alert-matrix.md)
