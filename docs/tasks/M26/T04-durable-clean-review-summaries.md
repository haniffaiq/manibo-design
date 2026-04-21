# T04: Replace head-bound clean approvals with durable bot summaries

> **Milestone**: M26-ci-control-plane-reliability
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T03

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26 T04 - durable clean review summaries`

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

Stop using a fresh `APPROVED` GitHub review as the clean-state carrier for every new PR head. The required review check should stay authoritative, and the clean human-readable artifact should become one durable bot summary instead of timeline spam.

## Subtasks

- [x] Design a durable clean-summary format keyed by PR and review mode
- [x] Replace clean `gh pr review --approve` behavior with summary upsert behavior
- [x] Preserve blocking review threads/reviews for real findings

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/agents/pr_review_bot.py` | Modify | Stop creating per-head clean approvals |
| `tools/agents/pr_followup.py` | Modify | Consume the new summary shape if needed |
| `tests/architecture/` | Modify | Add regressions for summary upsert behavior |

## Implementation Notes

The goal is not to hide state. The goal is to stop abusing immutable GitHub approvals as a status transport.

## Acceptance Criteria

- [x] Clean required reviews no longer create a new `APPROVED` review per head SHA
- [x] One durable repo-owned summary stays visible on the PR
- [x] Blocking findings still use real review/thread artifacts

## Completion Notes

1. Added `tools/agents/pr_review_summary.py` to centralize the durable summary marker contract, clean/blocking status parsing, and legacy fallback detection.
2. Updated `tools/agents/pr_review_bot.py` to upsert one durable summary comment per review mode instead of posting fresh clean approvals for every head SHA.
3. Kept blocking review behavior intact: blocking required reviews still create formal `request changes` state and resolvable review-thread comments.
4. Added focused regressions for durable-summary upsert, forged-marker rejection, fallback-marker handling, and latest-artifact selection.

## References

- Milestone: [M26-ci-control-plane-reliability.md](../../milestones/M26-ci-control-plane-reliability.md)
- Related: [ci-operations.md](../../../wiki/ops/ci-operations.md)
