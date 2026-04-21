# T05: Fix Modal CSS for Playwright click stability

> **Milestone**: M22-admin-shared-patterns
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

## Description

The Modal component uses CSS centering via transform:

```css
fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
```

Playwright's actionability checker requires elements to be "stable" (no position change between animation frames). The translate-based centering causes sub-pixel instability, making `locator.click()` timeout with "waiting for element to be visible, enabled and stable" — even after the dialog is fully rendered.

Current workaround in E2E tests: `evaluate((el: HTMLElement) => el.click())` which bypasses all actionability checks.

## Subtasks

- [x] **Replace translate centering with flexbox centering** in `packages/ui/src/components/modal.tsx`
- [x] **Verify CT tests still pass** after CSS change
- [x] **Verify visual appearance is unchanged** (dialog still centered)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/ui/src/components/modal.tsx` | Modify | Replace translate centering |

## Implementation Notes

Replace:
```
fixed left-1/2 top-1/2 ... -translate-x-1/2 -translate-y-1/2
```

With a flex container on the Portal content:
```tsx
<Dialog.Portal>
  <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgb(17_24_39_/_0.35)]" />
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <Dialog.Content className="w-[calc(100%-2rem)] max-w-lg rounded-[var(--radius-lg)] ...">
      ...
    </Dialog.Content>
  </div>
</Dialog.Portal>
```

This achieves the same visual centering but uses flexbox instead of transforms, which Playwright treats as stable.

## Acceptance Criteria

- [x] Modal is visually centered (same as before)
- [x] Playwright CT test for Modal passes
- [x] No `evaluate(el => el.click())` workaround needed in E2E tests for Modal buttons
- [x] packages/ui type-check passes
