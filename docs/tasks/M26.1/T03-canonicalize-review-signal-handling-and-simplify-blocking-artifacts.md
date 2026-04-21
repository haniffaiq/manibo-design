# T03: Canonicalize review signal handling and simplify blocking artifacts

> **Milestone**: M26.1-bot-pr-recovery-control-plane-simplification
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.1 T03 - canonicalize review signals`

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
   - Verify T01 is complete
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

Reduce the control plane’s dependence on comment archaeology. Authoritative current-head review state should drive machine decisions, while durable clean summaries remain the stable clean artifact and extra blocking-summary comments stop being required machine input.

## Subtasks

- [x] Make follow-up and mergeability trust authoritative current-head review state before any marker/comment fallback
- [x] Keep durable clean summaries as the only required clean-state comment artifact and make blocking top-level summary comments optional/fallback-only when formal review posting fails
- [x] Add regression coverage for dismissed reviews, stale head reviews, legacy marker fallback, and formal-review-only blocking paths

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/agents/pr_followup.py` | Modify | Prefer authoritative review state and shrink raw marker dependency |
| `tools/agents/pr_review_bot.py` | Modify | Simplify blocking review output contract |
| `tools/agents/pr_mergeability_review_state.py` | Modify | Keep authoritative state rules explicit and shared |
| `tests/architecture/` | Modify | Add review-artifact and current-head regressions |

## Implementation Notes

Do not rip out legacy marker fallback in one shot if it strands older PRs. The goal is to make fallback secondary, not to pretend historical artifacts never existed.

## Acceptance Criteria

- [x] Follow-up can recognize current-head review state without needing a top-level blocking summary comment when authoritative review state is present
- [x] Dismissed or stale-head reviews do not satisfy current-head gating
- [x] Blocking required reviews keep formal review plus inline comments, while duplicate top-level blocking summaries become fallback-only

## References

- Milestone: [M26.1-bot-pr-recovery-control-plane-simplification.md](../../milestones/M26.1-bot-pr-recovery-control-plane-simplification.md)
- Related: [ci-operations.md](../../../wiki/ops/ci-operations.md)
