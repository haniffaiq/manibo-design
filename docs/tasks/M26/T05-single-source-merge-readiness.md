# T05: Make merge readiness trust repo-owned review truth only

> **Milestone**: M26-ci-control-plane-reliability
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T03, T04

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26 T05 - single source merge readiness`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M26-ci-control-plane`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M26/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M26/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Merge readiness should consume the repo-owned required review check and unresolved authoritative bot findings, not a muddled mix of connector noise and per-head approval semantics.

## Subtasks

- [x] Update merge-readiness checks to trust the repo-owned review contract
- [x] Remove any dependency on current-head clean GitHub approvals
- [x] Keep unresolved authoritative bot findings blocking until evidence replies exist

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/check_pr_review_resolution.py` | Modify | Trust the new authoritative review contract |
| `tools/agents/pr_mergeability.py` | Modify | Align merge truth with repo-owned review state |
| `tests/architecture/` | Modify | Add regressions for readiness semantics |

## Implementation Notes

This task should reduce policy ambiguity, not hide connector comments. Advisory comments may still exist; they just stop owning merge truth.

## Acceptance Criteria

- [x] Merge readiness no longer depends on per-head bot approvals
- [x] Repo-owned required review check and authoritative bot threads define review truth
- [x] Advisory connector comments do not directly own merge policy

## References

- Milestone: [M26-ci-control-plane-reliability.md](../../milestones/M26-ci-control-plane-reliability.md)
- Related: [ci-operations.md](../../../wiki/ops/ci-operations.md)
