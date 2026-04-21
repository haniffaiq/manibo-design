# T06: Rehome Hetzner and GCP Kubernetes overlays with provider-specific data boundaries

> **Milestone**: M26.3-infrastructure-directory-structure-migration
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T05, T04
> **Planning Note**: Planning backlog only. Created from explicit human request on 2026-04-02. Do not implement until M26.3 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.3 T06 - rehome provider overlays with data boundary split`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M26.3-infrastructure-structure`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - If a milestone, requirement, or ops doc still explicitly points to `docs/milestones/exec-plans/**`, treat that as a legacy exception until the owning doc is migrated
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M26.3/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M26.3/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Move provider and environment overlays into the new Kubernetes tree while preserving the real database boundary: Hetzner owns CNPG manifests in overlays; GCP owns Cloud SQL in Terraform and only overlays connectivity/runtime references in Kubernetes.

## Subtasks

- [x] **Move Hetzner overlays**: Rehome active Hetzner overlay manifests, Helm values, and provider-specific patches under `overlays/hetzner/**`.
- [x] **Gate any GCP overlay move on real source artifacts**: Create `overlays/gcp/**` only if this repo grows concrete GCP-specific Kubernetes manifests or consumers that actually belong in Kubernetes.
- [x] **Enforce database split**: Keep CNPG in Hetzner overlays only and make GCP workload overlays consume Cloud SQL connectivity contracts without inheriting CNPG artifacts.
- [x] **Update direct overlay consumers atomically**: Rewire workflows, secret helpers, validators, and active docs that point at moved Hetzner overlay and Helm-value paths in the same commit as the move.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infra/environments/hetzner/production/k8s/**` | Move/Modify | Source Hetzner platform overlay manifests |
| `infra/environments/hetzner/production/helm-values/**` | Move/Modify | Source Hetzner Helm values |
| `clusters/production/apps/kustomization.yaml` | Modify | Keep the live production apps kustomization pointing at moved Hetzner overlay paths |
| `clusters/production/data/kustomization.yaml` | Modify | Keep the live production data kustomization pointing at moved Hetzner overlay paths |
| `clusters/production/operators/kustomization.yaml` | Modify | Keep the live production operators kustomization pointing at moved Hetzner overlay paths |
| `clusters/production/services/flux/kustomization.yaml` | Modify | Keep live Flux service values pointing at moved Helm-value paths |
| `clusters/production/services/runtime/kustomization.yaml` | Modify | Keep live runtime service manifests pointing at moved Hetzner overlay paths |
| `infrastructure/sops/.sops.yaml` | Modify | Rewrite SOPS rules for moved provider-overlay secret paths in the same commit as the overlay move |
| `infrastructure/kubernetes/overlays/hetzner/**` | Create | Target Hetzner overlay tree |
| `infrastructure/kubernetes/overlays/gcp/**` | Create/Modify | Target GCP overlay tree only if concrete GCP-specific Kubernetes artifacts exist to move |
| `.github/workflows/flux-production-deploy.yml` | Modify | Keep production deploy path filters firing on moved Hetzner overlay and Helm-value paths |
| `.github/workflows/hetzner-production-ops.yml` | Modify | Update recovery-package and env-path references |
| `.github/workflows/k8s-local-stack.yml` | Modify | Keep path filters aligned with moved overlay paths |
| `tools/scripts/infra/k8s-runtime-secrets.sh` | Modify | Update Hetzner production overlay path resolution |
| `tools/scripts/infra/validate-k8s-overlays.sh` | Modify | Update Helm values and overlay validation paths |
| `tests/architecture/test_flux_production_deploy_workflow.py` | Create/Modify | Dedicated workflow path-filter coverage for production deploy triggering after overlay/Helm-value moves |
| `wiki/ops/hetzner-*.md` | Modify | Update overlay/Helm value paths in active runbooks |
| `wiki/ops/hoptrans-livekit-sip-profiles.md` | Modify | Update active Hetzner break-glass overlay references |

## Implementation Notes

- GCP Kubernetes overlays should stay thin. If a concern is Cloud SQL or IAM provisioning, it belongs in Terraform.
- The current repo evidence does not prove a standalone GCP Kubernetes overlay surface yet. Do not create placeholder `overlays/gcp/**` directories just for symmetry.
- Hetzner voice, storage, and networking patches remain provider-specific overlay material.
- Move first-order consumers of `infra/environments/hetzner/production/{k8s,helm-values}` in this task. Do not leave workflows, validators, or secret helpers broken for a later cleanup pass.
- This task also owns the live `clusters/production/**` kustomization files that import the moved Hetzner overlay and Helm-value paths today. Do not leave the production cluster build broken waiting for T07.
- This task owns the production deploy workflow trigger update for overlay-only changes. Do not leave `.github/workflows/flux-production-deploy.yml` watching dead overlay paths after the move.
- This task owns the SOPS policy rewrite for any provider-overlay secret paths it moves.
- `tools/scripts/infra/validate-k8s-overlays.sh` must stay green in the same commit as the Hetzner overlay and Helm-value move.
- Production deploy path-filter rewrites are not done until a dedicated architecture test covers the workflow contract.
- Avoid inventing placeholder GCP manifests just to make the tree look symmetrical.
- Reserved Hetzner staging paths are not owned here. T10 classifies or quarantines `infra/environments/hetzner/staging/**` before any cleanup task can touch them.

## Acceptance Criteria

- [x] Active Hetzner overlays live under `infrastructure/kubernetes/overlays/hetzner/**`.
- [x] No placeholder `infrastructure/kubernetes/overlays/gcp/**` tree is created without concrete GCP-specific Kubernetes source artifacts or consumers.
- [x] Any active GCP-specific Kubernetes overlays that do exist live under `infrastructure/kubernetes/overlays/gcp/**` and stay scoped to real Kubernetes concerns instead of placeholder symmetry.
- [x] Direct workflows, secret helpers, validators, and active docs no longer hard-code the retired Hetzner overlay and Helm-value paths.
- [x] The live `clusters/production/**` kustomization files no longer import retired Hetzner overlay or Helm-value paths.
- [x] Production deploy triggering still fires on overlay-only Hetzner changes after the path move.
- [x] CNPG manifests no longer appear in shared base or GCP overlay paths.
- [x] Dedicated architecture coverage exists for the production deploy workflow path contract.
- [x] `infrastructure/sops/.sops.yaml` is updated in the same commit so moved provider-overlay secret paths remain covered.

## References

- Milestone: [M26.3-infrastructure-directory-structure-migration.md](../../milestones/M26.3-infrastructure-directory-structure-migration.md)
- Related: `infra/environments/hetzner/production/k8s`, `infrastructure/kubernetes/base/data/cnpg`
