# M39: NFQ GCP Observability Hardening — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Add Slack-backed notification channel support for NFQ GCP alerts | Not Started | — |
| T02 | Add public API 5xx and latency alerts from GCP load-balancer metrics | In Progress | — |
| T03 | Expose `agent-worker` metrics and scrape them in the GCP overlay | In Progress | — |
| T04 | Add first-class LLM / STT / TTS provider failure counters and alerts | In Progress | — |
| T05 | Separate API metrics auth from the internal token and restore API scrape surfaces | Done | 2026-04-17 |

## Notes

- M39 was created on 2026-04-13 from explicit human request after the M38
  observability split made the remaining blind spots concrete.
- The 2026-04-17 truth audit found the task pack stale relative to the current
  repo. T03, T04, and T05 are implemented in code/infra. T03 still needs live
  endpoint proof before the full milestone verification criterion can close.
  T02 is partially implemented because public-edge HTTPS 5xx alerting exists,
  but public API latency alerting does not.
- T05 closed the security boundary found during the original M38 observability
  split: managed Prometheus now uses `PLATFORM_API_METRICS_TOKEN` for
  `/metrics` instead of inheriting broad `GROVE_INTERNAL_API_TOKEN` access in
  GCP production.
- T02 no longer depends on T01. Slack routing improves alert delivery, but the
  public-edge 5xx/latency alert policies can be modeled against existing load
  balancer metrics independently.
- T03 is implemented by the `agent-worker` metrics endpoint in
  `packages/grove-voice-livekit`, the base `agent-worker` metrics Service, and
  the GCP production `PodMonitoring`. The live endpoint curl remains a
  verification step against a running GCP/k3d environment.
- T04 is implemented by `voice_provider_failures_total`, live voice LLM TTFT
  metrics, runtime failure emission, and internal-safe Cloud Monitoring alert
  policies. Live Cloud Monitoring apply/inspection proof remains open.
- Cloud Monitoring supports native Slack notification channels, but Google
  recommends a redundant email or Pub/Sub path for Slack-backed alerts.
- The current Terraform `notification_channels` input is generic enough for
  Slack channel metadata, but the Slack auth token should not be carried in
  committed tfvars. T01 exists to add a clean secret-backed contract.
- Immediate execution order is saved in `docs/tasks/M39/NEXT-STEPS.md`.
