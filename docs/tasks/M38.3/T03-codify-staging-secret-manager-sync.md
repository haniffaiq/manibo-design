# T03: Codify Staging Secret Manager, ESO, and Reloader Sync

> **Milestone**: M38.3-nfq-gcp-staging-environment
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T02

## Description

Apply the M38.2 Secret Manager pattern to NFQ GCP staging. Staging runtime
Secrets must be sourced from GCP Secret Manager, synced by External Secrets
Operator through Workload Identity, and rolled by Reloader when versions change.

## Subtasks

- [ ] **Secret containers**: Define staging Secret Manager bundle containers
      for API, temporal worker, agent worker, web, and metrics token.
- [ ] **ESO identity**: Ensure the staging ESO Kubernetes service account maps
      to the correct staging Google service account.
- [ ] **ExternalSecrets**: Add staging `ClusterSecretStore` and
      `ExternalSecret` manifests.
- [ ] **Reloader**: Add reload annotations to staging workloads.
- [ ] **Single writer**: Block direct `k8s-runtime-secrets.sh apply` writes for
      `gcp/staging`, matching the production single-writer guard.
- [ ] **Monitoring**: Include ESO/Reloader PodMonitoring and readiness alert
      inputs for staging.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/gcp/nfq/environments/staging/staging.tfvars.example` | Modify | Staging ESO/Reloader and Secret Manager accessor inputs |
| `infrastructure/kubernetes/overlays/gcp/staging/external-secrets/**` | Create | Staging ESO store and ExternalSecrets |
| `infrastructure/kubernetes/overlays/gcp/staging/secret-sync-observability/**` | Create | Staging PodMonitoring resources |
| `infrastructure/kubernetes/overlays/gcp/staging/patch-*.yaml` | Modify | Reloader annotations |
| `tools/scripts/infra/k8s-runtime-secrets.sh` | Modify | Refuse direct apply for `gcp/staging` runtime Secrets |
| `tests/architecture/nfq/gcp/test_staging_overlay_runtime_contracts.py` | Modify | Guard staging secret-sync contract |

## Implementation Notes

- Do not copy production Secret Manager payloads.
- Seed live staging Secret Manager versions through controlled operator
  commands that do not print payloads.
- Bad Secret Manager versions can roll pods quickly; treat updates as deploys.

## Acceptance Criteria

- [ ] Staging overlay renders the ESO store and all runtime ExternalSecrets.
- [ ] Staging workloads declare Reloader annotations for synced Secrets and
      runtime ConfigMaps.
- [ ] Direct Kubernetes Secret apply refuses the `gcp/staging` runtime overlay.
- [ ] Live staging ESO and Reloader readiness is recorded after deployment.

## References

- Milestone: `docs/milestones/M38.3-nfq-gcp-staging-environment.md`
- Related: `docs/milestones/M38.2-nfq-gcp-secret-manager-sync.md`
