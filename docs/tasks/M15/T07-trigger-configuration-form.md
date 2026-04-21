# T07: Trigger Configuration Form UI

> **Milestone**: M15-workflow-client-ux
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T06

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M15 T07 - trigger configuration form UI`
2. **One Milestone = One PR** — branch: `feat/M15-workflow-client-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M15/PROGRESS.md` after completing

---

## Description

Add an inline form for configuring workflow triggers, using the ActionBuilderCard pattern. When an admin clicks [Configure] on a template card (T06), they see a form for setting up the trigger.

**Backend constraint:** The current trigger model is `WorkflowTriggerOverride` in `packages/platform-core/src/platform_core/agents/tenant_overrides.py:11-66`. The enum values are `event | schedule | manual` (NOT `event | cron`). The integration contract at `apps/api/tests/integration/test_agent_definitions.py:421-478` only accepts `{"type":"schedule","cron":...}` or `{"type":"manual"}`. The form fields must match this real enum — do not invent type values the API will reject.

## Subtasks

- [ ] **Trigger type field**: Select for `event`, `schedule`, or `manual` (matches the real `WorkflowTriggerOverride.type` enum)
- [ ] **Source field**: Input for event source identifier (matches `WorkflowTriggerOverride.source`), shown when type=event
- [ ] **Cron field**: Input for cron/schedule expression (matches `WorkflowTriggerOverride.cron`), shown when type=schedule
- [ ] **Schema field**: JSON textarea for payload schema (matches `WorkflowTriggerOverride.schema`), behind disclosure for advanced users
- [ ] **Target workflow field**: Read-only display showing which workflow template this trigger is for
- [ ] **Form validation**: Required fields validated before save
- [ ] **Save action**: Submit trigger configuration via API
- [ ] **Cancel action**: Dismiss form without saving
- [ ] **Success/error feedback**: Notice after save attempt

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/automations/page.tsx` | Modify | Add trigger configuration form UI |

## Implementation Notes

- Use the ActionBuilderCard inline form pattern from M20 tenant onboarding
- Event types should come from the template metadata (T06)
- Conditions are structured as rows: [field] [operator] [value] with add/remove capability
- Keep the form inline (not a separate page) for quick configuration

## Acceptance Criteria

- [ ] Admin can configure a trigger from a template
- [ ] Trigger type is selectable via Select component (event, schedule, or manual)
- [ ] Form fields match `WorkflowTriggerOverride` shape (type, source, cron, schema) with the real enum values
- [ ] Form validates required fields before submission
- [ ] Save submits to API and shows success/error feedback
- [ ] Cancel dismisses the form without side effects
- [ ] Lint passes
- [ ] Type check passes

## References

- Milestone: [M15-workflow-client-ux.md](../../milestones/M15-workflow-client-ux.md)
- Pattern reference: M20 tenant onboarding ActionBuilderCard
