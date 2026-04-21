# T05: Update version action buttons for new status transitions

> **Milestone**: M30-agent-version-rollback
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T03, T04

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M30 T05 - update version action buttons for rollback flow`

2. **One Milestone = One PR**

3. **Follow CLAUDE.md and AGENTS.md**

4. **Before Starting This Task**
   - Verify T03 and T04 are completed

5. **Definition of Done**
   - All status transitions have correct buttons
   - Code compiles without errors

6. **After Completing This Task**
   - Update `docs/tasks/M30/PROGRESS.md` to mark this task done

---

## Description

Update the version action column to show the correct buttons for every status in the new lifecycle. The full action matrix:

| Status | Badge | Actions |
|--------|-------|---------|
| `draft` | Draft | Test, Publish |
| `in_review` | Under review | Test, Reject, Publish |
| `approved` | Approved | Test, Publish |
| `published` | Live | Test, "Live" label (no action) |
| `previously_published` | Previously live | Test, Publish (rollback), Archive |
| `rejected` | Rejected | Archive |
| `archived` | Archived | (none) |

## Subtasks

- [x] **Update action column cell**: Add "Publish" button for `previously_published` and "Archive" for `previously_published` + `rejected`.
- [x] **Update status badge labels**: Add "Previously live" label for `previously_published`.
- [x] **Update oneClickPublish**: Ensure it works for `previously_published` versions (skip submit/review steps).
- [x] **Remove the old "Archived" label from what was auto-archive**: Since `archived` is now explicit, ensure old behavior doesn't leak through.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/page.tsx` | Modify | Update action column logic |
| `apps/web/src/app/(deployment)/admin/agent-definitions/helpers.ts` | Modify | Add label/variant for `previously_published` |

## Acceptance Criteria

- [x] Every status shows the correct action buttons per the matrix above.
- [x] "Publish" on a `previously_published` version triggers rollback.
- [x] "Archive" on `previously_published` and `rejected` versions works.
- [x] `published` versions show "Live" with no action button.

## References

- Milestone: [M30-agent-version-rollback.md](../../milestones/M30-agent-version-rollback.md)
