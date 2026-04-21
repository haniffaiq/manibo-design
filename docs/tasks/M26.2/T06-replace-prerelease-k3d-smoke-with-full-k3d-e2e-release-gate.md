# T06: Replace prerelease k3d smoke with a full k3d E2E release gate

> **Milestone**: M26.2-ci-workflow-clarity-and-test-surface-truth
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T05

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.2 T06 - gate release with prerelease k3d e2e`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M26.2-ci-workflow-clarity`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M26.2/PROGRESS.md` for historical state

5. **Definition of Done**
   - The prerelease lane runs the full deterministic `k3d` E2E suite before production deploy
   - The old prerelease bootstrap-smoke job is retired from release control
   - Docs, workflow inventory, and architecture tests agree on the new release gate truth
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M26.2/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

The repo currently has a fake prerelease signal: a standalone `k3d` bootstrap/ingress smoke is cheaper than real E2E, but it is not honest release proof. Replace that with a real prerelease gate that runs the full deterministic `k3d` E2E surface before `Release - Deploy Production` can reconcile the production cluster. Keep deployed-environment smoke separate, because post-deploy truth is not the same thing.

## Subtasks

- [x] **Retire bootstrap theater**: remove the prerelease `k3d` smoke job from the release-control story.
- [x] **Keep cheap infra validation cheap**: preserve overlay validation for infra PRs without paying full `k3d` tax there.
- [x] **Add a real prerelease gate**: make the release workflow run the full deterministic `k3d` E2E suite before deploy.
- [x] **Gate production deploy**: require the prerelease workflow to pass before `Release - Deploy Production` runs.
- [x] **Publish the truth**: update docs/tests so the CI surface says “full prerelease `k3d` E2E” where that is true and stops pretending smoke is enough.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/k8s-local-stack.yml` | Modify | Retire the prerelease smoke job and keep only cheap infra validation responsibility |
| `.github/workflows/flux-production-deploy.yml` | Modify | Inline the prerelease full `k3d` E2E gate as the first release job before deploy |
| `wiki/architecture/ci.md` | Modify | Publish the new prerelease-vs-post-deploy truth |
| `docs/milestones/M26.2-ci-workflow-clarity-and-test-surface-truth.md` | Modify | Reopen milestone decisions and track the prerelease gate work |
| `docs/tasks/M26.2/PROGRESS.md` | Modify | Track T06 state |
| `tests/architecture/test_k8s_local_stack_workflow.py` | Modify | Lock the cheaper overlay-validation-only PR infra lane |
| `tests/architecture/test_release_deploy_workflow.py` | Create | Lock the inline prerelease full `k3d` E2E gate inside release deploy |
| `tests/architecture/test_ci_control_plane_inventory_truth.py` | Modify | Lock release workflow inventory truth |
| `tests/architecture/test_ci_control_plane_policy.py` | Modify | Keep policy inventory aligned with the active workflow surface |

## Implementation Notes

- Do not replace post-deploy smoke with prerelease `k3d`. Both proofs matter, and they fail for different reasons.
- Reuse the existing shared `k3d` bootstrap action and the current full deterministic `k3d` E2E harness instead of inventing a second full-runtime implementation.
- The cheap infra PR lane may stay path-scoped and static-only. For infra PRs, overlay correctness earns its keep; prerelease full E2E belongs on release control, not every PR.
- If a workflow/job still says “smoke” after this task, make sure it is actually a smoke and not fake release proof.

## Acceptance Criteria

- [x] No release-control workflow treats bootstrap-only `k3d` smoke as sufficient prerelease proof.
- [x] `Release - Deploy Production` depends on a successful full deterministic `k3d` E2E gate before deploy.
- [x] A human can manually run `Release - Deploy Production`, and that workflow will execute the full prerelease `k3d` E2E gate before deploy.
- [x] `wiki/architecture/ci.md`, the milestone doc, and architecture tests all describe the same prerelease release gate truth.

## Completion Notes

1. `.github/workflows/k8s-local-stack.yml` is now a static-only `K8s Overlay Validation` workflow; the bootstrap-smoke job is gone.
2. `.github/workflows/flux-production-deploy.yml` now owns the inline `Run Full K3d E2E` prerelease gate and runs the existing full deterministic `k3d` E2E surface before deploy.
3. The separate reusable prerelease workflow was deleted because it was orchestration duplication; the release workflow now owns the gate directly.
4. The deleted `tools/scripts/ci_k8s_local_stack_smoke.sh` path is no longer part of the claimed release-control story.

## References

- Milestone: [M26.2-ci-workflow-clarity-and-test-surface-truth.md](../../milestones/M26.2-ci-workflow-clarity-and-test-surface-truth.md)
- Related: [ci-operations.md](../../../wiki/architecture/ci.md), [T05-add-release-environment-smoke-and-retire-orphaned-ci-fiction.md](./T05-add-release-environment-smoke-and-retire-orphaned-ci-fiction.md)
