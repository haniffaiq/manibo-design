# T04: Add explicit archive action on non-live versions in UI

> **Milestone**: M30-agent-version-rollback
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M30 T04 - add explicit archive action for versions`

2. **One Milestone = One PR**

3. **Follow CLAUDE.md and AGENTS.md**

4. **Before Starting This Task**
   - Verify T02 is completed

5. **Definition of Done**
   - Code compiles without errors
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M30/PROGRESS.md` to mark this task done

---

## Description

Add an "Archive" button on `previously_published` and `rejected` versions. Archiving is now a deliberate operator action, not automatic. Archived versions cannot be republished.

## Subtasks

- [x] **Backend**: Add an archive endpoint or extend the review/publish API to accept an `archive` action that transitions a version from `previously_published` or `rejected` to `archived`.
- [x] **Frontend**: Add "Archive" button in the version action column for `previously_published` and `rejected` versions.
- [x] **Confirmation**: Show confirmation dialog before archiving.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/agents/governance.py` | Modify | Add `archive_version` method |
| `apps/api/src/platform_api/routes/admin_agent_definitions.py` | Modify | Add archive endpoint |
| `apps/web/src/lib/api/admin-agent-definitions.ts` | Modify | Add archive API function |
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/page.tsx` | Modify | Add Archive button for eligible versions |

## Implementation Notes

- Only `previously_published` and `rejected` versions can be archived. `published` (live) cannot.
- The backend method is simple: `UPDATE status = 'archived' WHERE status IN ('previously_published', 'rejected') AND version = $1`.

## Acceptance Criteria

- [x] `previously_published` versions show an "Archive" button.
- [x] `rejected` versions show an "Archive" button.
- [x] `published` (live) versions do NOT show an "Archive" button.
- [x] Archiving requires confirmation.
- [x] Archived versions show no action buttons.

## References

- Milestone: [M30-agent-version-rollback.md](../../milestones/M30-agent-version-rollback.md)
