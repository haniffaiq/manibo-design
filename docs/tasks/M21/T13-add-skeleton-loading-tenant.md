# T13: Add Skeleton Loading to All Tenant Pages

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None (uses Skeleton from M20 T04)

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T13 - add Skeleton loading to all tenant pages`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Replace all "Loading..." text on tenant pages with Skeleton placeholder shapes that match the eventual content layout. This uses the Skeleton component created in M20 T04. Every tenant page should show content-shaped skeleton placeholders during initial data fetch instead of plain text.

## Subtasks

- [x] **dashboard** — replace loading text with skeleton KPI cards
- [x] **call-ops** — replace loading text with skeleton table rows
- [x] **call-history** — replace loading text with skeleton table
- [x] **alerts** — replace loading text with skeleton list
- [x] **automations** — replace loading text with skeleton table
- [x] **bookings** — replace loading text with skeleton cards and table
- [x] **knowledge-base** — replace loading text with skeleton list
- [x] **driver-verification** — replace loading text with skeleton table
- [x] **team** — replace loading text with skeleton table
- [x] **activity** — replace loading text with skeleton list
- [x] **integrations** — replace loading text with skeleton cards
- [x] **settings** — replace loading text with skeleton rows
- [x] **Verify** no tenant page shows "Loading..." text

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/dashboard/page.tsx` | Modify | Skeleton KPI cards |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Skeleton table rows |
| `apps/web/src/app/(tenant)/call-ops/history/page.tsx` | Modify | Skeleton table |
| `apps/web/src/app/(tenant)/call-ops/alerts/page.tsx` | Modify | Skeleton list |
| `apps/web/src/app/(tenant)/automations/page.tsx` | Modify | Skeleton table |
| `apps/web/src/solutions/appointment-booking/bookings-page.tsx` | Modify | Skeleton cards + table |
| `apps/web/src/app/(tenant)/clinic/knowledge-base/page.tsx` | Modify | Skeleton list |
| `apps/web/src/solutions/driver-verification/drivers-page.tsx` | Modify | Skeleton table |
| `apps/web/src/app/(tenant)/team/page.tsx` | Modify | Skeleton table |
| `apps/web/src/app/(tenant)/activity/page-client.tsx` | Modify | Skeleton list |
| `apps/web/src/app/(tenant)/integrations/page-client.tsx` | Modify | Skeleton cards |
| `apps/web/src/app/(tenant)/settings/recordings/page-client.tsx` | Modify | Skeleton rows |

## Acceptance Criteria

- [x] No tenant page shows "Loading..." text during initial fetch
- [x] Skeleton shapes approximate the loaded content dimensions
- [x] Skeletons pulse with `animate-pulse`
- [x] Layout does not shift when real data replaces skeletons
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Prior art: M20 T09 (Skeleton loading for admin pages)
- Depends on: M20 T04 (Skeleton component in packages/ui)
