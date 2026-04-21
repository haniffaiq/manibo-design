# T02: Move Appointment-Booking UI to solutions/appointment_booking/ui/

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T02 - move appointment-booking UI to solution package`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

Extract all appointment-booking frontend code from `apps/web/src/solutions/appointment-booking/` into its own standalone package at `solutions/appointment_booking/ui/`. This package is published as `@solution/appointment-booking-ui` in the pnpm workspace. All internal import paths must be updated to resolve within the new package structure.

## Subtasks

- [x] **Create package scaffolding** — `solutions/appointment_booking/ui/package.json`, `tsconfig.json`, `src/` directory
- [x] **Move bookings-page.tsx** to `src/pages/`
- [x] **Move clinic-browser-voice-card.tsx** to `src/components/`
- [x] **Move livekit-browser-room.ts** to `src/`
- [x] **Move manifest.ts** to `src/`
- [x] **Move api/clinic-bookings.ts** to `src/api/`
- [x] **Move api/clinic-knowledge-base.ts** to `src/api/`
- [x] **Move widgets/dashboard-widget.tsx** to `src/widgets/`
- [x] **Update all import paths** in moved files to resolve within the new package
- [x] **Add `@solution/appointment-booking-ui` to pnpm-workspace.yaml**
- [x] **Verify package builds** — `pnpm -C solutions/appointment_booking/ui build` or typecheck succeeds

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/appointment_booking/ui/package.json` | Create | Package as `@solution/appointment-booking-ui` with exports map |
| `solutions/appointment_booking/ui/tsconfig.json` | Create | TypeScript config extending shared config |
| `solutions/appointment_booking/ui/src/pages/bookings-page.tsx` | Move | From `apps/web/src/solutions/appointment-booking/bookings-page.tsx` |
| `solutions/appointment_booking/ui/src/components/clinic-browser-voice-card.tsx` | Move | From `apps/web/src/solutions/appointment-booking/` |
| `solutions/appointment_booking/ui/src/livekit-browser-room.ts` | Move | From `apps/web/src/solutions/appointment-booking/` |
| `solutions/appointment_booking/ui/src/manifest.ts` | Move | From `apps/web/src/solutions/appointment-booking/` |
| `solutions/appointment_booking/ui/src/api/clinic-bookings.ts` | Move | From `apps/web/src/solutions/appointment-booking/api/` |
| `solutions/appointment_booking/ui/src/api/clinic-knowledge-base.ts` | Move | From `apps/web/src/solutions/appointment-booking/api/` |
| `solutions/appointment_booking/ui/src/widgets/dashboard-widget.tsx` | Move | From `apps/web/src/solutions/appointment-booking/widgets/` |
| `pnpm-workspace.yaml` | Modify | Add `solutions/appointment_booking/ui` |

## Acceptance Criteria

- [x] Package `@solution/appointment-booking-ui` exists at `solutions/appointment_booking/ui/`
- [x] All files moved from `apps/web/src/solutions/appointment-booking/`
- [x] All imports within moved files resolve correctly
- [x] Package is listed in `pnpm-workspace.yaml`
- [x] `pnpm install` succeeds with the new workspace member
- [x] `apps/web/src/solutions/appointment-booking/` directory is empty or deleted

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
- Conventions: T01 solution UI package conventions
