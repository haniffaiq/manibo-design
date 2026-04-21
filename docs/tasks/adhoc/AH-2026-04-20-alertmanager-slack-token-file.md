# AH-2026-04-20: Alertmanager Slack Token File

> **Status**: Completed
> **Estimate**: XS (< 1h)
> **Depends on**: `AH-2026-04-20-slack-bot-token-alert-updates.md`

---

## Description

Move Slack bot-token delivery away from inline rendered Alertmanager
credentials. The rendered `alertmanager.yml` is intentionally readable for
ops inspection, so it must not contain `SLACK_BOT_TOKEN`.

## Subtasks

- [x] Switch bot-token Alertmanager config to `authorization.credentials_file`.
- [x] Write the token to a dedicated mounted file during monitoring bootstrap.
- [x] Mount the rendered Alertmanager config and secrets directory separately.
- [x] Lock live token-file permissions for Alertmanager's container UID.
- [x] Validate local and live Alertmanager config.
- [x] Reply to and resolve the PR review thread with evidence.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/hetzner/environments/production/monitoring/alertmanager/alertmanager-bot-token.yml.tmpl` | Modify | Use `credentials_file` instead of inline credentials |
| `infrastructure/terraform/hetzner/environments/production/monitoring/docker-compose.yml` | Modify | Mount config file and secret directory separately |
| `infrastructure/scripts/hetzner/shared/bootstrap-monitoring-vm.sh` | Modify | Write and permission the Slack token file |
| `wiki/ops/production-alerts.md` | Modify | Document token-file storage and first checks |
| `wiki/queries/2026-04-20-slack-resolve-message-updates.md` | Modify | Record credentials-file decision |
| `docs/tasks/adhoc/AH-2026-04-20-alertmanager-slack-token-file.md` | Create | Track review feedback fix and evidence |
| `wiki/log.md` | Modify | Append change note |

## Acceptance Criteria

- [x] Rendered bot-token `alertmanager.yml` references
      `/etc/alertmanager/secrets/slack_bot_token`.
- [x] Rendered bot-token `alertmanager.yml` does not contain the bot-token
      value.
- [x] Live token file is readable by Alertmanager's container UID and not
      world-readable on the monitoring host.
- [x] Alertmanager config validation passes locally and live.

## Verification

- Rendered bot-token config locally with a dummy token:
  - `grep` found
    `credentials_file: /etc/alertmanager/secrets/slack_bot_token`.
  - negative token grep passed; the dummy token was not present in rendered
    `alertmanager.yml`.
  - `amtool check-config /etc/alertmanager/alertmanager.yml` reported
    `SUCCESS` using `prom/alertmanager:v0.32.0`.
- Ran `bash -n infrastructure/scripts/hetzner/shared/bootstrap-monitoring-vm.sh`.
- Ran `docker compose --env-file env.example config` for the production
  monitoring stack and confirmed separate config-file and secrets-dir mounts.
- Ran bootstrap dry-runs for all receiver selector paths and confirmed output
  modes:
  - `slack-bot-token`
  - `slack-webhook`
  - `noop`
- Deployed the monitoring stack to `manibo-production-monitoring-1` with the
  live env file:
  - bootstrap output showed `Rendered Alertmanager receiver mode:
    slack-bot-token`
  - `/opt/monitoring/.env` is mode `600`
  - `/opt/monitoring/alertmanager/secrets` is mode `711`
  - `/opt/monitoring/alertmanager/secrets/slack_bot_token` is owned by
    `nobody:nogroup`, mode `400`
  - `/opt/monitoring/alertmanager/rendered/alertmanager.yml` is mode `644`
    and contains only `credentials_file`
  - live negative token grep passed; rendered config does not contain the
    token value
  - `docker exec monitoring-alertmanager-1 amtool check-config
    /etc/alertmanager/alertmanager.yml` reported `SUCCESS`
  - `docker exec --user 65534:65534 monitoring-alertmanager-1 /bin/sh -c
    'test -r /etc/alertmanager/secrets/slack_bot_token'` passed
