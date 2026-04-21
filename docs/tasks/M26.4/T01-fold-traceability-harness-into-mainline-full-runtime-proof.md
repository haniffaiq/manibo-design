# T01: Fold the traceability harness into mainline full runtime proof

> **Milestone**: M26.4-mainline-k3d-proof-consolidation
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: None
> **Activation Note**: Human explicitly activated M26.4 on 2026-04-03. This task is implemented in the active worktree.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.4 T01 - fold traceability into mainline runtime proof`

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
   - Mainline full-runtime proof runs the traceability harness on the already-booted `k3d` cluster
   - No second `k3d` bootstrap is added inside the same job
   - Release/mainline helper truth stays aligned

6. **After Completing This Task**
   - Update `docs/tasks/M26.4/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Absorb the `k3d` traceability harness into `Run Full K8s Runtime Proof` and broaden that helper beyond the current narrow clinic-oriented slice so the authoritative mainline cluster-backed lane owns both observability traceability proof and the broad deterministic backend suites the repo can realistically run in CI. This task must land before PR runtime-proof jobs are removed; otherwise CI loses real coverage.

## Subtasks

- [ ] **Extend the full-runtime helper**: update the mainline/release helper to invoke `tools/scripts/e2e/run-traceability-e2e.sh` against the cluster already bootstrapped for `merge-runtime-full`.
- [ ] **Broaden deterministic backend coverage**: expand the helper to run the backend unit/integration/E2E suites that are practical in CI across Grove, platform-core, API, temporal-worker, and deterministic solution suites instead of stopping at the current narrow clinic scenario slice.
- [ ] **Keep one-cluster-per-run honest**: reuse the existing cluster and failure-artifact pattern instead of spinning up a second cluster or pretending clusters survive across runs.
- [ ] **Add regression coverage**: update architecture/workflow tests so the mainline/release full-runtime contract explicitly includes traceability proof.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/ci/merge-gate/run-full-runtime.sh` | Modify | Run traceability harness inside the existing mainline/release `k3d` proof helper |
| `.github/workflows/merge-gate.yml` | Modify | Keep `merge-runtime-full` wiring aligned with the new helper contract |
| `.github/workflows/flux-production-deploy.yml` | Modify | Keep release full `k3d` proof aligned if it reuses the same helper |
| `wiki/architecture/ci.md` | Modify | Update the backend E2E ownership map once the broadened helper contract is real |
| `tests/architecture/test_ci_merge_gate_workflow_topology.py` | Modify | Lock the topology and helper expectations |
| `tests/architecture/test_regression_e2e_workflow.py` | Modify | Keep nightly/release ownership expectations aligned if helper truth changes |

## Implementation Notes

- Do not add a second `k3d` job for traceability. That would preserve the exact duplication this milestone is meant to delete.
- The traceability harness already supports running against an existing `k3d` cluster; use that instead of re-bootstrap theater.
- “Broad deterministic backend” means include what is practical and honest in CI across `packages/*`, `apps/api`, `apps/temporal-worker`, and deterministic `solutions/*` suites, and exclude live-provider, live-LLM, voice-call, SIP, phone-number, and other telephony-bound surfaces explicitly instead of by accident.
- This task should leave an explicit include/exclude contract behind. “Run more tests” is too vague and will rot into another hand-picked lane.
- If release inherits the helper change automatically, document that instead of forking a second helper path.

## Acceptance Criteria

- [ ] `merge-runtime-full` runs the traceability harness inside the already-booted `k3d` environment.
- [ ] `merge-runtime-full` expands beyond the current clinic-scenario slice to the broad deterministic backend suites that are practical in CI across Grove, platform-core, API, temporal-worker, and deterministic solution suites.
- [ ] The helper does not create a second cluster or assume clusters persist across workflow runs.
- [ ] Tests/docs make mainline/release traceability ownership explicit.

## References

- Milestone: [M26.4-mainline-k3d-proof-consolidation.md](../../milestones/M26.4-mainline-k3d-proof-consolidation.md)
- Related: [ci-operations.md](../../../wiki/architecture/ci.md)
