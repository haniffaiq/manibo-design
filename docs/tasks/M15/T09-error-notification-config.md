# T09: Error Notification Configuration UI

> **Milestone**: M15-workflow-client-ux
> **Status**: Not Started
> **Estimate**: S
> **Depends on**: T06

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M15 T09 - error notification configuration UI`
2. **One Milestone = One PR** — branch: `feat/M15-workflow-client-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M15/PROGRESS.md` after completing

---

## Description

Add a simple form for configuring who gets notified when a workflow fails.

**Backend prerequisite:** There is currently no notification configuration field in `TenantAgentOverrides` (`packages/platform-core/src/platform_core/agents/tenant_overrides.py:70-85`), and no API endpoint for persisting workflow notification settings. Before implementing this UI, the backend model must be extended to store notification recipients and trigger conditions, OR this task should be deferred until the notifications solution (`solutions/notifications/`) provides a persistence surface.

## Subtasks

- [ ] **Backend**: Extend `TenantAgentOverrides` or create a dedicated notification config model to persist: email addresses, notification trigger type (failures/all/timeouts). If this is blocked, park this task and document the dependency.
- [ ] **Email field**: Text input for comma-separated email addresses with basic validation
- [ ] **Notify on field**: Select dropdown with options: "Failures only", "All completions", "Timeouts"
- [ ] **Save action**: Submit notification config via the new/extended API
- [ ] **Load existing**: Pre-populate form when editing existing notification settings
- [ ] **Validation**: At least one email required, valid email format

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/automations/page.tsx` | Modify | Add error notification configuration form |

## Implementation Notes

- Keep it simple: this is a basic notification configuration, not a full notification system
- Email validation: basic format check (contains @, has domain), not RFC 5322 strict
- The "notify on" Select uses the `@grove/ui/select` component (assumes M20 T03 is done)
- This form is part of the workflow template configuration flow (alongside T07 trigger config and T08 data mapping)

## Acceptance Criteria

- [ ] Admin can enter comma-separated email addresses
- [ ] Admin can select notification trigger from Select dropdown
- [ ] Basic email format validation (reject obviously invalid entries)
- [ ] At least one email is required to save
- [ ] Form saves via API
- [ ] Lint passes
- [ ] Type check passes

## References

- Milestone: [M15-workflow-client-ux.md](../../milestones/M15-workflow-client-ux.md)
