# T04: Hide Phone Routing from sidebar, rename section to Assistants

> **Milestone**: M31-assistant-channel-management
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M31 T04 - hide phone routing, rename sidebar section`

2. **One Milestone = One PR**

3. **Follow CLAUDE.md and AGENTS.md**

4. **Before Starting This Task**
   - Verify T01 is completed

5. **Definition of Done**
   - Code compiles without errors
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M31/PROGRESS.md` to mark this task done

---

## Description

Remove "Phone Routing" from the deployment sidebar and rename the section from "Assistants & Rollouts" to "Assistants". Phone management now lives inside each assistant's Channels tab and the deployment telephony workspace.

## Subtasks

- [x] **Remove Phone Routing nav item**: Delete the entry from the deployment workbench sections.
- [x] **Rename section**: "Assistants & Rollouts" → "Assistants".

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/deployment-workbench.ts` | Modify | Remove Phone Routing item, rename section |

## Acceptance Criteria

- [x] Phone Routing is not visible in the deployment sidebar.
- [x] Section title says "Assistants" not "Assistants & Rollouts".
- [x] No standalone phone-routing page remains in the deployment sidebar.

## References

- Milestone: [M31-assistant-channel-management.md](../../milestones/M31-assistant-channel-management.md)
