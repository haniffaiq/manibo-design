# T05: Add release-environment smoke and retire orphaned CI fiction

> **Milestone**: M26.2-ci-workflow-clarity-and-test-surface-truth
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T01, T02, T04
> **Completed**: 2026-04-02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.2 T05 - add release smoke and retire ci fiction`

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
   - All subtasks completed
   - Release smoke is explicit
   - Orphaned CI claims are removed or promoted
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M26.2/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Create an explicit release-environment smoke workflow for deployed staging/production truth, then stop claiming CI coverage for orphaned suites that no GitHub workflow actually runs.

## Subtasks

- [x] **Define release smoke scope**: pick the minimal deployed-environment checks that prove rollout safety.
- [x] **Add explicit workflow ownership**: create a release-environment smoke workflow instead of relying on nightly/runtime folklore.
- [x] **Retire or promote orphaned suites**: every unwired E2E test must become real CI, manual-only by design, or dead code to remove.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/ci-release-environment-smoke.yml` | Create | Explicit deployed-environment smoke workflow |
| `.github/workflows/publish-platform-images.yml` | Modify | Align release-image workflow naming and release-smoke handoff |
| `.github/workflows/flux-production-deploy.yml` | Modify | Align production deploy naming and release-smoke ownership |
| `.github/workflows/hetzner-production-ops.yml` | Modify | Keep manual production-maintenance naming separate from CI validation |
| `wiki/architecture/ci.md` | Modify | Document release smoke and orphaned-suite decisions |
| `docs/requirements/checklist.md` | Modify | Keep CI/browser proof claims honest if coverage changes |
| `tests/architecture/test_ci_control_plane_policy.py` | Modify | Lock release smoke presence if it becomes required |

## Implementation Notes

- Release smoke is post-deploy truth. It is not a substitute for `k3d` or mainline runtime proof.
- Do not keep dead test files around as “maybe later” theater without an explicit manual-only rationale.
- Prefer a small, deterministic smoke over a fake giant release suite nobody trusts.
- Implemented scope:
  - `.github/workflows/ci-release-environment-smoke.yml` is now the explicit post-deploy owner for rollout/public-endpoint smoke.
  - `Release - Deploy Production` deploys only and hands smoke to the dedicated workflow.
  - Previously orphaned suites are now documented as `manual-only` or `local-only`, and the voice-room suite is recorded as `covered`.

## Acceptance Criteria

- [x] Release-environment smoke exists as an explicit workflow/job surface.
- [x] `k3d` and release smoke have distinct documented responsibilities.
- [x] Every previously orphaned E2E suite is either wired, explicitly manual-only, or removed from the claimed CI surface.

## References

- Milestone: [M26.2-ci-workflow-clarity-and-test-surface-truth.md](../../milestones/M26.2-ci-workflow-clarity-and-test-surface-truth.md)
- Related: [ci-operations.md](../../../wiki/architecture/ci.md)
