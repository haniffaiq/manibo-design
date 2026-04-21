# AH-2026-04-20: Slack Bot Token Alert Updates

> **Status**: Completed
> **Estimate**: S (< 2h)
> **Depends on**: `AH-2026-04-20-single-channel-alert-routing.md`

---

## Description

Move production Alertmanager Slack delivery toward bot-token mode so resolved
alerts can update the original Infra Monitor Slack message instead of posting a
new resolved message.

## Subtasks

- [x] Add a Slack bot-token Alertmanager template with `update_message: true`.
- [x] Upgrade external Alertmanager to a version that supports Slack message
      updates.
- [x] Preserve webhook fallback until the live `SLACK_BOT_TOKEN` is installed.
- [x] Document the Slack app and token requirements.
- [x] Validate rendered bot-token, webhook, and noop Alertmanager configs.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/hetzner/environments/production/monitoring/alertmanager/alertmanager-bot-token.yml.tmpl` | Create | Slack Web API receiver with update-in-place behavior |
| `infrastructure/terraform/hetzner/environments/production/monitoring/docker-compose.yml` | Modify | Upgrade Alertmanager image |
| `infrastructure/terraform/hetzner/environments/production/monitoring/env.example` | Modify | Document `SLACK_BOT_TOKEN` |
| `infrastructure/scripts/hetzner/shared/bootstrap-monitoring-vm.sh` | Modify | Prefer bot-token template, fall back to webhook/noop |
| `wiki/ops/production-alerts.md` | Modify | Document Slack update behavior and setup |
| `wiki/design-docs/launch-observability-alert-matrix.md` | Modify | Record preferred Slack bot-token delivery mode |
| `wiki/queries/2026-04-20-slack-resolve-message-updates.md` | Create | Record investigation and decision |
| `wiki/index.md` | Modify | Link the query |
| `wiki/log.md` | Modify | Append change note |

## Acceptance Criteria

- [x] With `SLACK_BOT_TOKEN` set, rendered Alertmanager config uses Slack Web
      API bearer-token auth through `credentials_file` and
      `update_message: true`.
- [x] With `SLACK_BOT_TOKEN` set, rendered Alertmanager config does not contain
      the token value.
- [x] With only `SLACK_WEBHOOK_URL` set, rendered Alertmanager config remains
      compatible with the current webhook path.
- [x] With neither Slack variable set, rendered Alertmanager config uses the
      noop receiver.
- [x] Alertmanager config validation passes for all three render paths.
- [x] Docs explain the Slack app permission and channel requirements.

## Verification

- Validated full rendered bot-token, webhook, and noop Alertmanager configs
  with `prom/alertmanager:v0.32.0`:
  - `amtool check-config /cfg/bot.yml /cfg/webhook.yml /cfg/noop.yml`
    reported `SUCCESS` for all three configs.
- Parsed rendered configs with PyYAML and confirmed:
  - bot-token receiver uses `https://slack.com/api/chat.postMessage`
  - bot-token receiver sets HTTP `Authorization: Bearer` through
    `credentials_file`
  - bot-token receiver has `send_resolved: true`
  - bot-token receiver has `update_message: true`
  - bot-token receiver does not render the dummy token into
    `alertmanager.yml`
  - webhook receiver keeps the Slack webhook URL path and channel
  - noop receiver remains the fallback when no Slack env is set
- Ran `bash -n infrastructure/scripts/hetzner/shared/bootstrap-monitoring-vm.sh`.
- Ran bootstrap dry-runs for all selector paths and confirmed output modes:
  - `slack-bot-token`
  - `slack-webhook`
  - `noop`
- Ran `docker compose --env-file env.example config` in the production
  monitoring directory; rendered Compose config uses
  `prom/alertmanager:v0.32.0`.
