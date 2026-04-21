# AH-2026-04-20: Single Channel Alert Routing

> **Status**: Completed
> **Estimate**: XS (< 1h)
> **Depends on**: `AH-2026-04-20-full-observability-alert-coverage.md`

---

## Description

Document and configure the production launch alert routing decision:
infrastructure, workloads, and future log-derived application errors start in
one Slack channel, `#alerts-infrastructure`, with alert text tagged as
`infrastructure` or `workload`.

This keeps production monitoring operationally simple during launch while still
making the source class obvious in each Infra-Monitor message.

## Subtasks

- [x] Keep a single Alertmanager Slack receiver/channel.
- [x] Add a `Type` tag to Slack alert title/body.
- [x] Format Slack alerts as a grouped Markdown message instead of a folded
      text paragraph.
- [x] Document the single-channel routing policy.
- [x] Document the application-log and ingress-log path.
- [x] Document failed-call monitoring current state and inbound/outbound target
      state.

## Files Modified

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/hetzner/environments/production/monitoring/alertmanager/alertmanager.yml.tmpl` | Modify | Show infrastructure/workload type in Slack alerts |
| `wiki/ops/production-alerts.md` | Modify | Document single-channel routing and log alert policy |
| `wiki/ops/live-voice-alerts.md` | Modify | Document failed-call direction split requirements |
| `wiki/design-docs/launch-observability-alert-matrix.md` | Modify | Capture routing, logs, and failed-call decisions |
| `wiki/log.md` | Modify | Append documentation entry |

## Acceptance Criteria

- [x] Production alerts still route to one Slack channel.
- [x] Slack alert messages expose whether the signal is infrastructure or
      workload.
- [x] Slack alert messages preserve line breaks and show Details, Summary,
      optional Impact, Runbook, and Affected targets sections.
- [x] Slack runbook links point at GitHub while displaying the repo-relative
      wiki path.
- [x] Slack runbook links default to the durable `main` branch and can be
      temporarily rendered from another ref with `RUNBOOK_REPO_REF`.
- [x] The rendered Alertmanager Slack channel remains the literal
      `#alerts-infrastructure` value after YAML parsing.
- [x] Documentation states that application error logs should route to the same
      channel as grouped alerts, not raw log spam.
- [x] Documentation states that Hetzner Load Balancers do not provide per-request
      logs and that edge logs must come from `ingress-nginx`.
- [x] Documentation states the current failed-call monitor is aggregate and the
      direction-specific target requires a call metric direction label or
      dedicated outcome counter.

## Verification

- Rendered `alertmanager.yml.tmpl` with a dummy Slack webhook and ran
  `amtool check-config`; config reported `SUCCESS`.
- Deployed the monitoring stack with
  `infrastructure/scripts/hetzner/shared/bootstrap-monitoring-vm.sh --host 46.224.176.182 --env-file <redacted temp env>`.
- Live `monitoring-alertmanager-1` reported `amtool check-config` success.
- Live `monitoring-prometheus-1` reported `promtool check rules` success with
  `77 rules found`.
- Live rendered Alertmanager config contains the Slack `Type:
  infrastructure|workload` line.
- Rendered the updated Slack template with dummy values and validated it with
  `amtool check-config`; config reported `SUCCESS`.
- Updated runbook rendering to use `RUNBOOK_REPO_REF`, defaulting to `main`.
  Pre-merge validation can render from a release branch when a new runbook page
  has not landed on `main` yet.
- Rendered `alertmanager.yml.tmpl` locally with `RUNBOOK_REPO_REF=main`; the
  runbook URL rendered as
  `https://github.com/jakit-labs/manibo/blob/main/<repo-relative-runbook>`.
- Rendered `alertmanager.yml.tmpl` locally with a non-main
  `RUNBOOK_REPO_REF`; the runbook URL rendered with that ref and no literal
  `RUNBOOK_REPO_REF` placeholder remained.
- Validated the rendered Alertmanager config with
  `docker run --rm --entrypoint /bin/amtool prom/alertmanager:v0.28.1 check-config`;
  config reported `SUCCESS`.
- Parsed the rendered Alertmanager config with PyYAML and confirmed
  `receivers[0].slack_configs[0].channel == "#alerts-infrastructure"`.
