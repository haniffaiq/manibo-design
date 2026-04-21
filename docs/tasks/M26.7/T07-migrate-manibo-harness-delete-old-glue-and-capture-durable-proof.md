# T07: Delete obsolete review glue and cut workflows/docs over to the simple path

> **Milestone**: M26.7-portable-prompt-first-review-system
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T03, T04, T05, T06
> **Activation Note**: Activated by explicit human request on 2026-04-14.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.7 T07 - migrate review harness and delete old glue`

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
   - The current Manibo workflows and wrappers use the new namespaced review path
   - Dead review-specific glue is removed
   - Docs and proof capture match the final contract

6. **After Completing This Task**
   - Update `docs/tasks/M26.7/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Finish the simple review path where it is already real, delete the old review-specific glue that no longer earns its keep, and prove that the code got smaller rather than just rearranged. GitHub can keep the existing public authority until that extraction is genuinely complete; the task is to avoid carrying two public authorities in parallel.

## Subtasks

- [x] **Migrate the current wrappers/workflows**: point the local and GitLab review entrypoints at the new namespaced script path and keep GitHub CI on the existing public authority until the extraction is actually complete.
- [x] **Delete obsolete review glue from the public path**: keep `tools/scripts/review/github.py` as a compatibility shim only instead of a second public GitHub review authority.
- [x] **Fold or delete temporary `tools/agents/reviewbot/` helpers only where justified**: keep the parser/case-file pieces that still earn their keep.
- [x] **Update docs and milestone references**: align CI/review docs with the final simple structure.
- [x] **Capture final verification evidence**: record the final proof commands and results in milestone/progress docs.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/review/pr-review.sh` | Modify | Point the local review wrapper at the new runner |
| `.github/workflows/merge-gate.yml` | Modify | Keep the required review lane aligned with the new runner |
| `.github/workflows/agent-pr-review.yml` | Modify | Keep the advisory/manual review lane aligned with the new runner |
| `tools/scripts/build_pr_review_prompt.py` | Keep for now | Still used by the GitHub authority; no longer a public entrypoint |
| `tools/agents/pr_review_bot.py` | Keep implementation | Existing allowlisted/test-pinned GitHub review implementation |
| `tools/agents/review.py` | Keep shared | Still the shared Codex review wrapper for local and GitHub/GitLab adapters |
| `wiki/architecture/ci.md` | Modify | Publish the final review-system contract |
| `docs/tasks/M26.7/PROGRESS.md` | Modify | Capture final proof and completion state |

## Implementation Notes

- Delete dead glue only after the new path is proven by tests and dry runs.
- Keep one local wrapper path for humans. Simpler is better than forcing everyone onto a new command immediately.
- If a compatibility shim remains, it should stay small and temporary, not become another monolith.
- The milestone is only done if the final code reads simpler than the starting code. Shrinking file count and helper count is part of the outcome, not a nice-to-have.

## Acceptance Criteria

- [x] The local and GitLab review entrypoints use the new namespaced review runner/scripts, while GitHub CI keeps the existing public authority until the extraction is complete.
- [x] Obsolete review-specific glue is removed or reduced to a small compatibility shim.
- [x] CI/review docs describe the final one-authority, Codex-subagent review contract truthfully.
- [x] Final proof commands/results are captured in the progress and milestone docs.

## Completion Notes

1. `.github/workflows/merge-gate.yml` and `.github/workflows/agent-pr-review.yml` keep calling `tools/agents/pr_review_bot.py` directly until the GitHub extraction is complete.
2. `tools/scripts/review/github.py` remains a small compatibility shim instead of becoming a second public GitHub review authority.
3. `tools/scripts/build_pr_review_prompt.py` was not deleted because the current GitHub implementation still uses it internally.
4. The final review surface is now:
   - local human wrapper: `tools/scripts/review/pr-review.sh`
   - shared local review runner: `tools/scripts/review/run_pr_review.py`
   - GitHub authority: `tools/agents/pr_review_bot.py`
   - GitLab adapter: `tools/scripts/review/gitlab.py`

## References

- Milestone: [M26.7-portable-prompt-first-review-system.md](../../milestones/M26.7-portable-prompt-first-review-system.md)
- Related: `tools/scripts/review/pr-review.sh`, `.github/workflows/merge-gate.yml`
