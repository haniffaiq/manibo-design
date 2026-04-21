# T05: Add Tooltip to Disabled Retry Button

> **Milestone**: M15-workflow-client-ux
> **Status**: Not Started
> **Estimate**: S
> **Depends on**: M20 T02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M15 T05 - add tooltip to disabled retry button`
2. **One Milestone = One PR** — branch: `feat/M15-workflow-client-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M15/PROGRESS.md` after completing

---

## Description

When a retry is in progress (`retryingKey` matches the current execution), the retry button is disabled. Add a Tooltip explaining why: "Starting a new run...". Since disabled buttons don't fire pointer events, wrap the button in a `<span tabIndex={0}>` so the Tooltip can attach.

## Subtasks

- [ ] Import `Tooltip`, `TooltipTrigger`, `TooltipContent` from `@grove/ui/tooltip`
- [ ] When `retryingKey` matches, wrap the disabled retry button:
  ```tsx
  <Tooltip>
    <TooltipTrigger asChild>
      <span tabIndex={0}>
        <Button disabled>...</Button>
      </span>
    </TooltipTrigger>
    <TooltipContent>Starting a new run...</TooltipContent>
  </Tooltip>
  ```
- [ ] Check if `TooltipProvider` is already in the tenant layout (may have been added by M21 T14); if not, add it
- [ ] Verify tooltip appears on hover over the disabled button

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/automations/page.tsx` | Modify | Wrap disabled retry button in Tooltip |
| `apps/web/src/app/(tenant)/layout.tsx` | Modify (if needed) | Add TooltipProvider if not already present |

## Acceptance Criteria

- [ ] Disabled retry button shows "Starting a new run..." tooltip on hover
- [ ] Tooltip is accessible via keyboard (tabIndex on wrapper span)
- [ ] TooltipProvider is present in the component tree
- [ ] Lint passes
- [ ] Type check passes

## References

- Milestone: [M15-workflow-client-ux.md](../../milestones/M15-workflow-client-ux.md)
- Dependency: M20 T02 (Tooltip component must exist in `@grove/ui/tooltip`)
