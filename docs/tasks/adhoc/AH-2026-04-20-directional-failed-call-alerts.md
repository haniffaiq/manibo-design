# AH-2026-04-20: Directional Failed Call Alerts

> **Status**: Completed
> **Estimate**: S (< 2h)
> **Depends on**: `AH-2026-04-20-single-channel-alert-routing.md`

---

## Description

Add a low-cardinality call outcome metric segmented by call direction, then use
it for inbound and outbound failed-call alerts.

The existing `call_duration_seconds` histogram stays unchanged because current
dashboards and aggregate SLO alerts already depend on its `{outcome}` label
shape. Directional paging uses a dedicated counter instead:
`voice_call_outcomes_total{direction,outcome}`.

## Subtasks

- [x] Add `voice_call_outcomes_total{direction,outcome}`.
- [x] Populate it after `platform_post_call_activity` durably updates
      `tenant.calls`, using the persisted `calls.direction`.
- [x] Add inbound and outbound failed-call alerts.
- [x] Align the aggregate failed-call alert with the same system-failure
      outcome policy.
- [x] Update live voice runbooks and launch observability notes.
- [x] Run targeted tests and monitoring config validation.

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/observability/metrics.py` | Modify | Add direction-aware call outcome counter |
| `apps/temporal-worker/src/temporal_worker/activities/post_call.py` | Modify | Emit counter from persisted call direction |
| `packages/platform-core/tests/unit/test_observability/test_metrics.py` | Modify | Prove metric type and label shape |
| `apps/temporal-worker/tests/unit/test_post_call_latency_metrics.py` | Modify | Prove post-call emits direction/outcome counter |
| `infrastructure/terraform/hetzner/environments/production/monitoring/prometheus/alerts.yml.tmpl` | Modify | Add inbound/outbound failed-call alerts |
| `wiki/ops/live-voice-alerts.md` | Modify | Add alert runbook entries |
| `wiki/design-docs/launch-observability-alert-matrix.md` | Modify | Mark directional failed-call target implemented |
| `wiki/log.md` | Modify | Append implementation note |

## Acceptance Criteria

- [x] `voice_call_outcomes_total` exports only low-cardinality labels:
      `direction` and `outcome`.
- [x] Post-call metric emission is best-effort and does not fail the activity.
- [x] Inbound and outbound alerts page only for system-like failure outcomes
      (`error`, `unknown`), not normal outbound contactability outcomes like
      `no_answer`, `busy`, or `voicemail`.
- [x] The aggregate call-completion alert also excludes normal contactability
      outcomes and requires at least three `error|unknown` outcomes before
      paging.
- [x] Prometheus rules validate with `promtool`.
- [x] Targeted unit tests pass.

## Verification

- `uv run pytest packages/platform-core/tests/unit/test_observability/test_metrics.py apps/temporal-worker/tests/unit/test_post_call_latency_metrics.py -q --tb=short`
  passed: `66 passed`.
- `uv run ruff check packages/platform-core/src/platform_core/observability/metrics.py apps/temporal-worker/src/temporal_worker/activities/post_call.py packages/platform-core/tests/unit/test_observability/test_metrics.py apps/temporal-worker/tests/unit/test_post_call_latency_metrics.py`
  passed.
- `uv run pyright packages/platform-core/src/platform_core/observability/metrics.py apps/temporal-worker/src/temporal_worker/activities/post_call.py`
  passed with `0 errors`.
- Rendered `alerts.yml.tmpl` with `CLUSTER_NAME=manibo-production` and
  `DOLLAR='$'`; `promtool check rules` reported `SUCCESS: 77 rules found`.
- Deployed the monitoring stack with
  `infrastructure/scripts/hetzner/shared/bootstrap-monitoring-vm.sh --host 46.224.176.182 --env-file <redacted temp env>`.
- Live `monitoring-prometheus-1` reported `SUCCESS: 77 rules found`.
- Live `monitoring-alertmanager-1` reported `amtool check-config` success.
- Live Prometheus loaded `InboundVoiceCallFailureRateHigh` and
  `OutboundVoiceCallFailureRateHigh`; both were `inactive`, expected until the
  workload image emits `voice_call_outcomes_total`.
