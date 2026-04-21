# T03: Create one namespaced review runner under `tools/scripts/review/`

> **Milestone**: M26.7-portable-prompt-first-review-system
> **Status**: Completed
> **Estimate**: L (4-8h)
> **Depends on**: T01, T02
> **Activation Note**: Activated by explicit human request on 2026-04-14.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.7 T03 - extract GitHub review adapter`

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
   - One entrypoint exists under `tools/scripts/review/`
   - The runner calls Codex once and expects one final merged result
   - The current local wrapper can use the new script

6. **Completion Notes**
   - `tools/scripts/review/run_pr_review.py` now builds one compact parent-review prompt, delegates once to `tools/agents/review.py`, and normalizes the merged result.
   - `tools/scripts/review/pr-review.sh` now uses that runner as its single local entrypoint.
   - GitHub bot cutover is deferred to T04/T07 so the required-review path stays stable during the simplification.

---

## Description

Create the one review entrypoint that the milestone is aiming for: `tools/scripts/review/run_pr_review.py`. It should gather the diff and prior unresolved findings, hand that context to the parent review prompt, call Codex once, parse one final merged result, and hand publishing off to the forge-specific script. Do not build a new engine package around it.

## Subtasks

- [x] **Create `run_pr_review.py`**: accept forge, base ref, PR/MR id, dry-run mode, and any runner/profile selection needed later.
- [x] **Build one compact review payload**: include base/head, changed files, diff summary, and unresolved prior findings.
- [x] **Call Codex once**: send the parent review prompt and expect Codex to do the internal persona orchestration.
- [x] **Parse one final result**: preserve strict `P1` / `P2` / `P3` handling and clean/error states.
- [x] **Point the local wrapper at the new path**: keep `tools/scripts/review/pr-review.sh` as a thin human-friendly shell wrapper.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/review/run_pr_review.py` | Create | Main deterministic review entrypoint |
| `tools/scripts/review/pr-review.sh` | Modify | Point the local wrapper at the new script |
| `tests/architecture/test_review_wrapper_cli_compat.py` | Modify | Preserve local wrapper compatibility |
| `tests/architecture/test_local_pr_review_wrapper_defaults.py` | Modify | Preserve wrapper env/default compatibility |

## Implementation Notes

- Keep the current clean sentinel and severity grammar during the migration so branch protection and follow-up logic do not drift.
- This task is about one simple entrypoint, not yet about GitHub/GitLab-specific fetch/publish details.
- If helper functions are needed, keep them in the same script unless a second file clearly earns its keep.

## Acceptance Criteria

- [x] The review flow has one namespaced script entrypoint under `tools/scripts/review/`.
- [x] The script calls Codex once and expects one final merged review result.
- [x] The local wrapper can use the new script without inventing a second path.
- [x] Existing local-wrapper compatibility checks were updated and rerun for the new path.

## References

- Milestone: [M26.7-portable-prompt-first-review-system.md](../../milestones/M26.7-portable-prompt-first-review-system.md)
- Related: `tools/scripts/review/pr-review.sh`, `tools/agents/pr_review_bot.py`
