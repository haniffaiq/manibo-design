# T02: Add Public API 5xx And Latency Alerts

> **Milestone**: M39-nfq-gcp-observability-hardening
> **Status**: In Progress
> **Estimate**: S (< 2h)
> **Depends on**: M38.1

---

## Description

Extend the public-edge observability Terraform so the public NFQ API alerts on
HTTPS 5xx count and high latency using existing GCP HTTPS load-balancer metrics.
This task is infra-only and does not require application code changes.

## Subtasks

- [x] **5xx metric selection**: use Cloud Load Balancing request-count metrics
      for HTTPS 5xx responses on the NFQ public edge.
- [x] **5xx alert policy**: add a public-edge alert policy for HTTPS 5xx
      responses with conservative launch thresholds.
- [x] **5xx dashboard coverage**: add public-edge request and 5xx dashboard
      views.
- [ ] **Latency alert policy**: add a public API latency alert from Cloud Load
      Balancing metrics.
- [ ] **Latency dashboard coverage**: add the matching public API latency
      dashboard view.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/gcp/nfq/modules/observability_public_edge/main.tf` | Modify | Add API 5xx and latency alerts plus dashboard widgets |
| `infrastructure/terraform/gcp/nfq/modules/observability_public_edge/variables.tf` | Modify | Add edge API thresholds |
| `infrastructure/terraform/gcp/nfq/environments/{production,staging}/platform/variables.tf` | Modify | Thread new edge API thresholds into the roots |
| `infrastructure/terraform/gcp/nfq/environments/{production,staging}/*.tfvars.example` | Modify | Provide launch-default thresholds |

## Implementation Notes

- Use GCP load-balancer metrics for edge behavior, not route-event counters.
- Keep this inside the public-edge observability surface because it depends on
  real public ingress / load-balancer traffic.
- Thresholds should be conservative and easy to tune after first traffic.
- Slack routing is not a hard dependency for this task. The alert policies can
  be modeled before T01 finishes; T01 controls the final launch routing
  contract.

## Acceptance Criteria

- [x] Public-edge observability alerts on API 5xx using load-balancer metrics
- [ ] Public-edge observability alerts on API latency using load-balancer metrics
- [ ] The public-edge dashboard exposes the same API error and latency signals.
      Error coverage exists; latency remains open.

## 2026-04-17 Audit Evidence

- Implemented:
  `infrastructure/terraform/gcp/nfq/modules/observability_public_edge/main.tf`
  defines `google_monitoring_alert_policy.https_5xx` and the public-edge
  request/5xx dashboard widgets.
- Still missing:
  no public-edge request-latency metric filter, alert policy, threshold input,
  or dashboard widget exists in the module.

## References

- Milestone: [M39-nfq-gcp-observability-hardening.md](../../milestones/M39-nfq-gcp-observability-hardening.md)
- Related: [launch-observability-alert-matrix.md](../../../wiki/design-docs/launch-observability-alert-matrix.md)
