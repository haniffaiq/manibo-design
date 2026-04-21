# M39: NFQ GCP Observability Hardening

Status: in progress
Created: 2026-04-13
Owner: Jakit
Branch: docs/m39-nfq-gcp-observability-audit
Stream: infra
Depends on: M38, M38.1
Reference: `wiki/design-docs/launch-observability-alert-matrix.md`

## Goal

Close the next SRE-visible observability gaps after the NFQ GCP bootstrap and
internal-first runtime boot:

- route alerts to Slack cleanly instead of relying on placeholder email-only
  examples
- add public API 5xx count and latency alerting from the existing GCP load balancer
  metrics
- separate API metrics scrape auth from the internal-route token so managed
  Prometheus can scrape `/metrics` without inheriting broader internal API
  access
- expose and scrape `agent-worker` metrics so worker degradation is not a blind
  spot
- emit first-class LLM / STT / TTS provider failure counters so third-party
  degradation can alert on something more honest than indirect symptoms

This milestone is not a generic observability wishlist. It is the shortest
follow-on needed to move from "basic infra/workload visibility exists" to a
credible SRE launch posture for NFQ on GCP.

## 2026-04-17 Truth Audit

This milestone was created before later GCP/runtime observability work landed.
The current repo already implements T03, T04, and T05. T02 is partial: public
HTTPS 5xx alerting and dashboard coverage exist, but public API latency
alerting is still missing. T01 remains open because the existing notification
channel input can model generic channels, but it is unsafe for Slack auth
tokens because generic `notification_channels.labels` are passed directly to
`google_monitoring_notification_channel.labels`. Until T01 lands, launch must
use email/Pub/Sub routing rather than passing Slack auth material through the
generic labels map. Pre-created Slack notification channel IDs are also not a
supported fallback until the Terraform module has an explicit external-channel
ID input.

The remaining M39 execution scope is:

- T01: add the Slack-safe notification-channel contract and redundant routing.
- T02: finish public API latency alerting and dashboard coverage.
- Verify the GCP production apply path with real Cloud Monitoring inputs and
  live scraped endpoint checks.

Synthetic NFQ booking canary parity and booking-completion SLO parity are
launch-critical follow-ons, but they are explicitly waived out of the current
M39 task set to keep this PR/task pack focused on the GCP observability truth
audit and immediate M39 gaps. Successor owner: platform/infra. Successor
milestone: M39.1 or the next explicitly activated NFQ GCP launch-observability
milestone. NFQ launch observability proof remains incomplete until those land.

## Design Decisions

1. **Slack is supported, but not as the only channel**. Cloud Monitoring has a
   native `slack` notification channel type. Use Slack for operator visibility,
   but keep a redundant email or Pub/Sub path because Google recommends a
   second channel for Slack-backed alerts.

2. **Public API alerts use load-balancer metrics, not route counters**. API
   5xx and latency alerting for the public edge should be built from existing
   GCP HTTPS load balancer metrics. That is available now and does not need app
   code changes.

3. **Runtime alerting only pages on direct signals**. `agent-worker` and
   provider-health paging should not be inferred indirectly from unrelated
   counters. If the service does not expose the metric, add the metric first.

4. **Keep infra-only and code-change work separated**. Slack routing and public
   edge API alerts can land without touching runtime code. `agent-worker`
   scrape support and provider-failure counters are code-change tasks and
   should stay isolated.

5. **API metrics auth must not reuse the broad internal-route token**. If GCP
   managed Prometheus needs a bearer token for `/metrics`, that token must be
   narrower than `GROVE_INTERNAL_API_TOKEN` and must not grant access to other
   internal endpoints.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Add Slack-backed notification channel support for NFQ GCP alerts | not started | M38 |
| T02 | Add public API 5xx and latency alerts from GCP load-balancer metrics | in progress | M38.1 |
| T03 | Expose `agent-worker` metrics and scrape them in the GCP overlay | in progress | M38 |
| T04 | Add first-class LLM / STT / TTS provider failure counters and alerts | in progress | M38, T03 |
| T05 | Separate API metrics auth from the internal token and restore API scrape surfaces | done | M38 |

## Acceptance Criteria

- [ ] Terraform can manage an NFQ GCP Slack notification channel without
      committing the Slack auth token in plaintext repo inputs.
- [ ] The GCP public-edge observability surface alerts on API 5xx and high
      latency using Cloud Load Balancing metrics that already exist today.
      HTTPS 5xx is implemented; latency remains open.
- [x] API `/metrics` scrape auth is isolated from the broader internal-route
      token and the GCP overlay can safely restore API `PodMonitoring`.
- [ ] `agent-worker` exposes a metrics endpoint and the GCP runtime overlay
      scrapes it so worker degradation is visible in managed Prometheus.
      Code/render coverage exists; live endpoint proof remains open.
- [ ] Internal-safe alerts can detect LLM, STT, and TTS provider failures from
      first-class runtime counters rather than inferred side effects.
      Code and Terraform coverage exist; live Cloud Monitoring proof remains
      open.
- [ ] Verification proves the Terraform roots validate, the overlay renders,
      and the new runtime metrics actually appear on the scraped endpoints.

## Verification

```bash
terraform fmt -recursive infrastructure/terraform/gcp

TFBIN=/path/to/terraform-1.14.x
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/production/platform init -backend=false -input=false
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/production/platform validate
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/staging/platform init -backend=false -input=false
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/staging/platform validate

kubectl kustomize infrastructure/kubernetes/overlays/gcp/production
tools/scripts/infra/k8s-runtime-secrets.sh validate --overlay gcp/production --namespace platform
tools/scripts/infra/k8s-runtime-secrets.sh render-all --overlay gcp/production --namespace platform >/dev/null

METRICS_TOKEN="$(kubectl -n platform get secret platform-api-metrics-token -o jsonpath='{.data.token}' | base64 --decode)"
metrics_curl_config="$(mktemp)"
chmod 600 "${metrics_curl_config}"
trap 'rm -f "${metrics_curl_config}"' EXIT
printf 'header = "Authorization: Bearer %s"\n' "${METRICS_TOKEN}" > "${metrics_curl_config}"
kubectl -n platform port-forward svc/platform-api 18080:8000
curl -fsS --config "${metrics_curl_config}" http://127.0.0.1:18080/metrics

kubectl -n platform port-forward svc/agent-worker-metrics 18081:8081
curl -fsS http://127.0.0.1:18081/metrics

kubectl -n platform port-forward deploy/platform-temporal-worker 18082:8081
curl -fsS http://127.0.0.1:18082/metrics
```

## Non-Goals

- No full Datadog/Grafana replatforming
- No broad SLO program design
- No fake provider paging based on logs or guesses when no direct counter
  exists
- No public DNS cutover hidden inside alerting work
