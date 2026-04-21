# M26.11 Staging Cluster Bootstrap — Progress

## Status

Code work for T01-T04 landed on `feat/M26.11-staging-bootstrap` in
PR #949 (open) on 2026-04-20. Follow-up to M26.9 (PRs #921, #923, #931,
#937). The scaffolding from M26.9 could not make staging reconcile
cleanly; M26.11 closes the SOPS, runtime-secrets, release-images, and
staging-e2e gaps so `flux bootstrap` against the live cluster becomes
viable.

T05 (Alertmanager Slack receiver) and T06 (schema-aligned fixture) are
deferred to a second commit on the same milestone branch once the
operator has the Slack webhook URL and the live DB schema to target.
T07 (verification + wiki sync) runs after `flux bootstrap` succeeds.

## Task Status

| Task | Title | Status | Completed |
|---|---|---|---|
| T01 | SOPS age key + encrypted runtime secrets | Completed | 2026-04-20 |
| T02 | SOPS-encrypt temporal-postgres-app + re-enable sops decryption | Completed | 2026-04-20 |
| T03 | Staging-specific release-images.yaml + publish-platform-images update | Completed | 2026-04-20 |
| T04 | Re-enable staging-e2e push:main trigger (predecessor-main model; PR-head gate deferred) + remove release-pin auto-merge | Completed | 2026-04-20 |
| T05 | Alertmanager staging receiver wiring | Not started | — |
| T06 | Schema-aligned fixture + remove STAGING_SEED_CONFIRM guard | Not started | — |
| T07 | Verification + wiki sync | Not started | — |

## Notes

1. M26.11 is the prerequisite for M26.9 T05 and T06 (retire CI-embedded
   k3d in merge-gate and flux-production-deploy). Those retirements
   are gated on ≥10 green staging-e2e runs; staging-e2e cannot be
   reliably green without M26.11.
2. No terraform changes expected. Cluster already provisioned at
   floating IPv4 `88.198.124.209` (M26.9 T01 / PR #921).
3. Operator-owned pre-work (per `wiki/ops/hetzner-staging-cluster.md`
   "SOPS age key provisioning"): keep the private age key locally at
   `~/.config/sops/age/manibo-staging.txt` (source of truth) and copy
   it into the cluster Secret `sops-age` in `flux-system` (the only
   read path Flux needs). No `SOPS_AGE_KEY` GitHub env secret until a
   workflow actually needs it and protection rules are enforced.

## Bootstrap execution log

Live cluster bootstrap sequence from `wiki/ops/hetzner-staging-cluster.md`.
Each entry records what actually executed against the cluster, not what
the code landed.

### 2026-04-20

- [x] **Step 1 — local key file.**
  `~/.config/sops/age/manibo-staging.txt` written (mode 600, 189 bytes).
  Public key `age1yaku9ttstv8jgcfqkqrzygfyqun87ujlnxx89va98d4qpvdq8c2qs5slz4`.
- [x] **Step 2 — cluster Secret.** `flux-system` namespace created on the
  staging cluster (API server `https://178.104.202.217:6443`). Secret
  `sops-age` created under data key `age.agekey`; verified via
  `kubectl -n flux-system get secret sops-age -o jsonpath='{.data}' | jq 'keys'`.
- [x] **Step 3 — GitHub env.** Environment `hetzner-staging` created on
  `jakit-labs/manibo` (id 14349465180). No secrets currently stored — an
  earlier iteration uploaded `SOPS_AGE_KEY` but deleted it again after
  the review bot correctly flagged it as unprotected blast radius (no
  workflow currently reads it; Flux decrypts via the cluster Secret, not
  the env). When a future workflow needs the key, re-upload under a
  protection rule (required reviewers + branch policy restricted to
  `main`).
- [x] **Step 4a — `sops` edit `platform-runtime-secrets.sops.yaml`.**
  Pasted runtime `OBJECT_STORAGE_ACCESS_KEY` / `OBJECT_STORAGE_SECRET_KEY`
  plus the `APP_*` / `BACKUP_*` aliases from the
  `OBJECT_STORAGE_STAGING_*` entries in
  `/Users/jakit/customers/jakit/manibo/.env`. Kept `GHCR_PULL_USERNAME`
  / `GHCR_PULL_PASSWORD` as reference-only placeholders — Kubernetes
  pulls private images through `imagePullSecrets: ghcr-pull-secret`,
  NOT through runtime-config env vars. Verified encrypted output
  contains no plaintext credential bytes.
- [ ] **Operator PAT hygiene rotation.** Branch history was squashed
  (see round 5 of PR #949) so the intermediate encrypted blob is no
  longer on the reachable branch graph. Rotation of the underlying
  `gh auth token` is captured as a post-merge adhoc task so the
  operator can run `gh auth logout` + `gh auth login` with narrower
  scopes after the bootstrap is live: [AH-2026-04-20-rotate-operator-gh-pat.md](../adhoc/AH-2026-04-20-rotate-operator-gh-pat.md).
  Not a merge blocker — practical exposure is gated on both the SOPS
  ciphertext (dangling commits on GitHub, gc'd within weeks) AND the
  staging age private key (only on the operator workstation and the
  cluster Secret).
- [ ] **Step 4b — `sops` edit `ghcr-pull-secret.sops.yaml`** (authoritative
  pull credential). Blocked on operator minting a dedicated
  `read:packages`-only PAT (fine-grained or classic) and rewriting
  `.dockerconfigjson` per the runbook "Regenerate `ghcr-pull-secret.sops.yaml`"
  section. The file ships with a
  `simjak:STAGING-TODO-…` placeholder `.dockerconfigjson`; unchanged,
  staging pods will `ImagePullBackOff` against the private GHCR images.
- [ ] **Step 5 — `flux bootstrap github`.** Ready to execute once
  PR #949 merges AND Step 4b is done + committed. Run from the
  operator workstation with `KUBECONFIG=~/.kube/manibo-staging.kubeconfig`
  and `GITHUB_TOKEN` set to a freshly-minted PAT with **only** `repo`
  scope.
