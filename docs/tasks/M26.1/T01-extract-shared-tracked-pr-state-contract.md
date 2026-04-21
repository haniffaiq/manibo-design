# T01: Extract shared tracked PR state contract

> **Milestone**: M26.1-bot-pr-recovery-control-plane-simplification
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.1 T01 - extract tracked pr state contract`

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
   - Read the milestone document for full context
   - Check `docs/tasks/M26.1/PROGRESS.md` for current state

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

Create one shared typed tracked-PR state contract so orchestrator, follow-up, mergeability, and review bot stop parsing GitHub PR/check/review payloads differently. This is the foundation task for the rest of M26.1.

## Subtasks

- [x] Define a shared tracked-PR state model that captures mergeability, current-head gate/check status, authoritative review state, unresolved-thread state, and normalized fingerprint
- [x] Move raw GitHub payload parsing into one shared helper/module and migrate at least orchestrator plus follow-up to it first
- [x] Add regression coverage that proves the shared parser handles missing `statusCheckRollup`, paginated review state, and legacy bot artifacts consistently

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/agents/` | Modify | Introduce the shared tracked-PR state module and migrate consumers |
| `tools/agents/pr_orchestrator.py` | Modify | Consume shared tracked PR state |
| `tools/agents/pr_followup.py` | Modify | Consume shared tracked PR state |
| `tools/agents/pr_mergeability.py` | Modify | Reuse the shared contract or adapter around it |
| `tools/agents/pr_review_bot.py` | Modify | Reuse the shared contract for current-head status/check truth |
| `tests/architecture/` | Modify | Add parser/consumer consistency coverage |

## Implementation Notes

This task is not permission to create a mega-framework. Keep the shared layer small, typed, and boring. Transport/parsing belongs in one place; policy stays in the caller.

## Acceptance Criteria

- [x] The tracked-PR fields used by orchestrator, follow-up, mergeability, and review bot come from one shared parser/contract instead of four incompatible ad hoc payload readers
- [x] Missing or unreadable `statusCheckRollup` data degrades consistently across consumers
- [x] Regression tests prove current-head review and gate state are interpreted the same way across the migrated consumers

## References

- Milestone: [M26.1-bot-pr-recovery-control-plane-simplification.md](../../milestones/M26.1-bot-pr-recovery-control-plane-simplification.md)
- Related: [ci-operations.md](../../../wiki/ops/ci-operations.md)
