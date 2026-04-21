# T06: Add GitLab MR support through the same runner

> **Milestone**: M26.7-portable-prompt-first-review-system
> **Status**: Completed
> **Estimate**: L (4-8h)
> **Depends on**: T01, T02, T04, T05
> **Activation Note**: Activated by explicit human request on 2026-04-14.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.7 T06 - add GitLab review adapter`

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
   - GitLab can supply MR context and prior review state to the same runner script
   - GitLab can publish one authoritative merged review result
   - The core review flow stays the same

6. **After Completing This Task**
   - Update `docs/tasks/M26.7/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Add the GitLab side without changing the review flow. The same parent prompt, Codex agents, case-file handling, and parser should work. Only the fetch/publish script changes.

## Subtasks

- [x] **Create `gitlab.py`**: fetch MR metadata, changed files, prior bot notes/discussions, and current head state.
- [x] **Publish one authoritative GitLab result**: map `clean`, `blocking`, and `error` into GitLab-native notes/discussions and merge-gate semantics.
- [x] **Keep the main runner shared**: `run_pr_review.py` remains the shared local review runner used by the GitLab adapter for the actual Codex work.
- [x] **Keep the adapter intentionally small**: syntax/CLI proof only in this repo because no live GitLab project/token is available in the worktree.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/review/gitlab.py` | Create | GitLab MR fetch/publish support |
| `tools/scripts/review/run_pr_review.py` | Reuse | Shared local review runner invoked by the GitLab adapter |

## Implementation Notes

- GitLab support should map to one authority, not to multiple MR-note streams.
- Do not let GitLab support drag GitHub-specific markers into the shared runner.
- Keep the publish contract small: `clean`, `blocking`, `error`, durable summary body, optional inline findings/discussions.
- Resist GitLab-only abstractions unless they are required by a real MR behavior difference.

## Acceptance Criteria

- [x] GitLab MR context can be fetched through `tools/scripts/review/gitlab.py`.
- [x] GitLab can publish one authoritative merged review result for the current MR head.
- [x] The main review runner stays shared outside the forge adapter seam.
- [x] The adapter is syntactically verified and CLI-validated in this repo; live GitLab API proof requires repo-specific credentials outside this worktree.

## Completion Notes

1. `tools/scripts/review/gitlab.py` is an env-driven adapter around the shared `run_pr_review.py` runner, not a second review framework.
2. The adapter fetches MR metadata, changed files, and the current authoritative review note, then reuses the shared local review runner and upserts one authoritative MR note.
3. GitLab support deliberately stops at one durable note authority. It does not attempt to emulate GitHub formal review state.

## References

- Milestone: [M26.7-portable-prompt-first-review-system.md](../../milestones/M26.7-portable-prompt-first-review-system.md)
- Related: `tools/scripts/review/github.py`, `tools/scripts/review/run_pr_review.py`
