# T06: Demote connector review to advisory and update review docs

> **Milestone**: M26-ci-control-plane-reliability
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T05

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26 T06 - document advisory connector review`

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

Make the review contract explicit in docs and helper text: `manibo-bot` owns required review, the connector stays advisory, and operators should stop treating two public bots as equal merge authorities.

## Subtasks

- [x] Update CI operations docs with the final review authority contract
- [x] Update review-agent docs with the final lane definitions
- [x] Remove stale wording that implies the connector is merge-authoritative

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `wiki/architecture/ci.md` | Modify | Reflect the final review authority model |
| `wiki/architecture/ci.md` | Modify | Explain required vs advisory review cleanly |

## Implementation Notes

This is a docs cleanup task only after the code contract is true. Do not document fantasy.

## Acceptance Criteria

- [x] Docs clearly state that `manibo-bot` owns merge-critical review
- [x] Docs clearly state that `chatgpt-codex-connector` is advisory
- [x] No stale operator guidance remains about dual authority

## References

- Milestone: [M26-ci-control-plane-reliability.md](../../milestones/M26-ci-control-plane-reliability.md)
- Related: [review_agent.md](../../../wiki/ops/codex_ci_bots.md)
