# T01: Codify ESO, Secret Manager Bundles, and Reloader Wiring

> **Milestone**: M38.2-nfq-gcp-secret-manager-sync
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: M38.1

## Description

Install the production secret-sync control plane through Terraform inputs and
add GCP production Kubernetes manifests for Secret Manager-backed runtime
Secrets.

## Subtasks

- [x] **Terraform controllers**: Add ESO and Reloader Helm addons to NFQ GCP
      production bootstrap inputs.
- [x] **Workload Identity and IAM**: Add an ESO workload identity and Secret
      Manager accessors for runtime secret bundles.
- [x] **Kubernetes sync resources**: Add the ClusterSecretStore, ExternalSecrets,
      and Reloader annotations to the production overlay.
- [x] **Alert coverage**: Add NFQ/GCP alert policies for ESO/Reloader
      availability, restarts, ExternalSecret readiness, and ClusterSecretStore
      readiness.
- [x] **Legacy writer guard**: Block direct Kubernetes runtime Secret apply for
      GCP production so Secret Manager/ESO remains the only writer.
- [x] **Architecture proof**: Add/extend namespaced NFQ/GCP architecture tests.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/gcp/nfq/environments/production/production.tfvars.example` | Modify | Codify controllers, namespace, Workload Identity, and secret bundle accessors |
| `infrastructure/terraform/gcp/nfq/modules/workloads_bootstrap/main.tf` | Modify | Ensure addon Helm releases wait for Terraform-managed service accounts |
| `infrastructure/kubernetes/overlays/gcp/production/external-secrets/**` | Create | ESO store and ExternalSecret manifests |
| `infrastructure/kubernetes/overlays/gcp/production/secret-sync-observability/**` | Create | Google Managed Prometheus PodMonitoring for ESO and Reloader |
| `infrastructure/kubernetes/overlays/gcp/production/patch-*.yaml` | Modify | Add Reloader annotations |
| `infrastructure/terraform/gcp/nfq/modules/observability_internal_safe/**` | Modify | Add secret-sync alert policies |
| `tools/scripts/infra/k8s-runtime-secrets.sh` | Modify | Refuse direct runtime Secret apply for GCP production |
| `tests/architecture/nfq/gcp/test_production_overlay_runtime_contracts.py` | Modify | Guard NFQ/GCP secret sync contract |
| `tests/architecture/test_k8s_runtime_secrets_apply.py` | Modify | Guard the GCP production apply refusal |

## Acceptance Criteria

- [x] `kubectl kustomize infrastructure/kubernetes/overlays/gcp/production`
      renders the store and ExternalSecrets.
- [x] Namespaced NFQ/GCP architecture tests pass.
- [x] No secret payloads are committed or printed.
- [x] GCP production runtime Secret apply refuses to write ESO-owned Kubernetes
      Secrets.

## Completion Evidence

- Render proof:
  `kubectl kustomize infrastructure/kubernetes/overlays/gcp/production`
  includes `ClusterSecretStore`, runtime `ExternalSecret` resources, and
  Reloader annotations.
- Secret-sync monitor proof:
  the GCP production overlay renders ESO/Reloader `PodMonitoring`, and the
  NFQ/GCP observability module codifies restart, availability, and readiness
  alerts for the secret-sync path.
- Test proof:
  `uv run pytest tests/architecture/nfq/gcp/test_production_overlay_runtime_contracts.py tests/architecture/test_setup_livekit_sip.py -q`
  passed.
- Review follow-up proof:
  `uv run pytest tests/architecture/test_k8s_runtime_secrets_apply.py -q`
  passed after changing `gcp/production` apply to fail before writing
  Kubernetes Secrets.
- The architecture-test memory rule was added to
  `.skills/discipline-checklist/SKILL.md`: environment-specific infrastructure
  tests must be namespaced, for example `tests/architecture/nfq/gcp/`.

## References

- Milestone: `docs/milestones/M38.2-nfq-gcp-secret-manager-sync.md`
- Design: `wiki/design-docs/nfq-gcp-secret-manager-sync.md`
