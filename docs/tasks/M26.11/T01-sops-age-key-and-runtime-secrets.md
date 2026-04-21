# T01: SOPS age key + encrypted staging runtime secrets

> **Milestone**: M26.11-staging-bootstrap
> **Status**: In Progress
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Description

Introduce a staging-scoped SOPS age keypair and commit SOPS-encrypted versions
of the four Secret manifests the staging data layer needs before Flux can
reconcile cleanly:

- `platform-runtime-secrets` — omnibus runtime secret mounted by platform-api,
  agent-worker, temporal-worker, MinIO, livekit-sip. Schema matches the prod
  runtime-secrets file but ships placeholder values (`STAGING-TODO-*`) for
  keys the operator pastes at bootstrap and empty strings for voice/OIDC keys
  deferred to later surfaces.
- `platform-web-runtime-secrets` — subset mounted by platform-web (OIDC + web
  session).
- `platform-postgres-app` / `platform-postgres-superuser` — basic-auth Secrets
  so the CNPG Cluster picks up deterministic passwords that match
  `DATABASE_URL` / `AUDIT_DB_URL` in `platform-runtime-secrets`.

`temporal-postgres-app` stays plaintext in this task; M26.11 T02 migrates it
to SOPS alongside a decryption re-verification.

## Subtasks

- [x] **Generate staging age keypair**: `age-keygen` run locally; public half
  added to `infrastructure/sops/.sops.yaml` creation rule; private half
  handed to the operator via the runbook. The key lives in two places:
  the operator local file (`~/.config/sops/age/manibo-staging.txt`,
  mode 600, source of truth) and the cluster Secret `sops-age` in
  `flux-system`. No GitHub env secret for `SOPS_AGE_KEY` until a
  workflow actually needs it and protection rules are enforced.
- [x] **Add `.sops.yaml` creation rule**: new entry targeting
  `infrastructure/kubernetes/overlays/hetzner/staging/secrets/.*\.sops\.ya?ml$`
  under the new staging age public key.
- [x] **SOPS-encrypt runtime secrets**: four Secret manifests written
  plaintext, encrypted with `sops --config infrastructure/sops/.sops.yaml
  --encrypt --filename-override …`, plaintext discarded.
- [x] **Switch CNPG Cluster to explicit secretRefs**: add
  `superuserSecret.name: platform-postgres-superuser` and
  `bootstrap.initdb.secret.name: platform-postgres-app` so CNPG honours the
  passwords we encode in the Secrets (otherwise CNPG auto-generates a random
  password that would not match `DATABASE_URL`).
- [x] **Enable SOPS decryption on staging-data Kustomization**: add
  `spec.decryption.provider: sops` with `secretRef.name: sops-age`; add a
  CNPG Cluster `healthCheck` so Flux waits for `platform-postgres` to be
  Ready before marking the data layer Ready.
- [x] **Include encrypted Secrets in data layer kustomization**: four new
  resources added to `flux/clusters/staging/data/kustomization.yaml`.
- [x] **Document operator bootstrap steps**: runbook updated with the
  two places the private key lives (local file + cluster Secret), the
  `STAGING-TODO` values to paste, the separate `ghcr-pull-secret.sops.yaml`
  rewrite step, and the `flux bootstrap github` invocation plus expected
  ready-state check.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/sops/.sops.yaml` | Modify | Add creation rule for `overlays/hetzner/staging/secrets/` under the new staging age public key |
| `infrastructure/kubernetes/overlays/hetzner/staging/secrets/platform-runtime-secrets.sops.yaml` | Create | SOPS-encrypted omnibus runtime secret (schema aligned with prod) |
| `infrastructure/kubernetes/overlays/hetzner/staging/secrets/platform-web-runtime-secrets.sops.yaml` | Create | SOPS-encrypted web-facing runtime secret |
| `infrastructure/kubernetes/overlays/hetzner/staging/secrets/platform-postgres-app.sops.yaml` | Create | SOPS-encrypted CNPG app-user credential so DATABASE_URL is deterministic |
| `infrastructure/kubernetes/overlays/hetzner/staging/secrets/platform-postgres-superuser.sops.yaml` | Create | SOPS-encrypted CNPG superuser credential |
| `infrastructure/kubernetes/overlays/hetzner/staging/cluster-platform-postgres.yaml` | Modify | Add `superuserSecret` + `bootstrap.initdb.secret` so CNPG uses the pre-set passwords |
| `infrastructure/kubernetes/flux/clusters/staging/data-kustomization.yaml` | Modify | Enable `decryption.provider: sops` + add CNPG `healthChecks` |
| `infrastructure/kubernetes/flux/clusters/staging/data/kustomization.yaml` | Modify | Add four new SOPS Secret resources |
| `wiki/ops/hetzner-staging-cluster.md` | Modify | Operator bootstrap: age key provisioning, `STAGING-TODO` paste step, `flux bootstrap` invocation |
| `docs/tasks/M26.11/T01-sops-age-key-and-runtime-secrets.md` | Create | This file |
| `docs/tasks/M26.11/PROGRESS.md` | Modify | Flip T01 status to Completed |

## Implementation Notes

- The staging age **private key** is never committed. After `age-keygen`,
  the key file lives at `~/.config/sops/age/manibo-staging.txt` on the
  operator workstation (mode 600, source of truth). The cluster Secret
  `sops-age` in `flux-system` is a copy installed via `kubectl create
  secret generic sops-age --from-file=age.agekey=…`; that copy is the
  only read path Flux needs. No GitHub env secret for the private key
  is provisioned until a workflow actually needs to decrypt SOPS files
  at CI time AND protection rules can be enforced.
- SOPS `creation_rules` in `infrastructure/sops/.sops.yaml` match against the
  OUTPUT path, so the encrypt command needs `--filename-override <dst>`
  (`<src>` is the plaintext file, `<dst>` ends in `.sops.yaml`).
- Hardcoded bootstrap passwords are acceptable here — the SOPS-encrypted
  Secrets make them no more exposed than any other staging credential, and
  operator procedure can rotate them post-bootstrap via `cnpg` plugin if
  desired. Determinism matters more: `DATABASE_URL` in
  `platform-runtime-secrets` MUST match the CNPG-managed role password or
  platform-api fails to connect.
- `platform-postgres-app` uses `type: kubernetes.io/basic-auth`, which CNPG
  honours for pre-existing Secrets referenced via `bootstrap.initdb.secret`.
  CNPG adds `pgpass`/`uri`/`jdbc-uri` fields after initdb runs — do not
  hand-add them here.

## Acceptance Criteria

- [x] `tools/scripts/infra/validate-k8s-overlays.sh` passes (all staging Flux
  paths + hetzner/staging overlay build cleanly).
- [x] `sops --decrypt` on each `*.sops.yaml` succeeds when
  `SOPS_AGE_KEY_FILE` points at the staging private key.
- [x] Runbook describes the two destinations the private key lives in
  (local file + cluster `sops-age` Secret) and the `flux bootstrap`
  command; operator can follow it without asking.

## References

- Milestone: [M26.11-staging-bootstrap.md](../../milestones/M26.11-staging-bootstrap.md)
- Prior milestone (scaffolding): [M26.9-staging-cluster-and-post-merge-e2e.md](../../milestones/M26.9-staging-cluster-and-post-merge-e2e.md)
- Runbook: [wiki/ops/hetzner-staging-cluster.md](../../../wiki/ops/hetzner-staging-cluster.md)
