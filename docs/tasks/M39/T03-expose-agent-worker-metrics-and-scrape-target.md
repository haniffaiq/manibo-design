# T03: Expose Agent-Worker Metrics And Scrape Target

> **Milestone**: M39-nfq-gcp-observability-hardening
> **Status**: In Progress
> **Estimate**: M (2-4h)
> **Depends on**: M38

---

## Description

This task added `agent-worker` observability coverage by exposing a
metrics endpoint from the worker runtime and adding the matching GCP scrape
resource in the production overlay.

## Subtasks

- [x] **Runtime endpoint**: add a stable metrics endpoint for `agent-worker`
      without weakening the existing runtime contract.
- [x] **Kubernetes surface**: add the required container port and Service or
      scrape metadata so GCP managed Prometheus can reach the endpoint.
- [x] **Overlay wiring**: add the `PodMonitoring` resource in the GCP
      production overlay.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove-voice-livekit/src/grove_voice_livekit/live_metrics.py` | Modify | Expose the live voice metrics endpoint when `GROVE_AGENT_METRICS_PORT` is set |
| `packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py` | Modify | Start the metrics endpoint during worker boot |
| `infrastructure/kubernetes/base/workloads/agent-worker/**` | Modify | Add the scrapeable Kubernetes surface |
| `infrastructure/kubernetes/overlays/gcp/production/observability/**` | Modify | Add `agent-worker` `PodMonitoring` |
| `packages/grove-voice-livekit/tests/unit/test_live_metrics.py` | Modify | Prove the endpoint and metric shape |
| `packages/grove-voice-livekit/tests/unit/test_metrics_bootstrap.py` | Modify | Prove worker metrics bootstrap guardrails |

## Implementation Notes

- Prefer reusing the existing Prometheus metric registry and endpoint patterns
  already used by `platform-api` and `platform-temporal-worker`.
- Do not invent a second metrics format or sidecar just for one worker.
- Verification must show the endpoint responds with Prometheus output.

## Acceptance Criteria

- [x] `agent-worker` exposes a stable metrics endpoint
- [x] The GCP runtime overlay scrapes `agent-worker` metrics
- [ ] Live runtime proof confirms the endpoint responds with Prometheus output

## 2026-04-17 Audit Evidence

- Runtime endpoint:
  `packages/grove-voice-livekit/src/grove_voice_livekit/live_metrics.py`
  starts the Prometheus HTTP server from `GROVE_AGENT_METRICS_PORT`.
- Worker wiring:
  `packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py` calls
  the metrics bootstrap and endpoint start path.
- Kubernetes scrape surface:
  `infrastructure/kubernetes/base/workloads/agent-worker/deployment-agent-worker.yaml`
  exposes metrics env/port and
  `infrastructure/kubernetes/base/workloads/agent-worker/service-agent-worker-metrics.yaml`
  exposes the metrics Service.
- GCP production scrape:
  `infrastructure/kubernetes/overlays/gcp/production/observability/podmonitoring-agent-worker.yaml`.
- Local proof run during this audit:
  `kubectl kustomize infrastructure/kubernetes/overlays/gcp/production`
  rendered successfully and the targeted metrics unit tests passed. Live
  `curl` proof against `svc/agent-worker-metrics:8081` remains a separate
  environment verification step.

## References

- Milestone: [M39-nfq-gcp-observability-hardening.md](../../milestones/M39-nfq-gcp-observability-hardening.md)
- Related: [launch-observability-alert-matrix.md](../../../wiki/design-docs/launch-observability-alert-matrix.md)
