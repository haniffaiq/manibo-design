# T10: Auto-rotate provisioned Codex CI accounts on quota exhaustion

> **Milestone**: M26-ci-control-plane-reliability
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T03

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26 T10 - rotate Codex CI accounts on quota`

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

Required `manibo-bot` review should not fail just because one provisioned ChatGPT subscription account has hit its quota. When multiple CI review accounts are configured, the required review lane should keep the active/default account first, then retry the same repo-owned review path against the next provisioned account before declaring quota exhaustion.

## Subtasks

- [x] Materialize isolated auth homes for provisioned CI review accounts during review-tooling setup
- [x] Keep the currently selected/default account first in the retry order
- [x] Retry required review on the next account only for quota-shaped failures
- [x] Add regressions for explicit-account and default-account ordering

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/lib/ensure_ci_review_tooling.sh` | Modify | Export ordered CI auth homes for review-account rotation |
| `tools/agents/pr_review_bot.py` | Modify | Retry quota-shaped review failures on the next provisioned account |
| `tests/architecture/test_ci_review_tooling_account_rotation.py` | Create | Prove auth-home export and default-account ordering |
| `tests/architecture/test_pr_review_bot_account_rotation.py` | Create | Prove quota-triggered account fallback behavior |
| `wiki/architecture/ci.md` | Modify | Document the new CI account rotation behavior |

## Implementation Notes

Do not add a second review authority. This is still one repo-owned `manibo-bot` review lane. Only the backing ChatGPT subscription session rotates when quota is exhausted.

## Acceptance Criteria

- [x] Required review no longer dies immediately when the selected CI Codex account hits quota but another provisioned account is available
- [x] The default `BOT_CODEX_AUTH_JSON` session stays first when no explicit `CODEX_CI_ACCOUNT` is selected
- [x] Review artifacts still show the winning account label after a successful retry
- [x] Regression coverage proves both explicit-account and default-account ordering

## References

- Milestone: [M26-ci-control-plane-reliability.md](../../milestones/M26-ci-control-plane-reliability.md)
- Related: [ci-operations.md](../../../wiki/ops/ci-operations.md)
