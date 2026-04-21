# M3: Clinic Console Follow-Up

Status: done
Created: 2026-03-20
Owner: Jakit
Branch: feat/M3-clinic-console-followup
Stream: platform
Depends on: M21
Reference: docs/requirements/checklist.md rows 425-427, docs/requirements/ui-requirements.md section 31

## Goal

Complete clinic handoff/support console rows: agent hands off to human operator, agent transfers immediately for urgent needs, clinic operators claim/assign/resolve follow-up work. Backend handoff routes exist; this milestone adds UI depth for live handoff state, urgent transfer UX, and a follow-up case queue.

## Design Decisions

1. **Reuse existing call-ops surfaces** -- handoff/transfer state displays inside `/call-ops` and `/call-ops/history`, not a separate console.
2. **Follow-up queue lives in bookings page** -- clinic operators already use `/bookings`; follow-up cases surface there with claim/assign/resolve actions.
3. **Handoff events are timeline entries** -- handoff and transfer events appear as evidence rail entries in observability, not separate views.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Live handoff state in call-ops | done | none |
| T02 | Urgent transfer UX | done | T01 |
| T03 | Follow-up case queue UX | done | none |
| T04 | Bookings-to-call-ops continuity | done | T01, T03 |
| T05 | E2E tests | done | T01-T04 |

## Acceptance Criteria

- [x] Handoff events visible in call-ops live view with operator claim action
- [x] Urgent transfer triggers immediate visual escalation in call-ops
- [x] Follow-up work items appear in bookings page with claim/assign/resolve actions
- [x] Operator can navigate from bookings follow-up to call-ops history for context
- [x] `pnpm -C apps/web lint` passes
- [x] `pnpm -C apps/web check-types` passes
- [x] Playwright E2E tests pass for clinic handoff flow

## Verification

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
# Full Playwright suite (required for any apps/web layout change)
NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
# UI harness (desktop + mobile proof)
tools/scripts/e2e/run-web-e2e.sh
```

## Non-Goals

- No new standalone clinic console application
- No backend handoff route changes (already exist)
- No real-time audio/video in handoff (voice remains in LiveKit)
