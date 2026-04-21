# T05: Separate API Metrics Auth And Restore API Scrape

> **Milestone**: M39-nfq-gcp-observability-hardening
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: M38

---

## Description

Restore the NFQ GCP API scrape surface without reusing
`GROVE_INTERNAL_API_TOKEN` for managed Prometheus. This task keeps the API
`/metrics` bearer token narrower than the token used by real internal routes,
then re-enables the API `PodMonitoring`, scrape Secret wiring, and the
carrier/API alerts that depend on that endpoint.

## Subtasks

- [x] **Runtime auth split**: separate `/metrics` bearer-token validation from
      the broader internal-route token, with a fallback only for legacy
      overlays.
- [x] **Overlay + secret wiring**: restore the API `PodMonitoring`, scrape
      bearer-token Secret, and overlay environment wiring.
- [x] **Observability restore**: restore the API-derived carrier alerts and the
      related architecture/unit proof.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/main.py` | Modify | Use dedicated metrics auth on `/metrics` |
| `apps/api/src/platform_api/routes/internal/internal_agent_config.py` | Modify | Add the narrow metrics-token guard |
| `apps/api/tests/unit/test_internal_token_auth.py` | Create | Prove metrics auth does not widen internal-route access |
| `infrastructure/kubernetes/overlays/gcp/production/observability/**` | Modify | Restore API `PodMonitoring` and scrape Secret RBAC |
| `tools/scripts/infra/k8s-runtime-secrets.sh` | Modify | Render the dedicated API metrics bearer-token Secret |
| `infrastructure/terraform/gcp/nfq/modules/observability_internal_safe/**` | Modify | Restore carrier/API alert policies and dashboard widgets |

## Implementation Notes

- This follow-up landed after the infra-only M38 split so review could focus on
  the auth/runtime contract instead of general GCP bootstrap churn.
- The dedicated metrics token may fall back to `GROVE_INTERNAL_API_TOKEN` for
  legacy overlays, but new overlays must wire `PLATFORM_API_METRICS_TOKEN`
  explicitly.
- Do not mix this task with public-edge 5xx/latency alerts; that remains T02.

## Acceptance Criteria

- [x] `/metrics` can use a token that does not authorize broader internal routes
- [x] The GCP production overlay restores API `PodMonitoring` with the
      dedicated bearer-token Secret
- [x] Carrier/API alerts and tests are restored on top of the safe auth split

## 2026-04-17 Audit Evidence

- API auth:
  `apps/api/src/platform_api/routes/internal/internal_agent_config.py`
  validates `PLATFORM_API_METRICS_TOKEN` for `/metrics`, with legacy fallback
  only when the metrics token is absent.
- API mount:
  `apps/api/src/platform_api/main.py` wires `/metrics` through the narrow
  metrics-token dependency.
- Tests:
  `apps/api/tests/unit/test_internal_token_auth.py` proves the metrics token
  does not authorize broader internal routes.
- GCP production scrape:
  `infrastructure/kubernetes/overlays/gcp/production/observability/podmonitoring-platform-api.yaml`
  and
  `infrastructure/kubernetes/overlays/gcp/production/observability/rbac-platform-api-metrics-token.yaml`.
- Secret rendering:
  `tools/scripts/infra/k8s-runtime-secrets.sh` requires
  `PLATFORM_API_METRICS_TOKEN` for the GCP production overlay.

## References

- Milestone: [M39-nfq-gcp-observability-hardening.md](../../milestones/M39-nfq-gcp-observability-hardening.md)
- Related: [launch-observability-alert-matrix.md](../../../wiki/design-docs/launch-observability-alert-matrix.md)
