# T08: Update E2E tests for Modal CSS fix

> **Milestone**: M22-admin-shared-patterns
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T05

## Description

After T05 fixes Modal CSS centering (translate → flexbox), the `evaluate(el => el.click())` workarounds in E2E tests become unnecessary. Replace them with standard Playwright `.click()` calls.

## Subtasks

- [x] **Search for `evaluate.*click` patterns** in E2E tests touching Modals
- [x] **Replace with standard `.click()`** or `.getByRole("dialog").getByRole("button", { name: "..." }).click()`
- [x] **Remove `clickDialogButton` helper** if one was created as interim
- [x] **Verify all admin E2E tests pass** with standard clicks

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/e2e/admin-users.spec.ts` | Modify | Replace evaluate clicks |
| `apps/web/e2e/admin-settings.spec.ts` | Modify | Replace evaluate clicks |
| Other E2E files with Modal interactions | Modify | Same pattern |

## Acceptance Criteria

- [x] No `evaluate(el => el.click())` workarounds remain for Modal buttons
- [x] All admin E2E tests pass with standard Playwright `.click()`
- [x] `selectRadixOption` helper in harness.ts remains (it's still needed for Select)
