# AH-2026-04-20: Route Launch Alerts To Slack

> **Status**: Completed
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Description

Wire the Hetzner production monitoring stack so the launch alert matrix routes
through Alertmanager to the Infra-Monitor Slack app in `#alerts-infrastructure`.

The live monitoring host already has a Slack receiver configured. The missing
piece is that live Prometheus only had the basic public/cluster alert rules.
This task adds the matrix-backed infra/workload rules that have live external
Prometheus series and documents the remaining metric gaps explicitly.

## Subtasks

- [x] Improve Slack alert text with severity, owner, and runbook links.
- [x] Add launch infra/workload Prometheus alerts backed by existing metrics.
- [x] Add/refresh production alert runbooks.
- [x] Render and validate Prometheus/Alertmanager configuration.
- [x] Deploy the rendered monitoring stack to `manibo-production-monitoring-1`.
- [x] Verify Alertmanager still routes to Slack and Prometheus loads the
      expanded rule set.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/hetzner/environments/production/monitoring/alertmanager/alertmanager.yml.tmpl` | Modify | Include severity, owner, and runbook in Slack messages |
| `infrastructure/terraform/hetzner/environments/production/monitoring/prometheus/alerts.yml.tmpl` | Modify | Add launch infra/workload alert rules |
| `wiki/ops/production-alerts.md` | Create | Production alert response runbook |
| `wiki/ops/README.md` | Modify | Link the new runbook |
| `wiki/design-docs/launch-observability-alert-matrix.md` | Modify | Record Slack transport decision and metric-backed implementation scope |
| `wiki/log.md` | Modify | Append the change note |

## Acceptance Criteria

- [x] Rendered Alertmanager config uses the Slack receiver and target channel.
- [x] Rendered Prometheus alert rules pass `promtool check rules`.
- [x] Rendered Alertmanager config passes `amtool check-config`.
- [x] Live monitoring host loads the expanded rule set.
- [x] Live Alertmanager still shows the Slack receiver.
- [x] Known launch matrix gaps are documented instead of hidden.

## Verification

This task established Slack routing and the first expanded launch rule set. It
was later broadened by `AH-2026-04-20-full-observability-alert-coverage.md`.

- Rendered local configs with a fake Slack webhook:
  - Prometheus groups: `6`
  - Alert rules: `38`
  - Alertmanager receiver: `slack`
  - Channel: `#alerts-infrastructure`
- Copied rendered configs to `manibo-production-monitoring-1` temp path and ran:
  - `promtool check rules /etc/prometheus/alerts.yml`
    - `SUCCESS: 38 rules found`
  - `amtool check-config /etc/alertmanager/alertmanager.yml`
    - `SUCCESS`
- Queried live Prometheus before deploy and confirmed the rules use existing
  external Prometheus series where possible:
  - node readiness, node CPU, node memory, node pressure, pod restarts,
    deployment availability, Postgres pod readiness, KEDA availability,
    container CPU/memory usage and limits
  - node filesystem and first-class Postgres replication/storage metrics are
    not present; those remain documented gaps.
- Deployed with
  `infrastructure/scripts/hetzner/shared/bootstrap-monitoring-vm.sh --host 46.224.176.182 --env-file <redacted temp env>`.
- Live config checks after deploy:
  - `docker exec monitoring-prometheus-1 promtool check rules /etc/prometheus/alerts.yml`
    reported `SUCCESS: 38 rules found`.
  - `docker exec monitoring-alertmanager-1 amtool check-config /etc/alertmanager/alertmanager.yml`
    reported `SUCCESS`.
  - `/opt/monitoring/.env` has `SLACK_WEBHOOK_URL=SET` and
    `SLACK_CHANNEL=#alerts-infrastructure`.
  - Alertmanager status API shows `receiver: slack` and redacted `api_url`.
  - Prometheus `/api/v1/rules` shows `alert_rules=38`.
  - Containers `monitoring-prometheus-1`, `monitoring-alertmanager-1`,
    `monitoring-grafana-1`, `monitoring-blackbox-1`, and
    `monitoring-pushgateway-1` are running.
  - `production-booking-canary.timer` is enabled and active.
- Current pending alerts immediately after load:
  - `AgentWorkerUnavailable`
  - `ProductionBookingCanaryMetricsMissing`
  - `PlatformContainerMemoryNearLimit`
