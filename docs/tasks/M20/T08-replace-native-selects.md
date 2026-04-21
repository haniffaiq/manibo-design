# T08: Replace Native Selects with Select Component

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T03

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T08 - replace native selects with Select component`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

Replace all native `<select>` elements on admin pages with the new `Select` component from `@grove/ui/select`. This covers every admin page that uses native selects: tenant pickers, locale dropdowns, filter selects, and form selects.

## Subtasks

- [x] **Assistants page** (`agent-definitions/page.tsx`): tenant picker
- [x] **Assistants editor** (`agent-definitions/structured-agent-editor.tsx`): any selects in the structured editor
- [x] **Releases page** (`releases/page.tsx`): tenant picker
- [x] **Solutions page** (`solutions/page.tsx`): tenant picker
- [x] **Settings page** (`settings/page.tsx`): tenant picker in OIDC provider form
- [x] **Tenants page** (`tenants/page.tsx`): locale dropdown per row, OIDC provider picker in onboard form
- [x] **Phone Routing page** (`phone-numbers/page.tsx`): tenant picker, any routing selects
- [x] **Users page** (`users/page.tsx`): role or tenant selects
- [x] **Security page** (`security/page.tsx`): filter selects (time range, action type, tenant)
- [x] **Observability workspace** (`components/observability-workspace.tsx`): case-type, status, solution, assistant, duration, tenant, and compare selects used on `/admin/observability`
- [x] **Preserve** all `data-testid` attributes
- [x] **Preserve** all existing behavior (onChange handlers, disabled states)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/agent-definitions/page.tsx` | Modify | Replace tenant `<select>` |
| `apps/web/src/app/(deployment)/admin/agent-definitions/structured-agent-editor.tsx` | Modify | Replace any editor `<select>` elements |
| `apps/web/src/app/(deployment)/admin/releases/page.tsx` | Modify | Replace tenant `<select>` |
| `apps/web/src/app/(deployment)/admin/solutions/page.tsx` | Modify | Replace tenant `<select>` |
| `apps/web/src/app/(deployment)/admin/settings/page.tsx` | Modify | Replace tenant `<select>` in OIDC form |
| `apps/web/src/app/(deployment)/admin/tenants/page.tsx` | Modify | Replace locale and OIDC selects |
| `apps/web/src/app/(deployment)/admin/phone-numbers/page.tsx` | Modify | Replace tenant and routing `<select>` elements |
| `apps/web/src/app/(deployment)/admin/users/page.tsx` | Modify | Replace role/tenant `<select>` elements |
| `apps/web/src/app/(deployment)/admin/security/page.tsx` | Modify | Replace filter `<select>` elements |
| `apps/web/src/components/observability-workspace.tsx` | Modify | Replace case-type, status, solution, assistant, duration, tenant, and compare `<select>` elements |

## Acceptance Criteria

- [x] No native `<select>` elements on any admin page (except where semantically required)
- [x] All pickers visually match: same height (h-10), border, radius
- [x] All `data-testid` attributes preserved
- [x] Keyboard navigation works (type to search if Select supports it)
- [x] All existing E2E tests pass

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
- Depends on: T03 (Select component must exist first)
