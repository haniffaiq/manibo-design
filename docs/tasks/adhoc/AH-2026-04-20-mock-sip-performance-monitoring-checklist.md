# AH-2026-04-20: Mock SIP Performance Monitoring Checklist

> **Status**: Completed
> **Estimate**: XS (< 1h)
> **Depends on**: `AH-2026-04-20-alertmanager-slack-token-file.md`

---

## Description

Document the performance monitoring checklist required before running staged
mock-SIP load tests against real Manibo infrastructure. The checklist defines
the timestamp model from request input to conversation end, including STT final
latency, LLM time to first token, TTS time to first byte, first audible speech,
DB query time, and infrastructure saturation.

## Subtasks

- [x] Define required correlation fields.
- [x] Define call-level timestamp names and formulas.
- [x] Define per-turn STT, LLM, and TTS timestamp names and formulas.
- [x] Define infrastructure and dependency timing requirements.
- [x] Define the agent-readable query loop.
- [x] Define hard abort gates and stage report requirements.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `wiki/ops/mock-sip-load-test-performance-checklist.md` | Create | Ops checklist for mocked-SIP load-test telemetry |
| `wiki/index.md` | Modify | Link the new ops checklist |
| `wiki/design-docs/launch-observability-alert-matrix.md` | Modify | Point load-test section to the executable checklist |
| `docs/tasks/adhoc/AH-2026-04-20-mock-sip-performance-monitoring-checklist.md` | Create | Track documentation task |
| `wiki/log.md` | Modify | Append change note |

## Acceptance Criteria

- [x] Checklist covers request input through conversation end.
- [x] Checklist defines STT finalization, LLM TTFT, TTS TTFB, and first audible
      speech measurements.
- [x] Checklist covers load balancer/ingress, API, Temporal, Postgres, Redis,
      Kubernetes, KEDA/HPA, LiveKit/SIP, and Alertmanager.
- [x] Checklist defines staged concurrency and abort gates.

## Verification

- Reviewed existing voice latency documentation in `wiki/systems/voice.md`.
- Reviewed existing metric names in `wiki/systems/observability.md`.
- Added the checklist and linked it from `wiki/index.md` and
  `wiki/design-docs/launch-observability-alert-matrix.md`.
