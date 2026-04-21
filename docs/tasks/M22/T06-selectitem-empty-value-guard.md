# T06: Add SelectItem empty-value dev warning

> **Milestone**: M22-admin-shared-patterns
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

## Description

Radix Select crashes at runtime when `<SelectItem value="">` is used — empty string is reserved for "no selection" (placeholder state). M20 hit this as a production crash caught by E2E tests. The fix was a `__none__` sentinel value with conversion in `onValueChange`.

Add a dev-mode warning so the next developer gets a clear error instead of a cryptic Radix crash.

## Subtasks

- [x] **Add dev-mode console.warn in SelectItem** when `value` is empty string
- [x] **Document the `__none__` sentinel pattern** as a code comment in select.tsx

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/ui/src/components/select.tsx` | Modify | Add empty-value guard |

## Implementation Notes

```tsx
>(function SelectItem({ value, ...props }, ref) {
  if (process.env.NODE_ENV !== "production" && value === "") {
    console.warn(
      "SelectItem: value=\"\" is not allowed by Radix Select. " +
      "Use a sentinel value like \"__none__\" and convert in onValueChange."
    );
  }
  // ...
})
```

Keep it dev-only — no runtime overhead in production.

## Acceptance Criteria

- [x] Dev warning fires when `value=""` is passed
- [x] No warning in production builds
- [x] packages/ui type-check passes
