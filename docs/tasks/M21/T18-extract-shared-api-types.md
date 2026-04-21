# T18: Extract Shared API Types to packages/web-shared

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T18 - extract shared API types to packages/web-shared`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

`apps/web/src/lib/api/clinic-bookings.ts` and `solutions/appointment_booking/ui/src/api/clinic-bookings.ts` define the same types differently (branded vs plain string). Same for driver-verification. Dashboard imports from the apps/web copy, solution widgets import from the solution copy — causing type incompatibility at the boundary.

Fix: Extract the shared response/request types into `packages/web-shared/src/types/clinic.ts` and `packages/web-shared/src/types/driver.ts`. Both apps/web and solution packages import types from there. API fetch functions stay in each location (they return the shared types).

## Subtasks

- [x] **Create `packages/web-shared/src/types/clinic.ts`** — extract ClinicBookingResultListItem, ClinicFollowUpQueueItem, ClinicIntegrationStatusItem and related types
- [x] **Create `packages/web-shared/src/types/driver.ts`** — extract DriverRecord, DriverVerificationJobSummary and related types
- [x] **Update `packages/web-shared/package.json` exports** — add `./types/clinic` and `./types/driver` export entries
- [x] **Update `apps/web/src/lib/api/clinic-bookings.ts`** — import types from `@grove/web-shared/types/clinic`, remove local type definitions
- [x] **Update `apps/web/src/lib/api/driver-verification.ts`** — import types from `@grove/web-shared/types/driver`, remove local type definitions
- [x] **Update `solutions/appointment_booking/ui/src/api/clinic-bookings.ts`** — import types from `@grove/web-shared/types/clinic`, remove local type definitions
- [x] **Update `solutions/driver_verification/ui/src/api/driver-verification.ts`** — import types from `@grove/web-shared/types/driver`, remove local type definitions

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/web-shared/src/types/clinic.ts` | Create | Shared clinic booking response/request types |
| `packages/web-shared/src/types/driver.ts` | Create | Shared driver verification response/request types |
| `packages/web-shared/package.json` | Modify | Add exports for `./types/clinic` and `./types/driver` |
| `apps/web/src/lib/api/clinic-bookings.ts` | Modify | Import types from @grove/web-shared, remove local definitions |
| `apps/web/src/lib/api/driver-verification.ts` | Modify | Import types from @grove/web-shared, remove local definitions |
| `solutions/appointment_booking/ui/src/api/clinic-bookings.ts` | Modify | Import types from @grove/web-shared, remove local definitions |
| `solutions/driver_verification/ui/src/api/driver-verification.ts` | Modify | Import types from @grove/web-shared, remove local definitions |

## Acceptance Criteria

- [x] Zero type duplication between apps/web and solution packages for clinic and driver types
- [x] Both apps/web and solution packages import shared types from `@grove/web-shared`
- [x] API fetch functions remain in their respective locations, returning the shared types
- [x] `pnpm -C apps/web check-types` passes
- [x] `pnpm -C solutions/appointment_booking/ui check-types` passes
- [x] `pnpm -C solutions/driver_verification/ui check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Design decision: "Eliminate type duplication between apps/web and solution packages"
