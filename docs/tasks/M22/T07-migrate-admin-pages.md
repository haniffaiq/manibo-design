# T07: Migrate admin pages to shared hooks

> **Milestone**: M22-admin-shared-patterns
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01, T02, T03

## Description

Replace the duplicated plumbing in all admin pages with the shared hooks from T01-T03. This is the integration task — the hooks exist, now wire them in.

## Subtasks

- [x] **settings/page.tsx** — useActionState + useConfirmDialog (replace deleteTarget + runAction)
- [x] **users/page.tsx** — useActionState + useTenantPicker + useConfirmDialog (replace all three patterns)
- [x] **tenants/page.tsx** — useActionState + useConfirmDialog (offboard/suspend)
- [x] **agent-definitions/page.tsx** — useActionState + useTenantPicker
- [x] **releases/page.tsx** — useActionState + useTenantPicker
- [x] **phone-numbers/page.tsx** — useActionState + useTenantPicker (with onTenantChange callback)
- [x] **solutions/page.tsx** — useActionState + useTenantPicker
- [x] **security/page.tsx** — useTenantPicker
- [x] **Replace disabledReason conditionals** with `disabledReason` prop (agent-definitions, users)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/settings/page.tsx` | Modify | useActionState + useConfirmDialog |
| `apps/web/src/app/(deployment)/admin/users/page.tsx` | Modify | All three hooks |
| `apps/web/src/app/(deployment)/admin/tenants/page.tsx` | Modify | useActionState + useConfirmDialog |
| `apps/web/src/app/(deployment)/admin/agent-definitions/page.tsx` | Modify | useActionState + useTenantPicker |
| `apps/web/src/app/(deployment)/admin/releases/page.tsx` | Modify | useActionState + useTenantPicker |
| `apps/web/src/app/(deployment)/admin/phone-numbers/page.tsx` | Modify | useActionState + useTenantPicker |
| `apps/web/src/app/(deployment)/admin/solutions/page.tsx` | Modify | useActionState + useTenantPicker |
| `apps/web/src/app/(deployment)/admin/security/page.tsx` | Modify | useTenantPicker |

## Implementation Notes

- Migrate one page at a time, verify E2E after each
- The `toErrorMessage` function appears in multiple pages — extract to a shared util if not already shared
- Phone-numbers page has complex `onTenantChange` logic (clears edit state, search, filters) — test this carefully
- Keep existing `data-testid` attributes unchanged — E2E tests depend on them

## Acceptance Criteria

- [x] No admin page defines its own `actionBusy`/`actionError`/`runAction`
- [x] No admin page has inline tenant SWR + useEffect auto-select
- [x] No admin page has per-target confirmation Modal state
- [x] All admin E2E tests pass
- [x] apps/web lint + check-types pass
- [x] Net line count reduction across admin pages (expect ~200-300 lines removed)
