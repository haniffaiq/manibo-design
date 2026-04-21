# T02: SOPS-encrypt temporal-postgres-app

> **Milestone**: M26.11-staging-bootstrap
> **Status**: Completed
> **Estimate**: S (< 2h)
> **Depends on**: T01

---

## Description

Migrate `temporal-postgres-app` from plaintext `stringData` to SOPS-encrypted
under the staging age key provisioned in T01. The `temporal` role is created
without a password in `cluster-platform-postgres.yaml` postInitSQL
(`CREATE ROLE temporal WITH LOGIN`); CNPG's `managed.roles[]` stanza then
syncs the password from `temporal-postgres-app`. The SOPS Secret is the
sole owner of the temporal DB credential — no plaintext matching literal
in postInitSQL.

The old plaintext file
(`overlays/hetzner/staging/secret-temporal-postgres-app.yaml`) is removed.
The new encrypted file lands alongside the other runtime secrets at
`overlays/hetzner/staging/secrets/temporal-postgres-app.sops.yaml`, covered
by the `.sops.yaml` creation rule introduced in T01.

`decryption.provider: sops` is already wired into the staging-data
Kustomization by T01, so this task only needs the file migration and the
Flux data kustomization resource list update.

## Subtasks

- [x] Re-encrypt the Secret under the staging age key.
- [x] Remove the plaintext `secret-temporal-postgres-app.yaml`.
- [x] Update `flux/clusters/staging/data/kustomization.yaml` to reference the
  new path.
- [x] Drop the "SOPS-migrated in T02" comment on `cluster-platform-postgres.yaml`
  now that the migration has landed.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/kubernetes/overlays/hetzner/staging/secrets/temporal-postgres-app.sops.yaml` | Create | SOPS-encrypted under staging age key; sole owner of the temporal role's password, synced by CNPG `managed.roles[].passwordSecret` |
| `infrastructure/kubernetes/overlays/hetzner/staging/secret-temporal-postgres-app.yaml` | Delete | Plaintext file retired |
| `infrastructure/kubernetes/flux/clusters/staging/data/kustomization.yaml` | Modify | Swap the plaintext reference for the SOPS path |
| `infrastructure/kubernetes/overlays/hetzner/staging/cluster-platform-postgres.yaml` | Modify | Update comment to reflect the SOPS'd state |
| `docs/tasks/M26.11/PROGRESS.md` | Modify | Flip T02 status to Completed |
| `docs/tasks/M26.11/T02-sops-encrypt-temporal-postgres.md` | Create | This file |

## Acceptance Criteria

- [x] No plaintext `stringData` remains in committed Secret manifests under
  `overlays/hetzner/staging/`.
- [x] `tools/scripts/infra/validate-k8s-overlays.sh` passes.

## References

- Milestone: [M26.11-staging-bootstrap.md](../../milestones/M26.11-staging-bootstrap.md)
- T01 (SOPS age key): [T01-sops-age-key-and-runtime-secrets.md](T01-sops-age-key-and-runtime-secrets.md)
