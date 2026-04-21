# T01: Add Channels tab to assistant detail page

> **Milestone**: M31-assistant-channel-management
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M31 T01 - add channels tab to assistant detail page`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M31-assistant-channels`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M31/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M31/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Add a "Channels" tab to the assistant detail page alongside "Configuration", "Flow", and "Test Calls" in the version expansion panel. For the page-level view, add a Channels section below the version table that shows connected channels and an "Add channel" button.

## Subtasks

- [x] **Add Channels section to assistant detail page**: Below the version table, add a card with "Channels" header and placeholder content.
- [x] **Wire tab into version expansion panel**: Add "Channels" as a tab option but it should be a page-level section, not per-version.
- [x] **Create ChannelList component skeleton**: Empty component that will be populated in T02.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/page.tsx` | Modify | Add Channels section below version table |
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/channels-panel.tsx` | Create | Skeleton component for channel list + add button |

## Implementation Notes

- The Channels section is at the assistant level, not per-version. A phone number routes to the assistant, not to a specific version.
- Keep the component skeleton simple — T02 wires the data, T03 adds the form.

## Acceptance Criteria

- [x] Assistant detail page shows a "Channels" section below the version table.
- [x] The section has an "Add channel" button (disabled until T03).
- [x] Type checks pass.

## References

- Milestone: [M31-assistant-channel-management.md](../../milestones/M31-assistant-channel-management.md)
- Related: `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/page.tsx`
