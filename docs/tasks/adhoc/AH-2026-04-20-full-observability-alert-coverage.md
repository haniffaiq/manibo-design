# AH-2026-04-20: Full Observability Alert Coverage

> **Status**: Completed
> **Estimate**: S (< 2h)
> **Depends on**: `AH-2026-04-20-slack-launch-alerts.md`

---

## Description

Complete the Hetzner production alert coverage so Slack-routed alerts cover the
whole launch matrix surface backed by live metrics: observability backends,
Kubernetes workloads, operators, ingress, Temporal, LiveKit, KEDA, and the
Postgres database pods/PVCs.

The goal is not only to report currently pending alerts. The rule set must
cover healthy services too, so the alert fires when any service later degrades.

## Subtasks

- [x] Inventory live Prometheus series for deployments, statefulsets,
      daemonsets, PVCs, scrape targets, Temporal, LiveKit, and observability.
- [x] Add Alertmanager and Grafana scrape targets to external Prometheus.
- [x] Add observability self-monitoring alerts.
- [x] Add generic Kubernetes object coverage for critical namespaces.
- [x] Add database pod, PVC usage, Temporal persistence, and Temporal queue
      alerts.
- [x] Add LiveKit SIP/API/PSRPC application-level alerts.
- [x] Rename voice/runtime alert owner labels to `manibo-platform` for Slack
      titles.
- [x] Update runbooks and the launch matrix notes.
- [x] Render and validate Prometheus/Alertmanager configuration.
- [x] Deploy the monitoring stack and verify live rule load.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/hetzner/environments/production/monitoring/prometheus/prometheus.yml.tmpl` | Modify | Scrape Alertmanager and Grafana |
| `infrastructure/terraform/hetzner/environments/production/monitoring/docker-compose.yml` | Modify | Enable Grafana `/metrics` |
| `infrastructure/terraform/hetzner/environments/production/monitoring/prometheus/alerts.yml.tmpl` | Modify | Add full observability, workload, and DB alert coverage |
| `wiki/ops/production-alerts.md` | Modify | Add runbook entries for new alerts |
| `wiki/ops/live-voice-alerts.md` | Modify | Add runbook entries for LiveKit application alerts |
| `wiki/design-docs/launch-observability-alert-matrix.md` | Modify | Record full coverage scope and remaining metric gaps |
| `wiki/log.md` | Modify | Append the change note |

## Acceptance Criteria

- [x] External Prometheus scrapes Alertmanager, Grafana, blackbox, Pushgateway,
      itself, and remote-written in-cluster targets.
- [x] Alert rules cover every current production Deployment/StatefulSet/
      DaemonSet/PVC through either a specific service alert or a generic
      Kubernetes object alert.
- [x] Database alerts cover Postgres availability, redundancy, pod readiness,
      and PVC capacity using live metrics.
- [x] Observability alerts cover Prometheus rule/config/notification failures,
      Alertmanager, Grafana, Pushgateway, blackbox, in-cluster Prometheus,
      kube-state-metrics, node-exporter, and remote-write health.
- [x] Rendered Prometheus rules pass `promtool check rules`.
- [x] Rendered Alertmanager config passes `amtool check-config`.
- [x] Live Prometheus loads the expanded rule set.

## Verification

- Live Prometheus inventory before implementation:
  - `35` Deployments
  - `1` StatefulSet
  - `5` DaemonSets
  - `6` Postgres PVCs
  - `24` scrape targets
- Rendered config checks:
  - `promtool check config /etc/prometheus/prometheus.yml` reported success.
  - `promtool check rules /etc/prometheus/alerts.yml` reported
    `SUCCESS: 75 rules found`.
  - `amtool check-config /etc/alertmanager/alertmanager.yml` reported success.
- Live Prometheus expression validation before deploy:
  - `validated=75 errors=0 empty_now=68`
- Deployed with
  `infrastructure/scripts/hetzner/shared/bootstrap-monitoring-vm.sh --host 46.224.176.182 --env-file <redacted temp env>`.
- Live config checks after deploy:
  - `promtool check config /etc/prometheus/prometheus.yml` reported success.
  - `promtool check rules /etc/prometheus/alerts.yml` reported
    `SUCCESS: 75 rules found`.
  - `amtool check-config /etc/alertmanager/alertmanager.yml` reported success.
  - Prometheus `/api/v1/rules` shows `alert_rules=75`.
  - External scrape targets are `up`: `prometheus`, `alertmanager`, `grafana`,
    `blackbox-exporter`, and `pushgateway`.
  - `AgentWorkerUnavailable` now has `owner=manibo-platform`, so Slack titles
    use `(manibo-platform critical)` instead of `(voice-platform critical)`.
  - Slack messages emitted before the owner-label change remain historical
    messages with the old text; new Alertmanager records carry
    `owner=manibo-platform`.
- Active alert state after the final deploy:
  - `0` firing
  - `1` pending rule
  - `74` inactive rules
  - Pending series: `PlatformContainerMemoryNearLimit` for two `platform-web`
    pods.
