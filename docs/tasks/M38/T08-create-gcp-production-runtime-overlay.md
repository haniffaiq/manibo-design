# T08: Create The GCP Production Runtime Overlay

> **Milestone**: M38-nfq-gcp-bootstrap
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T05, T07

---

## Description

Add the missing Kubernetes runtime surface under
`infrastructure/kubernetes/overlays/gcp/production` so NFQ can boot
internally on the live private GKE cluster without depending on Hetzner,
Flux/SOPS, GHCR pull secrets, in-cluster Postgres, or public DNS.

## Subtasks

- [x] **Create the overlay tree**: add `kustomization.yaml`, runtime patches,
      image pins, and a secret example for GCP production.
- [x] **Wire workloads to GCP runtime assumptions**: remove MinIO/public
      ingress, stop hardcoding in-cluster Postgres service names, drop
      `SKIP_AUTH`, and bind the live workload KSAs.
- [x] **Keep the first slice intentionally small**: internal-first runtime only
      for `platform-api`, `platform-web`, `platform-temporal-worker`, and
      `agent-worker`; no public ingress or voice-stack bootstrap in this task.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/kubernetes/overlays/gcp/production/kustomization.yaml` | Create | Compose the internal-first GCP runtime overlay and hold immutable GAR image pins via the `images:` block |
| `infrastructure/kubernetes/overlays/gcp/production/*.yaml` | Create | Runtime patches for Cloud SQL config, workload KSAs, and deleted Hetzner-only resources |
| `infrastructure/kubernetes/overlays/gcp/production/secrets.env.example` | Create | First-boot runtime secret contract for the GCP overlay |

## Implementation Notes

- Use the live Cloud SQL private IP in the runtime config until a better
  indirection exists.
- Assume direct private-IP connectivity from GKE to Cloud SQL; do not add a
  Cloud SQL Proxy sidecar unless a concrete auth/network requirement forces it.
- Keep recordings on `http_passthrough` for the first slice; do not pretend a
  GCS signed-URL provider already exists.
- Do not reuse the Hetzner node selectors or GHCR pull-secret assumptions.

## Acceptance Criteria

- [x] `kustomize build infrastructure/kubernetes/overlays/gcp/production`
      renders successfully.
- [x] The overlay deletes MinIO and public ingress resources and does not
      reference `ghcr-pull-secret`.
- [x] Runtime config and workload patches target the live GCP baseline
      instead of Hetzner/CNPG service names.

## References

- Milestone: [M38-nfq-gcp-bootstrap.md](../../milestones/M38-nfq-gcp-bootstrap.md)
- Design: [wiki/queries/2026-04-13-design-nfq-gke-runtime-overlay.md](../../../wiki/queries/2026-04-13-design-nfq-gke-runtime-overlay.md)
