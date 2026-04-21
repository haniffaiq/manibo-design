# T02: Clarify workflow intent and browser proof ownership while preserving one live PR workflow

> **Milestone**: M26.2-ci-workflow-clarity-and-test-surface-truth
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T01
> **Planning Note**: Activated and completed on 2026-04-02 in branch `feat/M26.2-ci-workflow-clarity`.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.2 T02 - clarify ci workflow and browser proof intent`

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
   - Workflow names and job names explain trigger + purpose
   - Branch-protection semantics remain coherent
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M26.2/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Preserve the single live PR workflow from M26, but make the PR path versus non-PR mainline path understandable and give browser-proof ownership one coherent home. That may mean renaming the PR workflow, extracting non-PR triggers into their own workflow, or keeping one file with sharper job names if that remains the simplest truthful shape. Browser-lane ownership belongs in this task because it touches the same merge-critical workflow, policy, and replay surfaces as the naming/topology cleanup.

## Subtasks

- [x] **Clarify workflow responsibility**: keep one live PR workflow while making PR fast validation and non-PR mainline proof readable.
- [x] **Rename jobs for intent**: replace opaque names such as `gate`, `changes`, `admission summary`, and `harness` with purpose-led names.
- [x] **Settle browser-proof ownership**: define where the full Playwright suite and harness contract live without duplicating the same full-suite job.
- [x] **Keep branch protection boring**: update docs/tests so the required surfaces stay explicit and stable.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/merge-gate.yml` | Modify | Preserve the single live PR workflow while clarifying its intent |
| `.github/workflows/k8s-local-stack.yml` | Modify | Keep infra/bootstrap naming aligned with the clarified workflow surface |
| `.github/workflows/periodic-tests.yml` | Modify | Split deterministic periodic naming away from provider smoke confusion |
| `.github/workflows/regression-e2e.yml` | Modify | Align nightly/deep-regression naming with the final workflow map |
| `.github/workflows/export-check.yml` | Modify | Keep distribution/export naming consistent with the published map |
| `.github/workflows/agent-pr-orchestrator.yml` | Modify | Align automation workflow naming with operator-readable intent |
| `.github/workflows/agent-pr-followup.yml` | Modify | Align automation follow-up naming with operator-readable intent |
| `.github/workflows/agent-pr-review.yml` | Modify | Align manual deep-review naming with operator-readable intent |
| `.github/workflows/ci-mainline-deployable-proof.yml` | Create/Optional | Non-PR mainline workflow only if extraction reduces confusion without reviving PR sprawl |
| `tools/scripts/e2e/run-web-e2e.sh` | Modify | Keep the browser harness CI-safe and aligned with the settled workflow ownership |
| `tools/agents/ci_control_plane_policy.py` | Modify | Keep runner routing and required-surface semantics aligned |
| `tools/scripts/review/pre-pr-ci.sh` | Modify | Keep local CI replay and workflow filename references aligned |
| `tools/scripts/classify_ci_scope.py` | Modify | Keep workflow/runtime file classification aligned if workflow files move |
| `wiki/architecture/ci.md` | Modify | Document the renamed/split workflow surface |
| `tests/architecture/test_ci_control_plane_policy.py` | Modify | Lock the new names and required topology |
| `tests/architecture/test_local_pre_pr_ci_harness.py` | Modify | Keep local replay expectations aligned with workflow filenames |
| `tests/architecture/test_ci_review_workflow_topology.py` | Modify | Keep workflow topology assertions aligned |

## Implementation Notes

- The goal is clarity, not more CI choreography sludge.
- Preserve the M26 invariant: one live PR workflow.
- Do not add a second PR workflow. A non-PR mainline extract is only acceptable if it reduces confusion without changing PR topology.
- If the non-PR path stays inside `merge-gate.yml`, that is still a valid completion for this task as long as the non-PR surfaces are named clearly enough for a junior engineer to follow.
- Keep browser-proof ownership here. Splitting browser-lane changes into a second task while both tasks modify the same merge-critical workflows, docs, and architecture tests is planning theater.
- If workflow filenames change, update every script and architecture test still pinned to `merge-gate.yml`, `pr-admission.yml`, `pr-heavy.yml`, `regression-e2e.yml`, and `periodic-tests.yml`.
- Renaming must be paired with docs/tests, or the repo will drift back into confusion immediately.

## Acceptance Criteria

- [x] The repo still has exactly one live PR workflow.
- [x] PR validation and non-PR mainline proof are understandable from workflow/job names.
- [x] Browser-proof ownership is explicit without duplicating the same full Playwright suite in two permanent lanes.
- [x] Branch-protection-facing semantics stay explicit and test-covered.

## Completion Notes

1. The live PR/mainline workflow stayed in `.github/workflows/merge-gate.yml`; the implemented name is `PR + Mainline Proof`, not the earlier draft proposal to split a separate PR-fast workflow.
2. Manual replay helpers were renamed to `Debug - PR Fast Replay` and `Debug - PR Runtime Replay` to make it obvious they are not live branch-protection surfaces.
3. The automation surfaces were renamed to `Automation - PR Queue Controller`, `Automation - PR Follow-up`, and `Automation - Manual PR Deep Review`.
4. Browser proof ownership is explicit and intentionally local-only for now: `apps/web/e2e/*.spec.ts` remains owned by `tools/scripts/e2e/run-web-e2e.sh` plus `tools/scripts/review/pre-pr-ci.sh`; no GitHub workflow claims that suite yet.

## References

- Milestone: [M26.2-ci-workflow-clarity-and-test-surface-truth.md](../../milestones/M26.2-ci-workflow-clarity-and-test-surface-truth.md)
- Related: [ci-operations.md](../../../wiki/architecture/ci.md)
