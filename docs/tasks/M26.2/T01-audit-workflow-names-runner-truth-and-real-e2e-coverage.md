# T01: Audit workflow names, runner truth, and real E2E coverage

> **Milestone**: M26.2-ci-workflow-clarity-and-test-surface-truth
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None
> **Completed**: 2026-04-02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.2 T01 - audit ci workflow runner and e2e truth`

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
   - Code/doc inventory matches the live workflows
   - No stale debug code left behind
   - Output is readable by operators, not just CI maintainers

6. **After Completing This Task**
   - Update `docs/tasks/M26.2/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Build one authoritative inventory of the live GitHub workflows, job names, runner labels/pools, physical runner fleet assumptions, and real E2E-to-job coverage. This is the truth baseline; without it, all later renames and wiring are cargo cult.

## Subtasks

- [ ] **Inventory workflows/jobs**: list every live workflow, trigger, job, and current runner label/pool mapping.
- [ ] **Separate labels from machines**: confirm what is a runner label/pool versus what is a real physical runner host count.
- [ ] **Map all E2E suites**: classify every E2E test surface as auto-CI, manual-only, or not wired.
- [ ] **Include checklist-backed proof stragglers**: classify worker/integration suites the requirements checklist already treats as end-to-end proof surfaces, even if they live outside obvious `tests/e2e` directories.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `wiki/architecture/ci.md` | Modify | Add one authoritative workflow/job/runner/test-surface inventory |
| `docs/milestones/M26.2-ci-workflow-clarity-and-test-surface-truth.md` | Modify | Record the settled inventory decisions |
| `tests/architecture/test_ci_control_plane_policy.py` | Modify | Lock any policy claims that must stay true after the inventory |

## Implementation Notes

- Do not hand-wave runner count. If there are three physical runner machines serving multiple labels, write that explicitly.
- Do not count an E2E file as “covered” unless a GitHub workflow actually invokes it.
- Keep the inventory operator-readable; this is not a dump of YAML keys.

## Acceptance Criteria

- [x] One inventory states live workflows, triggers, jobs, runner labels/pools, and E2E coverage truth.
- [x] The docs clearly distinguish physical runner hosts from runner labels/pools.
- [x] Orphaned or manual-only E2E suites are explicitly called out instead of silently implied as covered.

## References

- Milestone: [M26.2-ci-workflow-clarity-and-test-surface-truth.md](../../milestones/M26.2-ci-workflow-clarity-and-test-surface-truth.md)
- Related: [ci-operations.md](../../../wiki/architecture/ci.md), `docs/requirements/checklist.md` row 63
