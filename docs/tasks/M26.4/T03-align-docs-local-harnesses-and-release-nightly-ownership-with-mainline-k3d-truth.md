# T03: Align docs, local harnesses, and release/nightly ownership with mainline `k3d` truth

> **Milestone**: M26.4-mainline-k3d-proof-consolidation
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T01, T02
> **Activation Note**: Human explicitly activated M26.4 on 2026-04-03. This task is implemented in the active worktree.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.4 T03 - align docs and harness ownership`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M26.4-mainline-k3d-proof-consolidation`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M26.4/PROGRESS.md` for current state

5. **Definition of Done**
   - CI docs no longer claim PRs own cluster-backed traceability/checklist proof
   - Release and nightly ownership statements still make sense after the mainline shift
   - Local harness docs/scripts do not drift into stale folklore

6. **After Completing This Task**
   - Update `docs/tasks/M26.4/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

After the topology changes land, align the published CI ownership map, local pre-PR harness expectations, release/nightly workflow docs, and frontend CI ownership with the new truth: mainline/release/nightly own runtime proof; PRs do not. At the same time, kill the current lie that `apps/web` browser tests are local-only. If frontend-related surfaces move, GitHub CI must own real frontend proof on both PR and mainline.

## Subtasks

- [ ] **Update CI ownership docs**: rewrite the workflow/e2e truth tables so PR runtime smoke, traceability, and checklist `k3d` proof are no longer listed as active ownership.
- [ ] **Publish frontend CI ownership**: make the docs and workflow truth explicit that `apps/web` test suites are GitHub-owned on PR and mainline when frontend-related surfaces change.
- [ ] **Align local harness documentation**: ensure local pre-PR and local `k3d` helper docs describe that runtime proof moved off the GitHub PR path and onto mainline.
- [ ] **Keep release/nightly truth explicit**: confirm the release gate and nightly deep regression still describe their relationship to the shared full-runtime helper accurately.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `wiki/architecture/ci.md` | Modify | Publish the final PR-vs-mainline ownership map |
| `.github/workflows/merge-gate.yml` | Modify | Keep PR/frontend ownership messaging aligned if frontend tests become GitHub-owned |
| `tools/scripts/review/pre-pr-ci.sh` | Modify | Keep local proof messaging and workflow references aligned if needed |
| `.github/workflows/regression-e2e.yml` | Modify | Keep nightly wording/ownership aligned if helper usage changes |
| `.github/workflows/flux-production-deploy.yml` | Modify | Keep release gate wording/ownership aligned if helper usage changes |
| `tests/architecture/test_local_pre_pr_ci_harness.py` | Modify | Lock local harness messaging/topology expectations |
| `tests/architecture/test_regression_e2e_workflow.py` | Modify | Lock nightly ownership expectations |

## Implementation Notes

- Delete folklore. If the docs still claim PR traceability or PR checklist `k3d` proof after T02, the repo will drift back into confusion immediately.
- Delete frontend folklore too. `apps/web/e2e/*.spec.ts` being “local-only” is not acceptable after this milestone if frontend-related surfaces still exist in PR/mainline CI scope.
- This task is not permission to redesign release or nightly behavior. It is ownership alignment only.
- If the local pre-PR harness still offers an opt-in heavy path, document that as local proof only, not as GitHub PR topology.

## Acceptance Criteria

- [ ] `wiki/architecture/ci.md` accurately states that PRs are non-runtime while mainline/release/nightly own runtime proof.
- [ ] Docs/workflows no longer claim `apps/web` real tests are local-only once frontend CI ownership is implemented.
- [ ] Local harness docs/scripts do not reference deleted PR `k3d` jobs as if they still existed.
- [ ] Release/nightly docs and tests remain truthful after the helper/topology change.

## References

- Milestone: [M26.4-mainline-k3d-proof-consolidation.md](../../milestones/M26.4-mainline-k3d-proof-consolidation.md)
- Related: [ci-operations.md](../../../wiki/architecture/ci.md)
