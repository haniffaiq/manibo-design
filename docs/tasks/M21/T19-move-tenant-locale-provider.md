# T19: Move Tenant Locale Hooks to packages/web-shared

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T19 - move tenant locale hooks to packages/web-shared`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Solutions import `@/components/tenant-locale-provider` via tsconfig paths, which breaks standalone typecheck because TypeScript pulls in apps/web files.

Fix: Extract the context type and hooks (`useTenantLocale`, `useTenantCopy`, `TenantLocaleContextValue`) to `packages/web-shared/src/hooks/use-tenant-locale.ts`. The provider component that creates the context stays in apps/web (it depends on the 942-line copy object). Solution packages import the hooks from web-shared instead of `@/` paths.

## Subtasks

- [x] **Create `packages/web-shared/src/hooks/use-tenant-locale.ts`** — extract TenantLocaleContextValue type, useTenantLocale hook, useTenantCopy hook, and the React context object
- [x] **Update `packages/web-shared/package.json`** — add `./hooks/use-tenant-locale` export entry
- [x] **Update `apps/web/src/components/tenant-locale-provider.tsx`** — import the shared context type and context object from @grove/web-shared, keep the provider component and copy object local
- [x] **Update solution imports** — replace `@/components/tenant-locale-provider` with `@grove/web-shared/hooks/use-tenant-locale` in all solution packages

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/web-shared/src/hooks/use-tenant-locale.ts` | Create | Shared context type, context object, and hooks (useTenantLocale, useTenantCopy) |
| `packages/web-shared/package.json` | Modify | Add `./hooks/use-tenant-locale` export |
| `apps/web/src/components/tenant-locale-provider.tsx` | Modify | Import shared context from @grove/web-shared, keep provider + copy object local |
| `solutions/appointment_booking/ui/src/**/*.tsx` | Modify | Update imports from `@/components/tenant-locale-provider` to `@grove/web-shared/hooks/use-tenant-locale` |
| `solutions/driver_verification/ui/src/**/*.tsx` | Modify | Update imports from `@/components/tenant-locale-provider` to `@grove/web-shared/hooks/use-tenant-locale` |

## Acceptance Criteria

- [x] Solution packages import locale hooks from `@grove/web-shared/hooks/use-tenant-locale`, not `@/` paths
- [x] `apps/web/src/components/tenant-locale-provider.tsx` still works as the provider (creates context, holds copy object)
- [x] No solution package has any import from `@/components/tenant-locale-provider`
- [x] `pnpm -C apps/web check-types` passes
- [x] `pnpm -C solutions/appointment_booking/ui check-types` passes
- [x] `pnpm -C solutions/driver_verification/ui check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Design decision: "Break tsconfig path coupling between solutions and apps/web"
