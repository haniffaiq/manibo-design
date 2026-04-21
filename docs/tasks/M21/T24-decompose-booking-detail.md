# T24: Decompose BookingDetail (955 lines) into Sub-Components

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T16
> **Priority**: 2 (955-line component is unacceptable)

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T24 - decompose BookingDetail into sub-components`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

T16 decomposed bookings-page from 1,923 to 301 lines, but BookingDetail absorbed 955 lines of complexity. It contains the next-step checklist, appointment/patient details, follow-up claim/assign/resolve actions, and after-call automation tasks — all in one file. Each section should be its own component.

## Subtasks

- [x] **Extract NextStepChecklist** — the "What to do now" checklist section
- [x] **Extract AppointmentPatientDetails** — appointment and patient information cards
- [x] **Extract FollowUpActions** — claim, assign, resolve action buttons and state
- [x] **Extract AutomationTaskList** — after-call automation status and record/fail actions
- [x] **Rewrite BookingDetail** as composition shell under 200 lines
- [x] **Verify** all bookings E2E tests pass

## Acceptance Criteria

- [x] BookingDetail is under 200 lines (composition shell)
- [x] Each sub-component in `solutions/appointment_booking/ui/src/components/`
- [x] `pnpm -C solutions/appointment_booking/ui check-types` passes
- [x] `pnpm -C apps/web check-types` passes
