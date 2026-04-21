# T04: Add disabledReason prop to Button

> **Milestone**: M22-admin-shared-patterns
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

## Description

Disabled buttons that explain why they're disabled currently require a 10-line conditional:

```tsx
{!selectedTenantId ? (
  <Tooltip content="Select a tenant first" delayDuration={0}>
    <span>
      <Button disabled>Create</Button>
    </span>
  </Tooltip>
) : (
  <Button onClick={...} disabled={actionBusy}>Create</Button>
)}
```

This should be a single prop:

```tsx
<Button
  onClick={...}
  disabled={actionBusy || !selectedTenantId}
  disabledReason={!selectedTenantId ? "Select a tenant first" : undefined}
>
  Create
</Button>
```

## Subtasks

- [x] **Add `disabledReason?: string` prop to `ButtonProps`** in `packages/ui/src/components/button.tsx`
- [x] **When `disabledReason` is set and button is disabled**, wrap in `<Tooltip>` + `<span>` automatically
- [x] **Add Playwright CT test** for disabled + tooltip rendering
- [x] **Update `packages/ui/src/components/index.ts`** exports if needed

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/ui/src/components/button.tsx` | Modify | Add disabledReason prop |
| `packages/ui/src/components/button.ct.spec.tsx` | Modify | Add CT test for disabledReason |

## Implementation Notes

- Import Tooltip from `./tooltip` — this creates a dependency within packages/ui which is fine (same package)
- The `<span>` wrapper is needed because disabled buttons don't fire mouse events, so Tooltip trigger won't work directly
- When `disabledReason` is undefined or button is not disabled, render the button normally (no extra wrapper)
- The `forwardRef` still applies to the inner button, not the span wrapper

## Acceptance Criteria

- [x] `<Button disabled disabledReason="reason">` renders Tooltip with "reason" on hover
- [x] `<Button disabled>` without disabledReason renders normally (no Tooltip)
- [x] `<Button disabledReason="reason">` when not disabled renders normally (no Tooltip)
- [x] CT test passes
- [x] packages/ui type-check passes
