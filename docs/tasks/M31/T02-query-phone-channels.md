# T02: Query phone numbers by agent_definition_id for channel list

> **Milestone**: M31-assistant-channel-management
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M31 T02 - query phone channels for assistant`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M31-assistant-channels`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify T01 is completed
   - Read the milestone document for full context
   - Check `docs/tasks/M31/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M31/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Wire the Channels panel to show phone numbers assigned to this assistant. Use the existing admin phone numbers API filtered by `agent_definition_id`. Display each phone number as a channel row with type, endpoint, status, and SIP trunk ID.

## Subtasks

- [x] **Add frontend API function**: `listPhoneNumbersByAssistant(tenantId, agentDefinitionId)` using the existing phone numbers endpoint with a filter.
- [x] **Populate ChannelList component**: Fetch and display phone channels with type badge, phone number, status (active/paused), and trunk ID.
- [x] **Handle empty state**: Show "No channels connected" with guidance to add one.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/api/phone-numbers.ts` | Modify | Add function to list phone channels filtered by agent_definition_id |
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/channels-panel.tsx` | Modify | Populate with real phone channel data |

## Implementation Notes

- Use `GET /admin/tenants/{tenant_id}/phone-channels` as the assistant-channel source and filter by `agent_definition_id` client-side if needed.
- Phone number status maps to channel status: `active` → "Live", `!active` → "Paused".

## Acceptance Criteria

- [x] Channels panel shows phone numbers assigned to this assistant.
- [x] Each channel row shows: type (Phone), phone number, status, trunk ID.
- [x] Empty state shows when no phone numbers are connected.

## References

- Milestone: [M31-assistant-channel-management.md](../../milestones/M31-assistant-channel-management.md)
- Related: `apps/api/src/platform_api/routes/phone_numbers.py`, `apps/web/src/lib/api/admin-phone-numbers.ts`
