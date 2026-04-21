# M26.3: Infrastructure Directory Structure + Migration — Progress

## Status

Completed on 2026-04-02. The human explicitly activated M26.3 after the
planning backlog landed on `main`, and T01-T10 now close the path-contract
migration slice for checklist row `L63`, keeping infrastructure ownership, the
active SOPS contract, and the retained legacy scaffolding honest.

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Create the canonical `infrastructure/` root contract and skeleton | Done | 2026-04-02 |
| T02 | Rehome Hetzner Terraform and Hetzner-only shared stacks | Done | 2026-04-02 |
| T03 | Rehome GCP Terraform into provider-isolated modules and environment roots | Done | 2026-04-02 |
| T04 | Rehome SOPS policy/config and secret-path contracts under `infrastructure/sops` | Done | 2026-04-02 |
| T05 | Rehome Kubernetes shared base plus local and CI overlays | Done | 2026-04-02 |
| T06 | Rehome Hetzner and GCP Kubernetes overlays with provider-specific data boundaries | Done | 2026-04-02 |
| T07 | Rehome Flux cluster roots and release-image wiring under `kubernetes/flux` | Done | 2026-04-02 |
| T08 | Classify script ownership and update scripts, workflows, tests, and docs to the new infrastructure paths | Done | 2026-04-02 |
| T09 | Verification, old-path cleanup, and proof capture | Done | 2026-04-02 |
| T10 | Classify and migrate or quarantine remaining legacy `infra/environments` roots | Done | 2026-04-02 |

## Notes

1. Shared Kubernetes `base/` stays database-agnostic. Hetzner owns CNPG manifests; GCP owns Cloud SQL in Terraform and only carries workload connectivity overlays.
2. `ci-runner` stays under Hetzner Terraform because the current stack is Hetzner-only.
3. Repo-owned SOPS policy moves under `infrastructure/sops/**` for every moved secret-bearing path, including local/CI overlay secrets, active Flux cluster secrets, and Hetzner/GCP provider-owned secret paths, while provider-specific backend bootstrap stays under the owning provider Terraform tree.
4. The migration is path-contract work, not a disguised platform-feature milestone.
5. Script moves are selective. Repo-wide CI and harness tooling can stay in `tools/scripts/**`; only environment-owned operational scripts belong under `infrastructure/scripts/**`.
6. Intended downstream checklist rows when implementation is activated: 62, 63, 64, and 70. This planning backlog does not by itself advance any of them; any later implementation PR must cite the exact checklist row it materially improves and include proof.
7. Remaining `infra/environments/local/**`, `infra/environments/ci/**`, `infra/environments/shared/**`, and `infra/environments/tenants/**` roots are real tracked paths and must be migrated or explicitly quarantined before old-tree deletion is allowed.
8. T02 moved the Hetzner Terraform/support-stack roots into `infrastructure/terraform/hetzner/**`, but left `infra/environments/hetzner/production/{k8s,helm-values}` in place on purpose. T06 still owns those runtime surfaces.
9. T04 moved the live SOPS config to `infrastructure/sops/.sops.yaml`, rewrote its live path rules and caller overrides to use repo-relative `infrastructure/**` destinations, and rewired direct consumers without moving provider-specific Vault bootstrap out of Hetzner Terraform.
10. T05 moved the shared local/CI Kubernetes surface under `infrastructure/kubernetes/**`, split the old mixed `base` package into `base/platform/**` and `base/workloads/**`, rehomed local/offline/CI overlays to `overlays/local/{default,offline}` and `overlays/ci`, and updated first-order scripts, workflows, classifiers, tests, and active operator docs in the same commit.
11. T03 moved the live GCP Terraform env wrappers under `infrastructure/terraform/gcp/**`; the 2026-04-03 follow-up promoted the last shared wrapper into `infrastructure/terraform/gcp/nfq/modules/shared-k8s/**`, and the 2026-04-14 follow-up namespaced the NFQ and Manibo GCP surfaces so Manibo-only developer access now lives under `infrastructure/terraform/gcp/manibo/**`.
12. T06 moved the live Hetzner production overlay and Helm values to `infrastructure/kubernetes/overlays/hetzner/production/**`, duplicated CNPG manifests into the local/default, CI, and Hetzner overlays so the shared base stopped pretending database ownership was generic, rewired first-order scripts/workflows/tests/docs, and intentionally left `infrastructure/kubernetes/overlays/gcp/**` absent because the repo still has no real GCP-specific Kubernetes surface.
13. T07 moved the live Flux cluster root from `clusters/production/**` to `infrastructure/kubernetes/flux/clusters/production/**`, rewired the production deploy/bootstrap/release-pin contracts to the new root, and kept the release-image fast-track policy pinned to the moved `apps/release-images.yaml` path instead of the retired cluster tree.
14. T08 moved the Hetzner production and shared-stack operational entrypoints into `infrastructure/scripts/hetzner/**`, rewired live workflows/docs/tests to those owned paths, and documented why shared CI control-plane helpers still stay under `tools/scripts/**`.
15. T10 originally quarantined the remaining legacy `infra/environments/{local,ci,shared,tenants}` roots plus `infra/environments/hetzner/staging/**`; the 2026-04-03 follow-up finished the migration and removed those trees after their live dependencies moved.
16. T09 reran representative Terraform, kustomize, and architecture proof from the migrated tree, and the 2026-04-03 follow-up deleted the remaining top-level `infra/` and `clusters/` scaffolding only after recording live `manibo-production` cutover proof (proof YAML since removed after merge).
