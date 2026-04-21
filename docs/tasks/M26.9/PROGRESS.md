# M26.9: Staging Cluster and Post-Merge E2E — Progress

## Status

T01 merged 2026-04-16 (PR #921). Terraform root for the 1-node Hetzner
staging cluster is on `main`; `terraform apply` is an operator step
tracked in `wiki/ops/hetzner-staging-cluster.md`, not a task here.

T02 was split 2026-04-16 into T02a-T02d after honest scoping showed
the original "M (4-6h)" estimate hid ~1,000-1,300 LOC of Flux +
kustomize + CNPG redesign work. Each sub-task is now one reviewer-
atomic PR. See the milestone doc's Tasks section for the split rationale.

Design decisions (unchanged, all locked at milestone level):

- Node: 1x Hetzner cx33 (4 vCPU / 8 GB / 80 GB, ~€7/mo)
- Object Storage: shared with prod bucket, `staging/` key prefix
- Monitoring: in-cluster Prometheus + remote_write to prod
- Firewalls: open for PSTN + RTC (real-call testing)
- Load balancer: none; hostNetwork ingress + floating IP on node
- Secrets: SOPS + age keys, no Vault

Target staging monthly cost: ~€10 on the 2026-04-16 Hetzner pricing
snapshot (cx33 ~€7 + Floating IPv4 ~€3).

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Terraform the 1-node Hetzner staging cluster | Done | 2026-04-16 (PR #921) |
| T02a | Flux root scaffolding (dependency chain, SOPS age-key machinery) | Not started | — |
| T02b | Staging overlay foundation + hostNetwork ingress | Not started | — |
| T02c | Single CNPG cluster with two databases, Temporal rewire | Not started | — |
| T02d | In-cluster Prometheus with remote_write + staging alertmanager silence | Not started | — |
| T03 | Staging E2E workflow runs against deployed staging | Not started | — |
| T04 | Release-pin PR auto-merge gated on staging E2E + `blocks-auto-promote` label | Not started | — |
| T05 | Retire merge-gate's `Run Full K8s Runtime Proof` k3d job | Not started | — |
| T06 | Retire `flux-production-deploy.yml` `Run Full K3d E2E` job | Not started | — |
| T07 | Staging rebuild-from-fixture make target + runbook | Not started | — |
| T08 | Verification, metrics capture, wiki re-sync | Not started | — |

## Notes

1. Single-node staging (cx33, 4 vCPU / 8 GB / 80 GB, ~€7/month) is the
   explicit "start minimal" choice. Growth to 2+ nodes is a terraform diff,
   not a rebuild.
2. SOPS + age keys on staging, not Vault. Prod Vault Transit stays untouched.
3. Flux on staging watches `main` directly. Prod continues to watch
   `prod-release/{sha}` refs. No env branch model.
4. Dangerous-update gate is a `blocks-auto-promote` label on the source PR,
   inherited by the release-pin PR and blocking its auto-merge.
5. Each task is one reviewer-atomic PR stacked on the branch family
   `feat/M26.9-staging-cluster-*`.

## Verification

Run the commands in the milestone `Verification` section after each task is
complete. Capture `gh run list --workflow flux-production-deploy.yml --limit
20` in T08 for the push-to-prod wall-clock reduction evidence.
