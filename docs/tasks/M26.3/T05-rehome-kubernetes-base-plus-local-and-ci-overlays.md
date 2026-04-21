# T05: Rehome Kubernetes shared base plus local and CI overlays

> **Milestone**: M26.3-infrastructure-directory-structure-migration
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T01, T04
> **Completed**: 2026-04-02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.3 T05 - rehome kubernetes base and local ci overlays`

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

Move the current shared Kubernetes package surface into `infrastructure/kubernetes/base/**` and rehome the local/CI overlays into `overlays/local/default`, `overlays/local/offline`, and `overlays/ci`, together with every first-order consumer of `infra/k8s/**`.

## Subtasks

- [x] **Split shared base by responsibility**: Rehome platform-level and workload-level packages into `base/platform/**` and `base/workloads/**`.
- [x] **Move local and CI overlays**: Rehome `local-k3s`, `local-k3s-offline`, and `ci-k3s` into the new overlay tree without collapsing the offline profile into a generic local bucket.
- [x] **Update direct path consumers atomically**: Point workflows, validators, deploy helpers, CI policy classifiers, review heuristics, and path-based tests at the new Kubernetes paths in the same commit as the move.
- [x] **Update local bootstrap tooling**: Point k3d/secret tooling at the new Kubernetes paths and the new SOPS config home.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infra/k8s/packages/**` | Move/Modify | Shared package source moved into Kubernetes base |
| `infra/k8s/overlays/**` | Move/Modify | Local and CI overlays moved into the new target tree |
| `infrastructure/kubernetes/base/**` | Create | Shared platform and workload base directories |
| `infrastructure/sops/.sops.yaml` | Modify | Rewrite SOPS rules for moved local/CI secret paths in the same commit as the overlay move |
| `infrastructure/kubernetes/overlays/local/default/**` | Create | Default local overlay target |
| `infrastructure/kubernetes/overlays/local/offline/**` | Create | Offline local overlay target preserving the separate local smoke profile |
| `infrastructure/kubernetes/overlays/ci/**` | Create | CI overlay target |
| `.github/workflows/k8s-local-stack.yml` | Modify | Update local-stack path filters |
| `tools/scripts/infra/validate-k8s-overlays.sh` | Modify | Update kustomize validation paths |
| `tools/scripts/infra/deploy-kustomize.sh` | Modify | Update overlay discovery paths |
| `tools/scripts/classify_ci_scope.py` | Modify | Update CI scope routing for moved Kubernetes paths |
| `tools/agents/pr_review_policy.py` | Modify | Update review-smoke path heuristics |
| `tools/scripts/k3d.sh` | Modify | Update wrapper examples and default overlay selector references |
| `tools/scripts/infra/k3d-up.sh` | Modify | Update shared package and overlay paths |
| `tools/scripts/infra/k3d-sync-app-runtime.sh` | Modify | Update overlay selector references used by local sync flows |
| `tools/scripts/infra/k8s-runtime-secrets.sh` | Modify | Update overlay secret path resolution |
| `tests/architecture/test_deploy_script.py` | Modify | Update deploy helper path expectations |
| `tests/architecture/test_k8s_local_stack_workflow.py` | Modify | Keep local-stack workflow path-filter coverage aligned with moved overlay paths |
| `tests/architecture/test_classify_ci_scope_matrix.py` | Modify | Keep CI scope routing coverage aligned with moved Kubernetes paths |
| `tests/architecture/test_k8s_runtime_secrets.py` | Modify | Update runtime secret path assertions |
| `tests/architecture/test_k8s_livekit_package.py` | Modify | Update shared package path assertions |
| `wiki/ops/k3d-local-stack.md` | Modify | Update active local-stack operator paths |
| `wiki/ops/hoptrans-demo.md` | Modify | Update active local overlay selector references |
| `wiki/ops/hoptrans-livekit-sip-profiles.md` | Modify | Update active local/CI secret path references |
| `wiki/ops/voice-call-local-demo.md` | Modify | Update active local secret path references |

## Implementation Notes

- Keep local and CI semantics intact; this task is path migration, not bootstrap redesign.
- Shared base must stay database-agnostic. Do not drag CNPG into `base/platform/`.
- Move every first-order `infra/k8s/**` consumer in this task. Do not leave local-stack CI or path-based tests broken for a later cleanup commit.
- If a package contains both platform and workload concerns, split it instead of preserving a junk-drawer directory.
- This task owns the SOPS policy rewrite for moved local/CI secret-bearing paths. Do not strand encrypted overlay files behind stale path rules.
- `local-k3s-offline` is a real separately consumed overlay today. Preserve it as a first-class target instead of hand-waving it into `local`.
- `tools/scripts/infra/validate-k8s-overlays.sh` is part of the proof contract for this task. Update it in the same commit as the move so the post-move validation covers the migrated local/default, local/offline, and CI overlay paths.
- Selector rewrites are not complete until every first-order caller that currently passes `local-k3s`, `local-k3s-offline`, or `ci-k3s` has moved in the same commit. Do not leave wrapper scripts, sync helpers, or operator docs on dead selector names.
- Path-filter rewires are not done until the existing architecture tests for `k8s-local-stack.yml` and `classify_ci_scope.py` are updated in the same commit.

## Acceptance Criteria

- [x] Shared Kubernetes manifests live under `infrastructure/kubernetes/base/**`.
- [x] Local and CI overlays live under `infrastructure/kubernetes/overlays/local/{default,offline}/**` and `infrastructure/kubernetes/overlays/ci/**`.
- [x] Direct workflows, validators, deploy helpers, CI classifiers, and path-based tests no longer hard-code `infra/k8s/**`.
- [x] k3d and runtime-secret tooling work from the new paths and SOPS config location.
- [x] Operator and script callers that currently pass `K8S_OVERLAY=local-k3s`, `local-k3s-offline`, or `ci-k3s`, including wrapper scripts, sync helpers, and active local-ops docs, are updated to the new overlay selectors that match the moved tree; this task does not require a hidden alias layer.
- [x] Existing architecture tests for local-stack workflow paths and CI scope routing are updated with the move.
- [x] `infrastructure/sops/.sops.yaml` is updated in the same commit so moved local/CI secret paths remain covered.

## References

- Milestone: [M26.3-infrastructure-directory-structure-migration.md](../../milestones/M26.3-infrastructure-directory-structure-migration.md)
- Related: `infra/k8s/README.md`, `tools/scripts/infra/k3d-up.sh`
