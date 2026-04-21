# M21 Session Prompt: T13 + T14 (Skeleton + Tooltip)

> Historical prompt only. M21 is complete and archived; do not use this as a live implementation brief.

> **Prerequisite:** M20 must be merged first. T13 needs `Skeleton` from `packages/ui`, T14 needs `Tooltip` + `TooltipProvider` from `packages/ui`.

## Context

- Historical context: this prompt captured the point when T13/T14 were the last remaining M21 tasks.
- Historical branch guidance: `feat/M21-T13-T14` from main after M20 merges.
- Historical PR context: PR #660 (Phase A+B) and PR #665 (Phase C refactoring) are merged.

## Key files to read first

- docs/milestones/M21-operator-console-ux.md (milestone doc)
- docs/tasks/M21/PROGRESS.md (task status — check T13/T14 are still blocked)
- docs/tasks/M21/T13-add-skeleton-loading-tenant.md (full task spec)
- docs/tasks/M21/T14-add-tooltip-disabled-actions.md (full task spec)
- Verify Skeleton and Tooltip exist: `ls packages/ui/src/skeleton* packages/ui/src/tooltip*`

## T13: Add Skeleton loading to all tenant pages

Replace "Loading..." text on ALL tenant pages with Skeleton placeholder shapes:

| Page | File | Skeleton pattern |
|------|------|-----------------|
| dashboard | `apps/web/src/app/(tenant)/dashboard/page.tsx` | 4 KPI cards |
| call-ops | `apps/web/src/app/(tenant)/call-ops/page.tsx` | Table rows |
| call-history | `apps/web/src/app/(tenant)/call-ops/history/page.tsx` | Table |
| alerts | `apps/web/src/app/(tenant)/call-ops/alerts/page.tsx` | List |
| automations | `apps/web/src/app/(tenant)/automations/page.tsx` | Table |
| bookings | `solutions/appointment_booking/ui/src/bookings-page.tsx` | Cards + table |
| knowledge-base | `apps/web/src/app/(tenant)/clinic/knowledge-base/page.tsx` | List |
| driver-verification | `solutions/driver_verification/ui/src/drivers-page.tsx` | Table |
| team | `apps/web/src/app/(tenant)/team/page.tsx` | Table |
| activity | `apps/web/src/app/(tenant)/activity/page-client.tsx` | List |
| integrations | `apps/web/src/app/(tenant)/integrations/page-client.tsx` | Cards |
| settings | `apps/web/src/app/(tenant)/settings/recordings/page-client.tsx` | Rows |

**Acceptance:** No "Loading..." text on any tenant page. Skeletons pulse with animate-pulse. No layout shift when real data replaces skeletons.

## T14: Add Tooltip to disabled actions on tenant pages

1. Add `TooltipProvider` to tenant layout (`apps/web/src/app/(tenant)/layout.tsx`)
2. Wrap every disabled button with `Tooltip` explaining why it's disabled
3. Pages to update: call-ops, dashboard, alerts, team, automations, settings, integrations, bookings, driver-verification

**Acceptance:** Every disabled button has a Tooltip. Tooltips appear on hover and focus. Text is descriptive and actionable.

## UX decisions

- **No refresh buttons.** Pages auto-update via SWR refreshInterval or SSE.
- **Disabled buttons use solid colors** (bg-neutral-100 text-neutral-400), never opacity.
- **Destructive disabled uses** bg-error-50 text-error-300.

## Verification

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test
pnpm -C solutions/appointment_booking/ui check-types
pnpm -C solutions/driver_verification/ui check-types
NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
```

After T13+T14, update PROGRESS.md and change milestone status to `done`.
