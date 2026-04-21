# T05: Add channel type selector with coming soon for web chat and WhatsApp

> **Milestone**: M31-assistant-channel-management
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T03

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M31 T05 - add channel type selector with coming soon`

2. **One Milestone = One PR**

3. **Follow CLAUDE.md and AGENTS.md**

4. **Before Starting This Task**
   - Verify T03 is completed

5. **Definition of Done**
   - Code compiles without errors
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M31/PROGRESS.md` to mark this task done

---

## Description

When the user clicks "Add channel", show a channel type selector before the form. Phone is selectable. Web Chat and WhatsApp show as "coming soon" and are not selectable. This sets up the extensibility for Phase 2/3.

## Subtasks

- [x] **Channel type selector**: Radio or card selector with Phone (selectable), Web Chat (disabled, "coming soon"), WhatsApp (disabled, "coming soon").
- [x] **Gate form display**: Only show the phone form when Phone is selected.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/channels-panel.tsx` | Modify | Add type selector step before form |

## Acceptance Criteria

- [x] "Add channel" shows a type selector with Phone, Web Chat, WhatsApp.
- [x] Only Phone is selectable. Others show "coming soon".
- [x] Selecting Phone shows the phone form from T03.

## References

- Milestone: [M31-assistant-channel-management.md](../../milestones/M31-assistant-channel-management.md)
