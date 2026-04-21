# T05: Finish fingerprint contract centralization across issue and PR bots

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
   - Commit message format: `feat: M26.1 T05 - centralize fingerprint contract`

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

The repo already has a partial shared fingerprint helper, but adoption is incomplete and duplicate extract/inject logic still exists. Finish that cleanup so issue triage/upsert/execution and PR follow-up all speak the same backlog-ownership language.

## Subtasks

- [x] Replace remaining duplicate root-cause fingerprint parse/inject helpers with the shared helper module
- [x] Keep family matching, alias normalization, and marker injection rules in one place
- [x] Add regression coverage proving issue search, issue execution selection, PR creation, and PR supersedence all use the same normalized fingerprint truth

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/agents/root_cause_fingerprints.py` | Modify | Own the shared fingerprint contract |
| `tools/scripts/bot_issue_upsert.py` | Modify | Consume the shared helper |
| `tools/agents/run.py` | Modify | Consume the shared helper for PR body injection and issue lookup |
| `tools/agents/pr_followup.py` | Modify | Consume the shared helper for supersedence logic |
| `tests/architecture/` | Modify | Add cross-surface fingerprint regressions |

## Implementation Notes

Do not broaden fingerprint families just to make duplicates disappear. The point is deterministic ownership, not aggressive collapsing that merges unrelated backlog.

## Acceptance Criteria

- [x] The remaining duplicate root-cause fingerprint extract/inject logic is deleted or reduced to thin compatibility shims
- [x] Issue upsert, issue execution, PR body injection, and PR supersedence use the same normalized fingerprint contract
- [x] Tests prove rollout-family aliases and non-rollout generic Tier0 issues still dedupe correctly without over-collapsing unrelated work

## References

- Milestone: [M26.1-bot-pr-recovery-control-plane-simplification.md](../../milestones/M26.1-bot-pr-recovery-control-plane-simplification.md)
- Related: [ci-operations.md](../../../wiki/ops/ci-operations.md)
