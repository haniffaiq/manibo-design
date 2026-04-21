# T23: Move Tenant Locale Format Functions to packages/web-shared

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T19
> **Priority**: 1 (blocks standalone typecheck)

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T23 - move tenant locale format functions to packages/web-shared`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

T19 moved the locale hooks (`useTenantLocale`, `useTenantCopy`) to `packages/web-shared`, but the format functions (`formatTenantDateTime`, `formatTenantCurrencyFromCents`, `formatTenantDurationSeconds`, `formatTenantPercent`) stayed in `apps/web/src/lib/tenant-locale.ts`. Dashboard widgets in solution packages still import `formatTenantDateTime` from `@/lib/tenant-locale` — an `@/` path that only resolves inside apps/web. This breaks standalone typecheck under strict module resolution.

Fix: Move the pure format functions to `packages/web-shared/src/lib/tenant-locale-formatters.ts` (they depend only on `TenantUiLocale` and `Intl` APIs — no React, no copy object). Update all solution package imports.

## Subtasks

- [x] **Create `packages/web-shared/src/lib/tenant-locale-formatters.ts`** — move `formatTenantDateTime`, `formatTenantCurrencyFromCents`, `formatTenantDurationSeconds`, `formatTenantPercent`, `resolveIntlLocale`
- [x] **Update `packages/web-shared/package.json`** — add `./lib/tenant-locale-formatters` export
- [x] **Update `apps/web/src/lib/tenant-locale.ts`** — re-export from web-shared for backward compatibility
- [x] **Update solution imports** — replace `@/lib/tenant-locale` with `@grove/web-shared/lib/tenant-locale-formatters` in all solution packages

## Acceptance Criteria

- [x] No `@/lib/tenant-locale` imports in any solution package
- [x] `pnpm -C solutions/appointment_booking/ui check-types` passes standalone
- [x] `pnpm -C solutions/driver_verification/ui check-types` passes standalone
- [x] `pnpm -C apps/web check-types` passes
