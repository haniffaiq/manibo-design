# M22: Admin Shared Patterns

Status: done
Created: 2026-03-24
Owner: Jakit
Branch: feat/M22-admin-shared-patterns
Stream: ui
Depends on: M20
Reference: Pain points from M20 implementation

## Goal

Extract the duplicated plumbing from 6+ admin pages into shared hooks and component-level affordances. Every admin page today copy-pastes the same action state, tenant picker, confirmation dialog, error/notice banners, and disabled-reason Tooltip wiring. This milestone eliminates the duplication so future admin page work is additive (import a hook) instead of duplicative (copy 40 lines from another page).

## Design Decisions

1. **`useActionState` hook** — single source for `busy`, `error`, `notice`, `run()`. Replaces 6 independent copies of the same `useState` + `try/catch/finally` + `setActionBusy` pattern. Composes with the existing `useNotice` hook (adds auto-dismiss).

2. **`useTenantPicker` hook** — encapsulates tenant SWR fetch, auto-select-first, loading state, and returns a ready-to-render `<TenantSelect>` component. Replaces 6 near-identical tenant picker implementations.

3. **`useConfirmDialog` hook** — returns `confirm(options)` + `<ConfirmDialog>`. Replaces per-page `deleteTarget`/`confirmTarget` state + Modal wiring. Handles the "evaluate click" workaround for Radix Dialog stability.

4. **`disabledReason` prop on Button** — when set, Button auto-renders disabled + wraps in Tooltip. Eliminates the 10-line conditional pattern per disabled button.

5. **Fix Modal CSS for Playwright stability** — replace `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2` with `fixed inset-0 flex items-center justify-center` so Playwright considers the button "stable". Removes need for `evaluate(el => el.click())` workaround in E2E tests.

6. **SelectItem empty-value guard** — add dev-mode console warning when `value=""` is passed, since Radix silently crashes. Document the `__none__` sentinel pattern.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Extract useActionState hook | done | none |
| T02 | Extract useTenantPicker hook | done | none |
| T03 | Extract useConfirmDialog hook | done | none |
| T04 | Add disabledReason prop to Button | done | none |
| T05 | Fix Modal CSS for Playwright click stability | done | none |
| T06 | Add SelectItem empty-value dev warning | done | none |
| T07 | Migrate admin pages to shared hooks | done | T01, T02, T03 |
| T08 | Update E2E tests for Modal CSS fix | done | T05 |

## Acceptance Criteria

- [x] No admin page defines its own `actionBusy`/`actionError`/`actionNotice`/`runAction` — all use `useActionState`
- [x] No admin page has inline tenant SWR + useEffect auto-select — all use `useTenantPicker`
- [x] No admin page has per-target confirmation Modal state — all use `useConfirmDialog`
- [x] No 10-line disabled+Tooltip conditional blocks — all use `disabledReason` prop
- [x] No `evaluate(el => el.click())` workaround in E2E tests — Modal CSS is Playwright-stable
- [x] `<SelectItem value=\"\">` logs a dev warning
- [x] `pnpm -C apps/web lint` passes
- [x] `pnpm -C apps/web check-types` passes
- [x] `pnpm -C apps/web test` passes (228+ tests)
- [x] All admin E2E tests pass without `evaluate` workarounds

## Verification

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C packages/ui check-types
pnpm -C packages/ui playwright:ct
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test
NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
```

## Non-Goals

- No new admin pages or features
- No observability workspace decomposition (tracked as M1 scope)
- No backend changes
- No new component library additions
