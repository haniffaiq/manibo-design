# T29: Split useBookingsData God-Hook into Focused Hooks

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T16
> **Priority**: 5 (enables T30)

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T29 - split useBookingsData into focused hooks`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

`useBookingsData` (248 lines, 9 SWR calls) is a god-hook that fetches booking results, follow-ups, integration status, config, config schema, follow-up detail, booking detail, automation status, and team users. Split into focused hooks that each component can own.

## Subtasks

- [x] **Create `useBookingResults`** — listing + detail SWR calls
- [x] **Create `useFollowUps`** — follow-up queue + detail SWR calls
- [x] **Create `useClinicIntegrations`** — integration status SWR
- [x] **Create `useClinicConfig`** — config + schema SWR
- [x] **Update bookings-page.tsx** — compose from focused hooks (or let components call their own)
- [x] **Remove `useBookingsData`** if fully replaced

## Acceptance Criteria

- [x] No single hook with >5 SWR calls
- [x] Each focused hook is under 60 lines
- [x] `pnpm -C solutions/appointment_booking/ui check-types` passes
- [x] `pnpm -C apps/web check-types` passes
