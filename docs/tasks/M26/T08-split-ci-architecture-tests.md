# T08: Split CI architecture tests below the repo size cap

> **Milestone**: M26-ci-control-plane-reliability
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T07

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26 T08 - split ci architecture tests`

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

The CI architecture tests became giant junk drawers. Split them into focused modules so the repo-wide size gate applies to the control-plane tests too.

## Subtasks

- [x] Identify oversized CI architecture test files and carve them by concern
- [x] Keep test names and coverage clear after the split
- [x] Update any imports/helpers so the split does not become circular test trash

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tests/architecture/test_ci_merge_gate_topology.py` | Delete | Replace the merge-gate junk drawer with focused policy modules |
| `tests/architecture/test_pr_agent_queue_controls.py` | Delete | Replace the PR queue-control junk drawer with focused policy modules |
| `tests/architecture/ci_architecture_test_support.py` | Create | Shared loader/path helpers for the split CI policy modules |
| `tests/architecture/test_ci_*` / `tests/architecture/test_pr_*` | Create | Focused CI topology, review-lane, follow-up, and queue-control policy tests |

## Implementation Notes

Do not create a new mega-helper that simply hides the old monolith. Split by policy domain: merge gate topology, review readiness, runner routing, replay semantics, and file-size policy.

## Acceptance Criteria

- [x] Oversized CI architecture tests are split into focused modules
- [x] New test modules stay below the repo size cap
- [x] CI policy coverage is preserved or improved after the split

## References

- Milestone: [M26-ci-control-plane-reliability.md](../../milestones/M26-ci-control-plane-reliability.md)
- Related: [AGENTS.md](../../../AGENTS.md)
