# T02c: Single CNPG cluster with two databases, Temporal rewire

> **Milestone**: M26.9-staging-cluster-and-post-merge-e2e
> **Status**: Not started
> **Estimate**: M (3-4h)
> **Depends on**: T02b (staging overlay exists and takes HTTP traffic)

---

## Description

Collapse staging's stateful surface from prod's two CNPG clusters
(`platform-postgres`, `temporal-postgres`) down to ONE cluster with
TWO logical databases (`grove` and `temporal`). Rewire Temporal to
connect to that single host. This is the design decision #2 in the
milestone: halve the stateful surface so the single staging node
carries both.

## Subtasks

- [ ] **Single CNPG cluster manifest** at
  `overlays/hetzner/staging/cluster-platform-postgres.yaml` that:
  - 1 instance (vs prod's 2-3)
  - `bootstrap.initdb.postInitApplicationSQL` to create the
    `temporal` and `temporal_visibility` databases alongside the
    default `grove` application database.
  - Storage class: whatever `enable_local_storage` exposes on the
    kube-hetzner-managed k3s (likely `local-path`). Size: 10Gi.
  - `monitoring.enablePodMonitor: true` so T02d's Prometheus scrapes it.
- [ ] **patch-temporal-values.yaml** — Helm values patch that points
  Temporal at the `platform-postgres-rw` Service instead of the
  non-existent `temporal-postgres` Service, with distinct
  `temporal`/`temporal_visibility` DB names.
- [ ] **Delete prod's temporal-postgres** from the staging overlay via
  `$patch: delete`. Prod manifest stays; staging drops the reference.
- [ ] **No backups** for staging CNPG (design decision #6). Delete the
  prod `ScheduledBackup` via `$patch: delete` in staging overlay.
- [ ] **Secrets** for the CNPG superuser + app roles committed
  SOPS-encrypted under
  `overlays/hetzner/staging/secrets/cluster-platform-postgres-*.sops.yaml`.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `overlays/hetzner/staging/cluster-platform-postgres.yaml` | Create | 1-instance CNPG cluster with two databases via `postInitApplicationSQL`. |
| `overlays/hetzner/staging/patch-temporal-values.yaml` | Create | Temporal Helm values patch pointing at `platform-postgres-rw` + new DB names. |
| `overlays/hetzner/staging/patch-delete-temporal-postgres.yaml` | Create | Deletes prod's temporal-postgres CNPG from the rendered overlay. |
| `overlays/hetzner/staging/patch-delete-scheduledbackup-platform-postgres.yaml` | Create | Deletes the prod ScheduledBackup. |
| `overlays/hetzner/staging/patch-delete-scheduledbackup-temporal-postgres.yaml` | Create | Deletes the prod ScheduledBackup for temporal-postgres. |
| `overlays/hetzner/staging/secrets/cluster-platform-postgres-superuser.sops.yaml` | Create (encrypted) | SOPS-encrypted superuser secret for staging CNPG. |
| `overlays/hetzner/staging/secrets/cluster-platform-postgres-app.sops.yaml` | Create (encrypted) | SOPS-encrypted app role secret. |
| `overlays/hetzner/staging/kustomization.yaml` | Modify | Add the new resources and delete-patches. |

## Implementation Notes

1. **`postInitApplicationSQL`** runs once at initdb. Form:
   ```sql
   CREATE DATABASE temporal;
   CREATE DATABASE temporal_visibility;
   ```
   `grove` is created by the standard CNPG `bootstrap.initdb.database`
   field. Temporal schema migration is Temporal's problem; it handles
   schema creation inside the named DBs on startup.
2. **Temporal's connection config** in prod uses a connection pool per
   shard. Staging keeps the same pool shape but points at the single
   Service. Do not remove pool sizing; just change the host.
3. **Deletion via `$patch: delete`** is the kustomize idiom for
   removing resources from a base. Prefer it over copying the base and
   editing in place, because every prod-side change to those resources
   automatically applies to staging otherwise.
4. **No backups on staging.** If staging corrupts, T07's rebuild
   target repopulates from a fixture dump.
5. **StorageClass** is `local-path` on single-node k3s with
   `enable_local_storage = true`. If that changes (e.g., we pull in
   Hetzner CSI later), update the CNPG manifest's storage class.
6. **Single-instance CNPG** loses primary failover. That is the
   explicit design call — staging is disposable.

## Acceptance Criteria

- [ ] `kubectl kustomize .../staging/` renders exactly ONE CNPG
  `Cluster` resource named `platform-postgres` with `instances: 1`
  and the two extra databases in `postInitApplicationSQL`.
- [ ] The rendered output contains ZERO `temporal-postgres` CNPG
  resources and ZERO `ScheduledBackup` resources.
- [ ] Temporal's Helm values in the rendered output point at
  `platform-postgres-rw.platform.svc.cluster.local` (or whatever the
  prod service DNS shape is).
- [ ] SOPS round-trip works on both new secrets.
- [ ] Prod overlay untouched.
- [ ] PR diff stays inside the small-PR budget.

## Verification

```bash
# Exactly one CNPG cluster
kubectl kustomize infrastructure/kubernetes/overlays/hetzner/staging/ \
  | yq 'select(.kind == "Cluster" and .apiVersion == "postgresql.cnpg.io/v1") | .metadata.name' \
  | sort -u
# -> platform-postgres

# Two extra databases in initdb
kubectl kustomize infrastructure/kubernetes/overlays/hetzner/staging/ \
  | yq 'select(.metadata.name == "platform-postgres") | .spec.bootstrap.initdb.postInitApplicationSQL'
# -> includes CREATE DATABASE temporal; and CREATE DATABASE temporal_visibility;

# No ScheduledBackup
kubectl kustomize infrastructure/kubernetes/overlays/hetzner/staging/ \
  | yq 'select(.kind == "ScheduledBackup") | .metadata.name'
# -> (empty)

# SOPS decrypt round-trip
sops --decrypt overlays/hetzner/staging/secrets/cluster-platform-postgres-superuser.sops.yaml > /dev/null
```

## References

- Milestone: [M26.9-staging-cluster-and-post-merge-e2e.md](../../milestones/M26.9-staging-cluster-and-post-merge-e2e.md) (Design Decision #2)
- Prod CNPG example: `overlays/hetzner/production/data-cnpg/cluster-platform-postgres.yaml`
- Prod Temporal values: `overlays/hetzner/production/helm-values/temporal.values.yaml`
- Depends on: T02b
- Follow-ups: T02d
