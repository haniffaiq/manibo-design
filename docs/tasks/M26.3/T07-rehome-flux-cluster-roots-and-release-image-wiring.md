# T07: Rehome Flux cluster roots and release-image wiring under `kubernetes/flux`

> **Milestone**: M26.3-infrastructure-directory-structure-migration
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T05, T06, T04
> **Planning Note**: Planning backlog only. Created from explicit human request on 2026-04-02. Do not implement until M26.3 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.3 T07 - rehome flux cluster roots`

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

Move the current Flux cluster roots into `infrastructure/kubernetes/flux/clusters/**`, preserving reconciliation order, production release-image pinning, and every direct consumer of the moved cluster-root paths.

## Subtasks

- [x] **Move cluster roots**: Rehome existing cluster directories into provider/environment-specific Flux roots for active clusters only.
- [x] **Move release-image contract**: Rehome `release-images.yaml` and any related image automation to the new Flux cluster tree.
- [x] **Update direct path consumers atomically**: Point bootstrap and wait/smoke scripts, workflow path filters, CI policy rules, and path-dependent tests at the new cluster-root paths in the same commit as the move.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `clusters/production/**` | Move/Modify | Source production Flux cluster root |
| `infrastructure/kubernetes/flux/clusters/**` | Create | Target Flux cluster tree |
| `infrastructure/sops/.sops.yaml` | Modify | Rewrite SOPS rules for moved Flux cluster secret paths in the same commit as the cluster-root move |
| `.github/workflows/flux-production-deploy.yml` | Modify | Update path triggers and deploy inputs |
| `.github/workflows/k8s-local-stack.yml` | Modify | Update cluster-root path filters |
| `.github/workflows/publish-platform-images.yml` | Modify | Update release-pin path contract |
| `infrastructure/scripts/hetzner/production/bootstrap-flux-production.sh` | Modify | Update Flux bootstrap paths |
| `infrastructure/scripts/hetzner/production/update-hetzner-production-release-images.sh` | Modify | Update release-image path contract |
| `tools/scripts/render_release_pr_body.py` | Modify | Update release-pin PR body references |
| `tools/scripts/infra/validate-k8s-overlays.sh` | Modify | Update cluster-root validation paths |
| `tools/agents/ci_control_plane_policy.py` | Modify | Update release-pin fast-track path rules |
| `wiki/ops/codex_ci_bots.md` | Modify | Update release-pin path references in active bot policy docs |
| `tests/architecture/test_ci_control_plane_policy.py` | Modify | Update release-pin policy expectations |
| `tests/architecture/test_classify_ci_scope_matrix.py` | Modify | Keep CI scope expectations aligned with the moved cluster root |
| `tests/architecture/test_flux_production_deploy_workflow.py` | Create/Modify | Keep production deploy workflow path-filter coverage aligned with the moved cluster root |
| `tests/architecture/test_k8s_local_stack_workflow.py` | Modify | Update workflow path-filter expectations |
| `tests/architecture/test_publish_platform_images_workflow.py` | Modify | Update release workflow expectations |
| `tests/architecture/test_pr_review_policy.py` | Modify | Update release-pin policy expectations |
| `tests/architecture/test_release_pr_body_tools.py` | Modify | Update release PR body expectations |

## Implementation Notes

- Do not change Flux reconciliation semantics while moving directories.
- Keep `release-images.yaml` close to the cluster root that consumes it.
- Move all first-order `clusters/production/**` consumers in this task; do not leave CI/policy/workflow breakage for a later cleanup commit.
- If staging or GCP cluster roots do not exist yet, only create them when they represent real planned targets, not empty ceremony.
- This task owns the SOPS policy rewrite for moved Flux secret paths. Cluster-root migration is not done if encrypted files are left outside the live secret-path contract.
- Production deploy path-filter coverage must move with the cluster-root contract; create the dedicated workflow test if it does not already exist and update it in the same commit.

## Acceptance Criteria

- [x] Active Flux cluster roots live under `infrastructure/kubernetes/flux/clusters/**`.
- [x] Production deploy automation points to the new cluster-root path.
- [x] Release-image automation no longer depends on `clusters/production/**`.
- [x] CI policy, workflow filters, and path-dependent tests no longer hard-code the retired cluster-root path.
- [x] Release PR body tooling, active bot policy docs, and kustomize validation no longer hard-code the retired cluster-root path.
- [x] Dedicated architecture coverage for the production deploy workflow matches the moved cluster-root contract.
- [x] `infrastructure/sops/.sops.yaml` is updated in the same commit so moved Flux secret paths remain covered.

## References

- Milestone: [M26.3-infrastructure-directory-structure-migration.md](../../milestones/M26.3-infrastructure-directory-structure-migration.md)
- Related: `clusters/production/flux-system/gotk-sync.yaml`, `.github/workflows/flux-production-deploy.yml`
