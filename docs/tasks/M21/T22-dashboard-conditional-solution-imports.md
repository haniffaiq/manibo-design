# T22: Dashboard Conditional Solution API Imports

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T18

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T22 - dashboard conditional solution API imports`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

`dashboard/page.tsx` unconditionally imports `listClinicBookingResults`, `listDrivers`, etc. from `@/lib/api/clinic-bookings` and `@/lib/api/driver-verification`. This forces keeping independent API copies in apps/web instead of re-exporting from solution packages, because the solution packages are optional.

Fix: Move solution-specific dashboard data loading into the generated dashboard widget components. The dashboard page calls only platform APIs (health, usage, active calls). Solution data loading happens inside `ClinicDashboardWidget` and `DriverDashboardWidget` (which are already dynamically imported via the generator). The dashboard passes only platform-level data (activeCalls, routeHotspotLabel) to widgets.

After T18 + T22, `apps/web/src/lib/api/clinic-bookings.ts` and `apps/web/src/lib/api/driver-verification.ts` can be deleted (types in web-shared, fetch functions in solution packages, dashboard doesn't import them).

## Subtasks

- [x] **Update ClinicDashboardWidget** — move clinic data fetching (listClinicBookingResults, listFollowUpQueue, etc.) into the widget component itself, using SWR calls internally
- [x] **Update DriverDashboardWidget** — move driver data fetching (listDrivers, etc.) into the widget component itself, using SWR calls internally
- [x] **Update dashboard/page.tsx** — remove imports from `@/lib/api/clinic-bookings` and `@/lib/api/driver-verification`, pass only platform-level props (activeCalls, routeHotspotLabel) to widgets
- [x] **Delete `apps/web/src/lib/api/clinic-bookings.ts`** — after verifying no remaining imports
- [x] **Delete `apps/web/src/lib/api/driver-verification.ts`** — after verifying no remaining imports
- [x] **Verify no remaining imports** — grep apps/web for any imports from the deleted files

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/appointment_booking/ui/src/widgets/dashboard-widget.tsx` | Modify | Add internal data fetching (SWR), accept only platform-level props |
| `solutions/driver_verification/ui/src/widgets/dashboard-widget.tsx` | Modify | Add internal data fetching (SWR), accept only platform-level props |
| `apps/web/src/app/(tenant)/dashboard/page.tsx` | Modify | Remove solution API imports, pass only platform props to widgets |
| `apps/web/src/lib/api/clinic-bookings.ts` | Delete | Types moved to web-shared (T18), fetch functions moved to solution widgets |
| `apps/web/src/lib/api/driver-verification.ts` | Delete | Types moved to web-shared (T18), fetch functions moved to solution widgets |

## Acceptance Criteria

- [x] `dashboard/page.tsx` has zero imports from `@/lib/api/clinic-bookings` or `@/lib/api/driver-verification`
- [x] `apps/web/src/lib/api/clinic-bookings.ts` is deleted
- [x] `apps/web/src/lib/api/driver-verification.ts` is deleted
- [x] ClinicDashboardWidget fetches its own data internally
- [x] DriverDashboardWidget fetches its own data internally
- [x] Dashboard still renders correctly with all widgets showing data
- [x] `pnpm -C apps/web check-types` passes
- [x] `pnpm -C solutions/appointment_booking/ui check-types` passes
- [x] `pnpm -C solutions/driver_verification/ui check-types` passes
- [x] Dashboard E2E tests pass

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Dependency: T18 (extract shared API types) must be done first so types are available from web-shared
- Design decision: "Solution widgets own their data fetching, dashboard is platform-only"
