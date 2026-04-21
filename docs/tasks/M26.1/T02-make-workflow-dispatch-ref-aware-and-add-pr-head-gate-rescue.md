# T02: Make workflow dispatch ref-aware and add PR-head gate rescue

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
   - Commit message format: `feat: M26.1 T02 - add ref aware gate rescue`

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

Teach the orchestrator to replay workflows with the correct PR context. The first concrete use-case is rescuing reviewed bot PRs whose current head is missing `Merge gate` status, without faking a `workflow_dispatch` run that no longer matches the real PR DAG.

## Subtasks

- [x] Extend workflow dispatch/replay planning so an action can carry the target ref plus any required PR/base/head metadata instead of always replaying on `main`
- [x] Add one reviewed-bot-PR rescue path that can reproduce the PR merge-gate surface when current-head gate state is missing and no active gate run exists
- [x] Add regression coverage proving rescue replay is targeted, rate-limited, and preserves PR-path classification instead of silently degrading to generic `workflow_dispatch` semantics

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/agents/pr_orchestrator.py` | Modify | Add ref-aware replay inputs and gate rescue planning |
| `tools/agents/pr_orchestrator_event_policy.py` | Modify | Keep event-trigger policy aligned with the new rescue path if needed |
| `tests/architecture/test_ci_orchestrator_review_dispatch.py` | Modify | Cover gate-missing rescue and ref-aware dispatch |
| `wiki/architecture/ci.md` | Modify | Document the new reviewed-PR gate rescue behavior |

## Implementation Notes

Do not introduce another live PR workflow. `Merge gate` stays the single PR workflow; this task only restores the ability to refresh the real PR-path gate without lying to the classifier about the event shape.

## Acceptance Criteria

- [x] A reviewed bot PR with missing current-head gate state triggers a targeted `Merge gate` rescue that preserves PR/base/head context instead of relying on a ref-only replay
- [x] The dispatcher can still launch maintenance workflows on `main` without regressing existing orchestrator behavior
- [x] Tests prove gate rescue does not dispatch duplicate runs when an active `Merge gate` already exists for that PR head

## References

- Milestone: [M26.1-bot-pr-recovery-control-plane-simplification.md](../../milestones/M26.1-bot-pr-recovery-control-plane-simplification.md)
- Related: [ci-operations.md](../../../wiki/ops/ci-operations.md)
