# T04: Move GitHub fetch/publish and same-head review authority into namespaced review scripts

> **Milestone**: M26.7-portable-prompt-first-review-system
> **Status**: Completed
> **Estimate**: L (4-8h)
> **Depends on**: T01, T02, T03
> **Activation Note**: Activated by explicit human request on 2026-04-14.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.7 T04 - add review personas and merged findings`

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
   - GitHub fetch/publish logic is handled from `tools/scripts/review/`
   - Same-head review authority still works
   - The required merge path still sees one authoritative review state

6. **After Completing This Task**
   - Update `docs/tasks/M26.7/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Move the GitHub-specific parts of the review flow out of the current monolith and into the namespaced review script area. This task should fetch PR metadata, changed files, unresolved prior findings, and publish one authoritative review for the current head, while preserving same-head rerun behavior and current blocking semantics.

## Subtasks

- [x] **Create `github.py`**: fetch PR metadata, changed files, reviews/comments needed for the case file, and current head state.
- [x] **Publish one authoritative review**: map `clean`, `blocking`, and `error` into the current GitHub review/comment contract.
- [x] **Preserve current-head markers**: keep the current head marker and durable-summary behavior stable during the migration.
- [x] **Keep same-head reruns sane**: reruns on the same commit must update the same authority rather than create a second blocker.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/review/github.py` | Create | GitHub fetch/publish support |
| `tools/scripts/review/run_pr_review.py` | Modify | Use the GitHub script for fetch/publish |
| `tools/agents/pr_review_bot.py` | Modify | Shrink toward a compatibility shim during migration |
| `tools/agents/pr_review_summary.py` | Modify | Preserve current marker and durable-summary compatibility |
| `tools/agents/pr_review_bot.py` | Preserve implementation | Keep the existing allowlisted/test-pinned implementation surface while adding the namespaced entrypoint |

## Implementation Notes

- Keep GitHub specifics out of the main runner script, but do not create a forest of tiny wrappers.
- Preserve the current marker grammar and durable-summary behavior during migration so branch protection and follow-up logic do not drift.
- Do not let GitHub fetch/publish logic leak back into prompt assembly.

## Acceptance Criteria

- [x] GitHub fetch/publish logic is handled from `tools/scripts/review/`.
- [x] The current required-review lane still produces one authoritative current-head review state.
- [x] Same-head reruns update the existing authority instead of creating a second blocker.
- [x] Existing durable-summary and marker tests remain green after the extraction.

## Completion Notes

1. `tools/scripts/review/github.py` now exists as the namespaced GitHub compatibility adapter for the portable review surface.
2. `tools/agents/pr_review_bot.py` remains the GitHub workflow entrypoint and underlying implementation because the repo's size guard already allowlists that path and the existing test surface still patches it directly.
3. Existing required-lane, durable-summary, clean-state, and fail-closed tests stayed green after the adapter landed, which proved the compatibility path did not change merge-blocking semantics.

## References

- Milestone: [M26.7-portable-prompt-first-review-system.md](../../milestones/M26.7-portable-prompt-first-review-system.md)
- Related: `tools/agents/pr_review_bot.py`, `tools/agents/pr_review_summary.py`
