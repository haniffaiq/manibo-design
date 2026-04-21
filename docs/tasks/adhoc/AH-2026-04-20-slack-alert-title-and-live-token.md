# AH-2026-04-20: Slack Alert Title and Live Token

> **Status**: Completed
> **Estimate**: XS (< 1h)
> **Depends on**: `AH-2026-04-20-slack-bot-token-alert-updates.md`

---

## Description

Polish production Slack alert titles and deploy the bot-token receiver mode to
the live monitoring host. Firing alerts should not carry the noisy `FIRING`
prefix, while resolved alerts should still clearly show `RESOLVED`.

## Subtasks

- [x] Remove the `FIRING` prefix from Slack alert titles.
- [x] Keep the `RESOLVED` prefix on resolved Slack alert titles.
- [x] Render runbooks as plain absolute GitHub URLs.
- [x] Store the Slack bot token only in the live monitoring host env.
- [x] Redeploy external monitoring with bot-token mode.
- [x] Verify live Alertmanager uses the upgraded image and rendered config.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/hetzner/environments/production/monitoring/alertmanager/alertmanager.yml.tmpl` | Modify | Fallback webhook title/link polish |
| `infrastructure/terraform/hetzner/environments/production/monitoring/alertmanager/alertmanager-bot-token.yml.tmpl` | Modify | Bot-token title/link polish |
| `wiki/ops/production-alerts.md` | Modify | Document final title and link shape |
| `docs/tasks/adhoc/AH-2026-04-20-slack-alert-title-and-live-token.md` | Create | Track verification and live secret handling |
| `wiki/log.md` | Modify | Append change note |

## Acceptance Criteria

- [x] Firing Slack titles render as `AlertName - cluster`.
- [x] Resolved Slack titles render as `[RESOLVED:N] AlertName - cluster`.
- [x] Runbook text renders as a full `https://github.com/...` URL.
- [x] Live `/opt/monitoring/.env` contains `SLACK_BOT_TOKEN` without committing
      the token.
- [x] Live bot-token mode stores the runtime token in a dedicated
      Alertmanager-readable token file instead of rendered config.
- [x] Live Alertmanager config validates and uses `update_message: true`.

## Verification

- Rendered bot-token and webhook configs with dummy secrets and validated both
  with `prom/alertmanager:v0.32.0`:
  - `amtool check-config /cfg/bot.yml /cfg/webhook.yml`
    reported `SUCCESS`.
- Parsed rendered configs with PyYAML and confirmed:
  - title template does not contain `FIRING`
  - title template keeps `[RESOLVED:{{ len .Alerts }}]`
  - runbook text contains the plain
    `https://github.com/jakit-labs/manibo/blob/main/{{ .Annotations.runbook_url }}`
    URL shape
  - masked Slack links are no longer used for runbooks
- Updated live `/opt/monitoring/.env` on `manibo-production-monitoring-1`:
  - `SLACK_BOT_TOKEN` is present and redacted in verification output
  - `RUNBOOK_REPO_REF=main`
  - file mode is `600`
- Deployed the monitoring stack with the live env file:
  - bootstrap output showed `Rendered Alertmanager receiver mode:
    slack-bot-token`
  - `docker exec monitoring-alertmanager-1 amtool check-config
    /etc/alertmanager/alertmanager.yml` reported `SUCCESS`
  - live Alertmanager version is `0.32.0`
  - live rendered config contains `api_url:
    https://slack.com/api/chat.postMessage`
  - live rendered config references
    `/etc/alertmanager/secrets/slack_bot_token` through `credentials_file`
  - live rendered config does not contain the Slack bot token value
  - live token file is
    `/opt/monitoring/alertmanager/secrets/slack_bot_token`, owned by
    `nobody:nogroup`, mode `400`, and readable by Alertmanager UID `65534`
  - live rendered config contains `update_message: true`
  - live rendered config contains a runbook URL under
    `https://github.com/jakit-labs/manibo/blob/main/`
  - live rendered config contains no `FIRING` string
