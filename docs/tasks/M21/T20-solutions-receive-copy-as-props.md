# T20: Solutions Receive Copy/Locale as Props

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T16, T19

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T20 - solutions receive copy/locale as props`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Solution components call `useTenantCopy()` internally, coupling them to the host app's locale system (942-line copy object). When decomposing bookings (T16), each component would inherit this coupling.

Fix: Decomposed solution components receive `copy` and `locale` as props from their parent page component. The page component (bookings-page.tsx composition shell) calls `useTenantCopy()` once and passes it down. Internal components never call the hook directly. This is done naturally during/after T16 decomposition — each extracted component (BookingOutcomesList, FollowUpQueue, BookingDetail, etc.) receives copy as a prop.

## Subtasks

- [x] **Update BookingOutcomesList** — accept copy/locale as props, remove internal useTenantCopy() call
- [x] **Update FollowUpQueue** — accept copy/locale as props, remove internal useTenantCopy() call
- [x] **Update BookingDetail** — accept copy/locale as props, remove internal useTenantCopy() call
- [x] **Update IntegrationStatusCard** — accept copy/locale as props, remove internal useTenantCopy() call
- [x] **Update ClinicConfigEditor** — accept copy/locale as props, remove internal useTenantCopy() call
- [x] **Update BrowserVoiceCard** — accept copy/locale as props, remove internal useTenantCopy() call
- [x] **Update bookings-page.tsx shell** — call useTenantCopy() once, pass copy/locale to all child components
- [x] **Update drivers-page.tsx** — same pattern: call useTenantCopy() once, pass to children
- [x] **Verify no internal useTenantCopy() calls** — grep all solution sub-components for useTenantCopy, confirm only page shells call it

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/appointment_booking/ui/src/components/booking-outcomes-list.tsx` | Modify | Accept copy/locale props, remove useTenantCopy() |
| `solutions/appointment_booking/ui/src/components/follow-up-queue.tsx` | Modify | Accept copy/locale props, remove useTenantCopy() |
| `solutions/appointment_booking/ui/src/components/booking-detail.tsx` | Modify | Accept copy/locale props, remove useTenantCopy() |
| `solutions/appointment_booking/ui/src/components/integration-status-card.tsx` | Modify | Accept copy/locale props, remove useTenantCopy() |
| `solutions/appointment_booking/ui/src/components/clinic-config-editor.tsx` | Modify | Accept copy/locale props, remove useTenantCopy() |
| `solutions/appointment_booking/ui/src/components/browser-voice-card.tsx` | Modify | Accept copy/locale props, remove useTenantCopy() |
| `solutions/appointment_booking/ui/src/bookings-page.tsx` | Modify | Call useTenantCopy() once, pass to all children |
| `solutions/driver_verification/ui/src/drivers-page.tsx` | Modify | Call useTenantCopy() once, pass copy/locale to children |

## Acceptance Criteria

- [x] No `useTenantCopy()` calls inside solution sub-components (only in top-level page shells)
- [x] All decomposed components accept copy/locale as props
- [x] bookings-page.tsx calls useTenantCopy() exactly once
- [x] drivers-page.tsx calls useTenantCopy() exactly once
- [x] `pnpm -C apps/web check-types` passes
- [x] `pnpm -C solutions/appointment_booking/ui check-types` passes
- [x] `pnpm -C solutions/driver_verification/ui check-types` passes
- [x] All bookings and driver E2E tests pass

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Dependency: T16 (decompose bookings page) creates the components this task modifies
- Dependency: T19 (move locale hooks to web-shared) provides the shared hook import path
