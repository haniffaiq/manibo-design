# T11: Split GCP Observability Into Internal And Public Surfaces

> **Milestone**: M38-nfq-gcp-bootstrap
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T04, T10

---

## Description

Split the GCP observability surface so SRE-visible infra, workload, and
Temporal-worker voice-quality alerts can land before public DNS exists.
Enable managed Prometheus on GKE, add scrape resources for the GCP runtime
overlay, and keep the public-hostname checks separate until ingress is real.

## Subtasks

- [x] **Terraform split**: replace the mixed observability module with
      `observability_internal_safe` and `observability_public_edge`.
- [x] **Metrics plumbing**: enable managed Prometheus on GKE and add GCP
      `PodMonitoring` resources for the Temporal worker, while leaving API
      scrape auth/wiring deferred to M39.
- [x] **Operational proof**: render the GCP overlay, validate the Terraform
      platform roots, and update milestone/progress/docs with the split and
      remaining live inputs.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/gcp/nfq/modules/gke_cluster/main.tf` | Modify | Enable managed Prometheus on GKE |
| `infrastructure/terraform/gcp/nfq/modules/gke_cluster/variables.tf` | Modify | Add managed Prometheus toggle |
| `infrastructure/terraform/gcp/nfq/modules/observability_internal_safe/**` | Create | Internal-safe alerts and dashboard |
| `infrastructure/terraform/gcp/nfq/modules/observability_public_edge/**` | Create | Public-edge uptime/LB alerts and dashboard |
| `infrastructure/terraform/gcp/nfq/environments/{production,staging}/platform/main.tf` | Modify | Wire the split modules into each platform root |
| `infrastructure/terraform/gcp/nfq/environments/{production,staging}/platform/variables.tf` | Modify | Define split observability inputs |
| `infrastructure/terraform/gcp/nfq/environments/{production,staging}/*.tfvars.example` | Modify | Carry internal-safe thresholds and public-edge toggle |
| `infrastructure/kubernetes/overlays/gcp/production/observability/**` | Create | PodMonitoring resources for managed Prometheus |
| `tools/scripts/infra/k8s-runtime-secrets.sh` | Modify | Render the API metrics token into namespace `platform` |
| `wiki/design-docs/launch-observability-alert-matrix.md` | Modify | Mark implemented split and rollout status |
| `docs/tasks/M38/PROGRESS.md` | Modify | Record evidence and blockers |
| `docs/milestones/M38-nfq-gcp-bootstrap.md` | Modify | Extend milestone acceptance and verification |

## Implementation Notes

- Keep the public-edge slice disabled by default until the final NFQ public
  hostnames and ingress inputs exist.
- Use PromQL-backed Cloud Monitoring alerts only for metrics the platform
  already emits today.
- Prefer one operator-facing SRE dashboard over many narrow dashboards at this
  stage.

## Acceptance Criteria

- [x] The `platform` Terraform roots separate internal-safe monitoring from
      public-edge monitoring.
- [x] GKE managed Prometheus is enabled and the GCP production overlay includes
      scrape resources for Temporal worker metrics, with API scrape coverage
      explicitly deferred to M39.
- [x] Internal-safe alerting covers infra, workload, and Temporal-worker
      voice-quality signals without depending on public DNS.
- [x] Public-edge checks stay explicitly deferred until DNS / ingress inputs
      exist.
- [x] Terraform validation and overlay render proof are recorded in milestone
      progress.

## References

- Milestone: [M38-nfq-gcp-bootstrap.md](../../milestones/M38-nfq-gcp-bootstrap.md)
- Design doc: [launch-observability-alert-matrix.md](../../../wiki/design-docs/launch-observability-alert-matrix.md)
- Related tasks:
  [T04-implement-platform-root-with-ci-gke-cloudsql-and-dns.md](T04-implement-platform-root-with-ci-gke-cloudsql-and-dns.md),
  [T10-verify-gcp-runtime-overlay-and-document-first-boot.md](T10-verify-gcp-runtime-overlay-and-document-first-boot.md)
