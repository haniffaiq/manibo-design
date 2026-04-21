# T04: Split follow-up policy from side effects and replace the action blob

> **Milestone**: M26.1-bot-pr-recovery-control-plane-simplification
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T01, T02, T03

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.1 T04 - split followup decision engine`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: use the active implementation branch `feat/M26.1-control-plane-implementation` or a fresh `feat/M26.1-*` branch from current `main`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - M26.1 is active. Verify the latest implementation/progress state before changing anything else.
   - Verify T01, T02, and T03 are complete
   - Read the milestone document and `docs/tasks/M26.1/PROGRESS.md`

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M26.1/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Replace the monolithic follow-up action selector with explicit policy decisions and reason codes, then keep GitHub side effects at the edge. The current blob makes it too easy to hide why a PR stalled and too hard to add new recovery cases safely.

## Subtasks

- [x] Extract a pure decision layer that maps tracked PR state to typed follow-up decisions plus machine-readable reason codes
- [x] Keep execution side effects separate from policy so reruns, merges, updates, and comment posts are edge-only operations
- [x] Expand artifact output so `processed_prs=0` still tells the operator whether the run skipped, blocked, awaited review, or hit retry cooldown

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/agents/pr_followup.py` | Modify | Split decision policy from execution |
| `tools/agents/` | Modify | Add a small typed decision/support module if needed |
| `tests/architecture/test_pr_followup_recovery_actions.py` | Modify | Cover explicit decision reasons |
| `tests/architecture/test_pr_followup_queue_budget.py` | Modify | Keep queue behavior aligned with the new decision model |
| `wiki/architecture/ci.md` | Modify | Document artifact semantics and decision reasons |

## Implementation Notes

Do not replace one giant function with five smaller giant functions. The win here is explicit typed decisions, not rearranged spaghetti.

## Acceptance Criteria

- [x] Follow-up policy can be tested without shelling out to GitHub for every branch path
- [x] Artifact/action records explain blocked and skipped cases explicitly instead of collapsing into silent `processed_prs=0`
- [x] Existing merge/rerun/follow-up/resolve-thread behavior remains covered by focused tests after the split

## References

- Milestone: [M26.1-bot-pr-recovery-control-plane-simplification.md](../../milestones/M26.1-bot-pr-recovery-control-plane-simplification.md)
- Related: [ci-operations.md](../../../wiki/ops/ci-operations.md)
