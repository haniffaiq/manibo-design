# T01: Add Slack-Backed Notification Channel Support For NFQ GCP Alerts

> **Milestone**: M39-nfq-gcp-observability-hardening
> **Status**: Not Started
> **Estimate**: S (< 2h)
> **Depends on**: M38

---

## Description

Add a clean Terraform contract for Cloud Monitoring Slack notification
channels so NFQ GCP alerts can route to Slack without committing the Slack auth
token in repo-owned tfvars.

## Subtasks

- [ ] **Channel contract**: extend the notification-channel input contract so
      Slack auth material is separate from the generic
      `notification_channels.labels` map and can be passed from a sensitive,
      secret-backed input instead of a committed example file.
- [ ] **Redundancy**: keep or add a second channel type such as email or
      Pub/Sub so Slack is not the only alert destination.
- [ ] **Docs and examples**: document the operator input contract for Slack
      channel creation, including Terraform state handling, in the exported NFQ
      path.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/gcp/nfq/modules/observability_internal_safe/**` | Modify | Accept Slack-safe notification channel inputs |
| `infrastructure/terraform/gcp/nfq/environments/{production,staging}/platform/**` | Modify | Thread the new notification-channel contract through the roots |
| `infrastructure/terraform/gcp/nfq/environments/{production,staging}/*.tfvars.example` | Modify | Show the non-secret operator inputs only |
| `wiki/distribution/nfq/**` | Modify | Document how to repeat the setup in the exported NFQ repo |

## Implementation Notes

- The current `notification_channels` Terraform input can model generic
  channel metadata, including email-style examples. This task remains open
  because Slack auth material must not be passed through that generic
  non-secret `labels` map.
- Add a Slack-specific input shape that keeps `channel_name` as non-secret
  metadata and maps the token to
  `google_monitoring_notification_channel.sensitive_labels.auth_token`.
- Do not put Slack auth tokens into committed tfvars examples or generic
  `notification_channels.labels`.
- Terraform still stores `sensitive_labels.auth_token` in raw state. T01 must
  document that state-access boundary and either require restricted remote-state
  access or add a separate external notification-channel ID input before any
  pre-created Slack channel fallback is documented.
- Prefer one clean secret-backed input over ad hoc CLI channel creation when
  Terraform-owned Slack channel creation is acceptable.

## Acceptance Criteria

- [ ] Terraform can manage a Slack notification channel for NFQ GCP alerts
- [ ] The Slack auth token is not committed in plaintext repo inputs and is not
      carried through generic notification-channel labels
- [ ] Terraform state exposure for the Slack token is documented and guarded by
      the chosen operator contract
- [ ] A redundant non-Slack channel remains available for the same alerting
      policies

## References

- Milestone: [M39-nfq-gcp-observability-hardening.md](../../milestones/M39-nfq-gcp-observability-hardening.md)
- Related: [launch-observability-alert-matrix.md](../../../wiki/design-docs/launch-observability-alert-matrix.md)
