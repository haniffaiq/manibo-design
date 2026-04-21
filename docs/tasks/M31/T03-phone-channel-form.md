# T03: Add phone channel form (create/pause/activate/remove)

> **Milestone**: M31-assistant-channel-management
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M31 T03 - add phone channel management form`

2. **One Milestone = One PR**
   - PR branch naming: `feat/M31-assistant-channels`

3. **Follow CLAUDE.md and AGENTS.md**

4. **Before Starting This Task**
   - Verify T02 is completed

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M31/PROGRESS.md` to mark this task done

---

## Description

Add the "Add channel" form for phone channels and action buttons (pause/activate/remove) on existing channel rows. Use the existing phone numbers admin API for all mutations.

## Subtasks

- [x] **Add channel form**: Modal or inline form with fields: phone number (E.164), SIP trunk ID, start live checkbox.
- [x] **Create phone number via existing API**: POST to the admin phone numbers endpoint with `agent_definition_id` pre-filled.
- [x] **Pause/Activate action**: Toggle phone number active status via existing PATCH endpoint.
- [x] **Remove action**: Delete phone number via existing DELETE endpoint with confirmation.
- [x] **Refresh channel list after mutations**: Revalidate SWR key after create/update/delete.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/channels-panel.tsx` | Modify | Add form, action buttons, mutation handlers |

## Implementation Notes

- Pre-fill `agent_definition_id` in the create form — the user shouldn't have to pick the assistant again.
- Use the same `Button` + `Modal` components from `@grove/ui`.
- The phone number must be E.164 format (e.g., `+37060000001`).

## Acceptance Criteria

- [x] "Add channel" opens a form with phone number and SIP trunk ID fields.
- [x] Creating a phone channel adds it to the list immediately.
- [x] Pause/Activate toggles work on existing channels.
- [x] Remove deletes the channel with confirmation.

## References

- Milestone: [M31-assistant-channel-management.md](../../milestones/M31-assistant-channel-management.md)
- Related: `apps/api/src/platform_api/routes/phone_numbers.py`
