# T14: Add Tooltip to Blocked/Partial Actions

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T14 - add Tooltip to blocked and partial actions`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

Wrap disabled buttons and partial-state actions with Tooltip explanations. When an operator sees a grayed-out action, hovering should explain why.

## Subtasks

- [x] **Add TooltipProvider** to the admin layout (wraps all admin pages)
- [x] **Tenants** (`tenants/page.tsx`): Tooltip on offboarded tenant row explaining "No actions — tenant is offboarded"
- [x] **Assistants list** (`agent-definitions/page.tsx`): Tooltip on "Create assistant" when no tenant is selected: "Select a tenant first"
- [x] **Assistants detail** (`agent-definitions/[id]/page.tsx`): Tooltip on disabled lifecycle actions (e.g., publish disabled when not yet reviewed)
- [x] **Releases** (`releases/page.tsx`): Tooltip on "Apply to tenant" when no tenant selected: "Select a tenant to apply this package"
- [x] **Health** (`health/page.tsx`): Tooltip on unavailable metrics: "This data source is currently unreachable"
- [x] **Phone Routing** (`phone-numbers/page.tsx`): Tooltip on disabled routing actions when no assistant is published
- [x] **Users** (`users/page.tsx`): Tooltip on disabled row actions for the current user's own row
- [x] **Security** (`security/page.tsx`): Tooltip on disabled filter controls during load

Note: The Settings OIDC delete button is an *enabled* destructive action that opens a confirmation modal — it does not get a tooltip. Tooltips are only for disabled/blocked controls.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/layout.tsx` | Modify | Add TooltipProvider wrapper |
| `apps/web/src/app/(deployment)/admin/tenants/page.tsx` | Modify | Tooltip on disabled row actions |
| `apps/web/src/app/(deployment)/admin/agent-definitions/page.tsx` | Modify | Tooltip on disabled create |
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/page.tsx` | Modify | Tooltip on disabled lifecycle actions |
| `apps/web/src/app/(deployment)/admin/releases/page.tsx` | Modify | Tooltip on disabled apply |
| `apps/web/src/app/(deployment)/admin/health/page.tsx` | Modify | Tooltip on unavailable metrics |
| `apps/web/src/app/(deployment)/admin/phone-numbers/page.tsx` | Modify | Tooltip on disabled routing actions |
| `apps/web/src/app/(deployment)/admin/users/page.tsx` | Modify | Tooltip on disabled row actions |
| `apps/web/src/app/(deployment)/admin/security/page.tsx` | Modify | Tooltip on disabled filters |

## Implementation Notes

Pattern for disabled button with tooltip:
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span tabIndex={0}>
      <Button disabled>Apply to tenant</Button>
    </span>
  </TooltipTrigger>
  <TooltipContent>Select a tenant first</TooltipContent>
</Tooltip>
```

Note: Radix Tooltip needs a focusable trigger. Disabled buttons are not focusable, so wrap in a `<span tabIndex={0}>`.

## Acceptance Criteria

- [x] Disabled buttons on all admin pages listed above have a tooltip explaining why
- [x] Tooltips appear on hover with ~200ms delay
- [x] Tooltips use consistent dark styling
- [x] No tooltip on active/enabled buttons — enabled destructive actions (like OIDC delete) use Modal confirmation, not tooltips
- [x] All E2E tests pass

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
- Depends on: T02 (Tooltip component must exist)
