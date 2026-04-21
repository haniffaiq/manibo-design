# T09: Add GCP Runtime Bootstrap And Deploy Scripts

> **Milestone**: M38-nfq-gcp-bootstrap
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T08

---

## Description

Add the first operator scripts needed to bootstrap Cloud SQL runtime users,
update GAR image pins, and apply the internal-first GCP runtime overlay plus
Temporal from an in-VPC admin surface.

## Subtasks

- [x] **Bootstrap Cloud SQL runtime users/databases**: add a script that can
      set the `postgres` password, create the `grove` / `temporal` roles, and
      create the runtime databases if they do not exist.
- [x] **Add image pin tooling**: add a GCP production image pin update script
      parallel to the Hetzner release-image updater.
- [x] **Add deploy tooling**: add a runtime deploy script that applies secrets,
      installs/upgrades Temporal, applies the GCP overlay, and waits for the
      key workloads.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/scripts/gcp/production/bootstrap-gcp-production-cloudsql.sh` | Create | Bootstrap Cloud SQL runtime users and databases |
| `infrastructure/scripts/gcp/production/update-gcp-production-release-images.sh` | Create | Update the overlay image pin file with immutable GAR refs |
| `infrastructure/scripts/gcp/production/deploy-gcp-production-runtime.sh` | Create | Apply secrets, Temporal, and the GCP overlay |
| `infrastructure/kubernetes/overlays/gcp/production/temporal.values.yaml` | Create | Manual Temporal Helm values for the first GCP runtime slice |

## Implementation Notes

- Reuse the existing `tools/scripts/infra/k8s-runtime-secrets.sh` flow instead
  of inventing another secret renderer.
- Keep the deploy script explicit about its prerequisites: private-cluster
  access, filled `secrets.env`, and image pins updated first.
- Use immutable image refs in the release pin set rather than floating tags.
  For the GCP overlay, those pins live in the overlay `kustomization.yaml`
  `images:` block rather than a separate release-image patch file.

## Acceptance Criteria

- [x] The new scripts have `bash -n` proof.
- [x] The deploy script renders a consistent sequence: secrets, Temporal, app
      overlay, rollout waits.
- [x] The image pin set can be updated non-interactively from script input.

## References

- Milestone: [M38-nfq-gcp-bootstrap.md](../../milestones/M38-nfq-gcp-bootstrap.md)
- Task: [T08-create-gcp-production-runtime-overlay.md](T08-create-gcp-production-runtime-overlay.md)
