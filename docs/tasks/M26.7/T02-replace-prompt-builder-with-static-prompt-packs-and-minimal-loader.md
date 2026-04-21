# T02: Define repo-scoped Codex config, reviewer agents, and the parent review prompt

> **Milestone**: M26.7-portable-prompt-first-review-system
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T01
> **Activation Note**: Activated by explicit human request on 2026-04-14.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.7 T02 - replace prompt builder with prompt pack`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M26.7-portable-review-system`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M26.7/PROGRESS.md` for current state

5. **Definition of Done**
   - Repo-scoped Codex config exists under `.codex/`
   - Reviewer personas are defined as Codex custom agents
   - The parent review prompt tells Codex to spawn, wait, and merge

6. **After Completing This Task**
   - Update `docs/tasks/M26.7/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Move the review intelligence into the places Codex already supports. The project should define one repo-scoped `.codex/config.toml`, three narrow custom reviewer agents under `.codex/agents/`, and one parent review prompt under `tools/scripts/review/prompts/parent_review.md`. This is where the review behavior lives. Python should not keep inventing prompt-loading abstractions around it.

## Subtasks

- [x] **Add `.codex/config.toml`**: define the minimal project-scoped Codex settings for review, including conservative agent-thread limits.
- [x] **Add three reviewer agents**: `reviewer_generalist`, `reviewer_security`, and `reviewer_architecture`, all narrow and opinionated.
- [x] **Add one parent review prompt**: tell Codex to inspect the diff and unresolved findings, spawn the three reviewers, wait for all of them, dedupe the results, and return one consolidated review.
- [x] **Keep agents read-heavy by default**: reviewers should be read-only unless a later task proves a write-capable persona is necessary.
- [x] **Avoid prompt-builder complexity**: do not add a new prompt framework, loader tree, or glue tests for trivial prompt concatenation.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.codex/config.toml` | Create | Repo-scoped Codex config for review behavior |
| `.codex/agents/reviewer_generalist.toml` | Create | General correctness/maintainability reviewer |
| `.codex/agents/reviewer_security.toml` | Create | Security/boundary reviewer |
| `.codex/agents/reviewer_architecture.toml` | Create | Architecture/simplicity reviewer |
| `tools/scripts/review/prompts/parent_review.md` | Create | Parent prompt that orchestrates the subagents |
| `tests/architecture/test_pr_review_policy.py` | Modify | Pin the review contract where it still matters |

## Implementation Notes

- Use the Codex-native places for this behavior. Do not recreate custom agent configuration in Python.
- Keep `agents.max_depth = 1` unless a deeper tree is proven necessary.
- Keep `agents.max_threads` conservative. The point is attention diversity, not a review zoo.
- The parent prompt should tell Codex to read tests first, inspect unresolved findings, retrieve repo context, and return one strict result.
- Preserve the exact clean sentinel and severity grammar already used by the merge gate.

## Acceptance Criteria

- [x] The repo has one project-scoped Codex config file for review behavior.
- [x] The three reviewer personas are defined as custom agents under `.codex/agents/`.
- [x] The parent review prompt tells Codex to spawn the personas and return one merged result.
- [x] No new prompt-builder abstraction is introduced.

## References

- Milestone: [M26.7-portable-prompt-first-review-system.md](../../milestones/M26.7-portable-prompt-first-review-system.md)
- Related: `.codex/config.toml`, `.codex/agents/*.toml`, `tools/scripts/review/prompts/parent_review.md`
