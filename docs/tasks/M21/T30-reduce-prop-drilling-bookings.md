# T30: Reduce Bookings Prop Drilling via Component-Owned Data Fetching

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T29
> **Priority**: 5 (clean architecture)

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T30 - reduce bookings prop drilling via own data fetching`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

BookingDetail takes 14+ props and ClinicConfigEditor takes 8. After T29 splits the god-hook, components can own their data fetching (the pattern dashboard widgets use successfully). The bookings-page shell passes identifiers (callId, solutionEnabled), and components fetch their own data via focused hooks.

## Subtasks

- [x] **BookingDetail** calls `useBookingResults(callId)` + `useFollowUps(callId)` internally
- [x] **ClinicConfigEditor** calls `useClinicConfig()` internally
- [x] **IntegrationStatusCard** calls `useClinicIntegrations()` internally
- [x] **Update bookings-page.tsx** — remove data-passing props, pass only identifiers and callbacks

## Acceptance Criteria

- [x] BookingDetail has <6 props (identifiers + callbacks only)
- [x] ClinicConfigEditor has <4 props
- [x] `pnpm -C solutions/appointment_booking/ui check-types` passes
- [x] `pnpm -C apps/web check-types` passes
