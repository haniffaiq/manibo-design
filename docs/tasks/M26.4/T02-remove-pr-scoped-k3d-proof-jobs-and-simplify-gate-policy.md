# T02: Remove PR-scoped runtime proof jobs and simplify gate policy

> **Milestone**: M26.4-mainline-k3d-proof-consolidation
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T01
> **Activation Note**: Human explicitly activated M26.4 on 2026-04-03. This task is implemented in the active worktree.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.4 T02 - remove PR runtime proof jobs`

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
   - PR workflow no longer launches any runtime-proof jobs (`pr-runtime-smoke`, `pr-traceability-harness`, `requirements-checklist-k8s`)
   - Gate policy and scope classification stop pretending PRs own runtime proof
   - Fast PR proof remains coherent without runtime lanes

6. **After Completing This Task**
   - Update `docs/tasks/M26.4/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Delete PR-scoped runtime proof once mainline has absorbed traceability. This task removes `Run Targeted Runtime Smoke`, `Run Traceability Smoke`, and `Run Targeted K8s Requirement Proof`, updates gate policy/scope classification, and keeps the remaining PR path understandable, fast, and still useful by preserving deterministic non-runtime backend/frontend validation on the runner. Compose runtime smoke is not retained in any “temporary” PR path; it is deleted here.

## Subtasks

- [ ] **Simplify workflow topology**: remove `pr-runtime-smoke`, `pr-traceability-harness`, and `requirements-checklist-k8s` from the PR workflow DAG and final gate.
- [ ] **Update gate policy**: remove the PR runtime-proof requirement branches from `ci_control_plane_gate_policy.py` and any touched-scope flags that no longer matter.
- [ ] **Keep PR fast proof coherent**: update workflow topology tests so the surviving PR path is explicit, non-runtime, and still owns deterministic backend/frontend validation.
- [ ] **Delete compose-runtime leftovers**: remove Compose runtime smoke scripts, job wiring, and stale docs/tests that would otherwise imply PR runtime proof still exists.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/merge-gate.yml` | Modify | Remove PR runtime-proof jobs and clean up final gate dependencies |
| `tools/agents/ci_control_plane_gate_policy.py` | Modify | Remove PR runtime-proof requirement branches and keep mainline proof routing explicit |
| `tools/scripts/classify_ci_scope.py` | Modify | Retire or simplify flags that only existed to trigger PR runtime-proof jobs |
| `tests/architecture/test_ci_control_plane_policy.py` | Modify | Lock the new gate-policy truth |
| `tests/architecture/test_ci_merge_gate_workflow_topology.py` | Modify | Lock the new workflow DAG and required-job surfaces |
| `tests/architecture/test_classify_ci_scope_matrix.py` | Modify | Keep changed-scope routing aligned with the simplified topology |

## Implementation Notes

- Do not delete PR runtime proof first and “come back later” for mainline traceability. That would be a coverage regression.
- Do not keep Compose runtime smoke around as dead code or fallback theater. If M26.4 lands, that topology is removed, not parked.
- If some traceability-related scope flag is still needed for nightly/manual lanes, keep it. The goal is deleting PR runtime duplication, not flattening unrelated surfaces by accident.
- Keep the single-live-PR-workflow invariant from M26 intact.
- “PRs stay non-runtime” does not mean “PRs barely test anything.” Keep runner-shell deterministic backend suites and frontend tests in scope where they materially apply.

## Acceptance Criteria

- [ ] PR workflow no longer runs `pr-runtime-smoke`, `pr-traceability-harness`, or `requirements-checklist-k8s`.
- [ ] Final gate and policy code no longer require those deleted PR jobs.
- [ ] Remaining PR lanes are still explicit, test-covered, and clearly non-runtime.
- [ ] Compose runtime smoke scripts and stale workflow/docs references are removed as part of the same topology cleanup.

## References

- Milestone: [M26.4-mainline-k3d-proof-consolidation.md](../../milestones/M26.4-mainline-k3d-proof-consolidation.md)
- Related: [ci-operations.md](../../../wiki/architecture/ci.md)
