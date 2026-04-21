# AH-2026-04-20: Alertmanager Slack Delivery Failures

> **Status**: Completed
> **Estimate**: XS (< 1h)
> **Depends on**: `AH-2026-04-20-slack-bot-token-alert-updates.md`

---

## Description

Add direct coverage for Alertmanager-to-Slack notification failures. The
existing Prometheus notification alert only covers Prometheus failing to notify
Alertmanager; it does not cover Alertmanager accepting an alert and then failing
to deliver it to Slack.

## Subtasks

- [x] Add a Prometheus alert for Slack integration delivery failures.
- [x] Add a production runbook section for Slack delivery failures.
- [x] Validate rendered Prometheus rules.
- [x] Validate rendered Alertmanager config.
- [x] Deploy the updated monitoring rule to the live monitoring host.
- [x] Reply to and resolve the PR review thread with evidence.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/hetzner/environments/production/monitoring/prometheus/alerts.yml.tmpl` | Modify | Add Alertmanager Slack delivery failure alert |
| `wiki/ops/production-alerts.md` | Modify | Add Alertmanager Slack delivery failure runbook |
| `docs/tasks/adhoc/AH-2026-04-20-alertmanager-slack-delivery-failures.md` | Create | Track review feedback fix and evidence |
| `wiki/log.md` | Modify | Append change note |

## Acceptance Criteria

- [x] `AlertmanagerSlackNotificationFailures` fires when Alertmanager records
      Slack notification failures.
- [x] Runbook tells operators to check receiver mode, token validity, Slack app
      channel membership, and Alertmanager logs.
- [x] Rendered Prometheus rules validate with `promtool check rules`.
- [x] Rendered Alertmanager config validates with `amtool check-config`.

## Verification

- Confirmed live Alertmanager exposes
  `alertmanager_notifications_failed_total{integration="slack", reason=...}`.
- Confirmed live external Prometheus has the same metric series with
  `job="alertmanager"` and `integration="slack"`.
- Rendered local Prometheus and Alertmanager configs with dummy secrets:
  - `promtool check config /etc/prometheus/prometheus.yml` reported success.
  - `promtool check rules /etc/prometheus/alerts.yml` reported
    `SUCCESS: 78 rules found`.
  - `amtool check-config /etc/alertmanager/alertmanager.yml` reported success.
- Parsed rendered `alerts.yml` with PyYAML and confirmed exactly one
  `AlertmanagerSlackNotificationFailures` rule exists and references
  `alertmanager_notifications_failed_total`.
- Deployed the monitoring stack to `manibo-production-monitoring-1` with the
  live env file:
  - bootstrap output showed `Rendered Alertmanager receiver mode:
    slack-bot-token`
  - live `promtool check rules /etc/prometheus/alerts.yml` reported
    `SUCCESS: 78 rules found`
  - live `amtool check-config /etc/alertmanager/alertmanager.yml` reported
    success
  - live rendered `alerts.yml` contains
    `AlertmanagerSlackNotificationFailures`
  - live Prometheus rules API returned one
    `AlertmanagerSlackNotificationFailures` rule
  - live Prometheus series API returned Slack notification failure reasons:
    `clientError`, `contextCanceled`, `contextDeadlineExceeded`, `other`, and
    `serverError`
