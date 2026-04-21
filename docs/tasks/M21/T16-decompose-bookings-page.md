# T16: Decompose Bookings Page into Focused Components

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T16 - decompose bookings page into focused components`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Decompose the bookings page monolith (1,922 lines) into focused components, each in its own file. The bookings page becomes a thin composition shell under 300 lines that imports and wires together the extracted components. Components live in the solution-specific directory since bookings is an appointment-booking solution feature.

## Subtasks

- [x] **Create BookingOutcomesList** — `apps/web/src/solutions/appointment-booking/components/booking-outcomes-list.tsx`
- [x] **Create FollowUpQueue** — `apps/web/src/solutions/appointment-booking/components/follow-up-queue.tsx`
- [x] **Create BookingDetail** — `apps/web/src/solutions/appointment-booking/components/booking-detail.tsx`
- [x] **Create IntegrationStatusCard** — `apps/web/src/solutions/appointment-booking/components/integration-status-card.tsx`
- [x] **Create ClinicConfigEditor** — `apps/web/src/solutions/appointment-booking/components/clinic-config-editor.tsx`
- [x] **Create BrowserVoiceCard** — `apps/web/src/solutions/appointment-booking/components/browser-voice-card.tsx`
- [x] **Rewrite bookings page** (`apps/web/src/solutions/appointment-booking/bookings-page.tsx`) as composition shell under 300 lines. Note: there is no `apps/web/src/app/(tenant)/bookings/page.tsx` — the route is contributed via `apps/web/src/solutions/appointment-booking/manifest.ts`
- [x] **Run E2E tests** — all bookings/clinic E2E tests pass

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/solutions/appointment-booking/components/booking-outcomes-list.tsx` | Create | Recent bookings table with status and actions |
| `apps/web/src/solutions/appointment-booking/components/follow-up-queue.tsx` | Create | Queue of bookings needing operator follow-up |
| `apps/web/src/solutions/appointment-booking/components/booking-detail.tsx` | Create | Detail view for a single booking |
| `apps/web/src/solutions/appointment-booking/components/integration-status-card.tsx` | Create | CRM/SMS integration connection status |
| `apps/web/src/solutions/appointment-booking/components/clinic-config-editor.tsx` | Create | Clinic configuration form (reminder timing, etc.) |
| `apps/web/src/solutions/appointment-booking/components/browser-voice-card.tsx` | Create | Browser-based voice calling card |
| `apps/web/src/solutions/appointment-booking/bookings-page.tsx` | Modify | Rewrite as composition shell under 300 lines |

## Acceptance Criteria

- [x] Bookings page is under 300 lines (composition shell only)
- [x] Each extracted component in its own file under `solutions/appointment-booking/components/`
- [x] All 6 components render correctly with props
- [x] All bookings/clinic E2E tests pass
- [x] No inline rendering logic remains in bookings page
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Design decision: "Bookings decomposition — 1,922-line monolith split"
