# T31: Centralize SWR Cache Keys

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T22
> **Priority**: 5 (prevent collisions as codebase grows)

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T31 - centralize SWR cache keys`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

SWR cache keys are hardcoded strings scattered across components: `"call-ops-dashboard"`, `"clinic-dashboard-bookings"`, `"driver-dashboard-active"`, `"tenant-dashboard"`, `"tenant-solutions"`, etc. No central registry, easy to collide, impossible to invalidate cross-component.

Fix: Create `apps/web/src/lib/swr-keys.ts` with typed key factories. Components import key functions instead of hardcoding strings.

## Subtasks

- [x] **Create `apps/web/src/lib/swr-keys.ts`** — key factory functions: `swrKeys.callOpsDashboard()`, `swrKeys.clinicBookings(params)`, `swrKeys.driverDashboard(type)`, etc.
- [x] **Update all SWR call sites** — import key factories, replace hardcoded strings
- [x] **Verify** no hardcoded SWR key strings remain outside swr-keys.ts

## Acceptance Criteria

- [x] All SWR keys defined in one file
- [x] No hardcoded SWR key strings in component files
- [x] `pnpm -C apps/web check-types` passes
