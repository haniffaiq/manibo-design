# T01: Stabilize the durable case-file and finding parser seam

> **Milestone**: M26.7-portable-prompt-first-review-system
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: None
> **Activation Note**: Activated by explicit human request on 2026-04-14.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.7 T01 - define review contract and case file`

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
   - The branch has one small durable case-file seam and one small finding parser seam
   - Same-head vs new-head rerun semantics are encoded explicitly
   - The review flow can classify prior findings as fixed, still-open, or obsolete

6. **After Completing This Task**
   - Update `docs/tasks/M26.7/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Keep the only useful part of the earlier heavier design: a small durable case-file seam and a strict finding parser. Same-head reruns and fail-closed finding parsing still matter in the simplified script-based design, so this task stabilizes those behaviors before the milestone pivots away from a large Python review framework.

## Subtasks

- [x] **Keep the durable case file**: model prior bot findings, thread/discussion references, and fixed/still-open/obsolete states.
- [x] **Encode rerun semantics**: make same-head reruns update the same authority while new-head reruns carry unresolved history forward explicitly.
- [x] **Keep strict finding parsing**: preserve the current `P1` / `P2` / `P3` grammar and fail-closed behavior.
- [x] **Add parser/reconciliation tests**: lock the classification and reconciliation behavior with architecture tests.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/agents/reviewbot/models.py` | Create | Small typed finding/case-file helpers retained from the branch reset |
| `tools/agents/reviewbot/casefile.py` | Create | Durable case-file loading and reconciliation helpers |
| `tools/agents/reviewbot/parser.py` | Create | Structured extraction helpers shared by the current harness |
| `tests/architecture/test_reviewbot_casefile.py` | Create | Locks same-head/new-head rerun and finding reconciliation behavior |
| `tests/architecture/test_pr_review_bot_parse_contracts.py` | Modify | Preserve compatibility with the existing P1/P2/P3 parsing contract during migration |

## Implementation Notes

- The case file is explicit durable state, not hidden model memory.
- Keep the schema boring: current head, prior findings, thread/discussion ids, first/last seen heads, and status.
- These helpers are temporary unless they still justify themselves after the script-based rewrite. Do not let them grow into a framework.
- Preserve the current `P1` / `P2` blocking grammar so the merge gate does not drift during the migration.

## Acceptance Criteria

- [x] Same-head reruns and new-head reruns are modeled explicitly in code and tests.
- [x] Prior findings can be classified as fixed, still-open, or obsolete without relying on hidden state.
- [x] Existing parser/blocking semantics remain pinned by tests during the migration.
- [x] The extracted seam stays small enough to fold into the simpler script design later if needed.

## References

- Milestone: [M26.7-portable-prompt-first-review-system.md](../../milestones/M26.7-portable-prompt-first-review-system.md)
- Related: `tools/agents/pr_review_bot.py`, `tools/agents/pr_review_summary.py`
