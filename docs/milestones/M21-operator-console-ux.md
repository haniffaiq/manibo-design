# M21: Operator Console UX

Status: done
Created: 2026-03-23
Owner: Jakit
Branch: feat/M21-operator-console-ux
Stream: ui
Depends on: M11 (solution package isolation — bookings/drivers must be in solutions/{name}/ui/ before decomposition), M1 (observability decomposition)
Reference: wiki/design-docs/operator-console-ux-spec.md
Prior art: docs/milestones/exec-plans/v2_ui_ux_control_system_execution_plan.md

## Goal

Decompose the call-ops monolith, align all tenant pages with the PageFrame system, reorganize the sidebar into operator job-groups (Live Support / Review / Solution domains / Manage), replace native `alert()` with inline notices, and bring the operator console to the same UX grammar as the M20 deployment console. Shared observability decomposition lives in M1 — this milestone covers everything else in the tenant workbench.

## Design Decisions

1. **Sidebar reorganization into job-groups** — "Live Support" (Call Ops, Alerts), "Review" (Call History, Observability, Automations), solution-specific groups (Clinic, Logistics), "Manage" (admin-only). Solution groups are domain-named and only appear when the solution is enabled.

2. **Call-ops decomposition into 6 components + 1 shared hook** — ActiveCallsTable, SlowdownSummary, LiveTranscript, SupportDrawer, EscalationModal, CallOpsPage shell, plus a reusable `use-sse-stream.ts` hook shared with call history.

3. **Support drawer replaces Modal abuse** — current support drawer uses Modal with className hacks to create a right-panel. Replace with a proper slide-over pattern (position fixed, slides from right, full-screen on mobile).

4. **All native alert() replaced with inline notices** — "Token copied", "Takeover accepted" etc. become auto-dismiss inline success notices, not browser dialogs.

5. **All tenant pages use PageFrame** — dashboard uses `standard`, call-ops uses `workspace`, observability uses `full`, settings uses `reading`. No more raw `<main>` tags.

6. **Call-ops action hierarchy** — "Take over" is always the most prominent button (primary variant). All other actions are outline. This matches the operator mental model: the most dangerous action should be the most visible.

7. **Bookings decomposition** — 1,922-line monolith split into BookingOutcomesList, FollowUpQueue, BookingDetail, IntegrationStatusCard, ClinicConfigEditor, BrowserVoiceCard.

## Wireframes

### Sidebar (Operator)

```
┌─────────────────────────────┐
│  [K] Workbench              │
│  Clinic operator · EN       │
├─────────────────────────────┤
│  Dashboard                  │
├─────────────────────────────┤
│  LIVE SUPPORT               │
│    Call Ops                  │
│    Alerts                   │
├─────────────────────────────┤
│  REVIEW                     │
│    Call History              │
│    Observability            │
├─────────────────────────────┤
│  CLINIC                     │
│    Bookings                 │
│    Knowledge Base           │
└─────────────────────────────┘
```

### Call Ops (workspace width)

```
┌──────────────────────────────────────────────────────────────────────┐
│  H1: Live Calls                                          [Refresh]  │
│  Monitor active calls and intervene when needed.                     │
├──────────────────────────────────────────────────────────────────────┤
│  SLOWDOWN SUMMARY                     │  ROUTE NEEDING ATTENTION    │
│  ┌────────┬────────┬────────┐        │  intake · clinic_reg        │
│  │ AI     │ Speech │ Voice  │        │  p95: 1.4s  ·  12 calls    │
│  │ 340ms  │ 120ms  │ 95ms   │        │                             │
│  └────────┴────────┴────────┘        │                             │
├──────────────────────────────────────┴─────────────────────────────┤
│  ACTIVE CALLS                          │  LIVE TRANSCRIPT           │
│  ┌──────────────────────────────────┐  │  Call: call_abc123         │
│  │ call_abc  Voice Call             │  │  ┌────────────────────────┐│
│  │ clinic_registration · 0:42      │  │  │ #1 Agent: "Laba diena" ││
│  │ [Support] [Listen] [Join]       │  │  │ #2 Caller: "Norėčiau.."││
│  │ [Take over] [Transfer now]      │  │  └────────────────────────┘│
│  └──────────────────────────────────┘  │  [Stop]                    │
├────────────────────────────────────────┴─────────────────────────────┤
│  WHERE CALLS SLOWED DOWN (route hotspot table)                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Bookings (standard width)

```
┌──────────────────────────────────────────────────────────────┐
│  H1: Clinic Bookings                            [Refresh]    │
│  Review booking outcomes and work the follow-up queue.       │
├──────────────────────────────────────────────────────────────┤
│  INTEGRATION STATUS   │  CONFIG                              │
│  CRM: ● Connected     │  Reminder: 24h before appointment   │
│  SMS: ○ Not set up    │  [Edit config]                       │
├────────────────────────┴─────────────────────────────────────┤
│  FOLLOW-UP QUEUE                                              │
│  Patient A · Handed off · 2h ago         [Claim] [View call] │
│  Patient B · Failed booking · 4h         [Claim] [View call] │
├──────────────────────────────────────────────────────────────┤
│  RECENT BOOKINGS                                              │
│  Call │ Patient │ Status │ Doctor │ Time │ Actions            │
└──────────────────────────────────────────────────────────────┘
```

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Reorganize tenant sidebar into job-groups | done | none |
| T02 | Wrap all tenant pages in PageFrame | done | none |
| T03 | Extract use-sse-stream hook from call-ops | done | none |
| T04 | Extract ActiveCallsTable component | done | T03 |
| T05 | Extract SlowdownSummary component | done | none |
| T06 | Extract LiveTranscript component | done | T03 |
| T07 | Extract SupportDrawer as proper slide-over | done | T03 |
| T08 | Extract EscalationModal component | done | none |
| T09 | Reassemble call-ops from extracted components | done | T04-T08 |
| T10 | Replace native alert() with inline notices | done | T09 |
| T11 | Extract shared use-call-detail hook | done | T03 |
| T12 | Refactor call-history to use shared hooks | done | T11 |
| T13 | Add Skeleton loading to all tenant pages | done | M20 (Skeleton) |
| T14 | Add Tooltip to disabled actions on tenant pages | done | M20 (Tooltip) |
| T15 | Replace native confirm() with Modal on team page | done | none |
| T16 | Decompose bookings-page into focused components | done | T18 |
| T17 | Playwright regression + Chrome DevTools verification | done | T01-T16, T18-T22 |
| T18 | Extract shared API types to packages/web-shared | done | none |
| T19 | Move tenant-locale-provider to packages/web-shared | done | none |
| T20 | Solutions receive copy/locale as props | done | T16, T19 |
| T21 | Move useTenantSolutionState to props pattern | done | none |
| T22 | Dashboard conditional solution API imports | done | T18 |
| T23 | Move tenant-locale format functions to packages/web-shared | done | T19 |
| T24 | Decompose BookingDetail (955 lines) into focused sub-components | done | T16 |
| T25 | Decompose SupportDrawer (588 lines) into focused sub-components | done | T07 |
| T26 | Consolidate duplicate utilities into shared call-ops-presenters | done | T09 |
| T27 | Replace call-ops apiFetch with platformApiRequest from web-shared | done | T09 |
| T28 | Create shared InlineNotice component + useNotice hook | done | T10 |
| T29 | Split useBookingsData god-hook into focused data hooks | done | T16 |
| T30 | Reduce BookingDetail/ClinicConfigEditor prop drilling via own data fetching | done | T29 |
| T31 | Centralize SWR cache keys to prevent collisions | done | T22 |

## Acceptance Criteria

- [x] Sidebar shows job-groups: Live Support, Review, solution domains (Clinic/Logistics), Manage (admin)
- [x] All tenant pages use `PageFrame` with correct width variant
- [x] `call-ops/page.tsx` is under 200 lines (composition shell only)
- [x] Each extracted component in `apps/web/src/components/call-ops/`
- [x] `use-sse-stream.ts` used by call-ops (transcript + ops streams + support drawer) — call-history does not use SSE
- [x] No native `alert()` calls in tenant pages
- [x] No native `confirm()` calls in tenant pages
- [x] All disabled buttons have Tooltip explanation
- [x] All tenant pages except observability show Skeleton during initial load (no "Loading..." text) — observability loading states are M1's scope
- [x] Support drawer is a proper slide-over (not Modal with className hacks)
- [x] "Take over" is always the primary-variant button on active call rows
- [x] No type duplication between `apps/web/src/lib/api/` and `solutions/*/ui/src/api/` — shared types in `packages/web-shared/types/`
- [x] Solution UI packages have zero `@/` imports — all resolved via `@grove/web-shared` or props
- [x] `pnpm -C solutions/appointment_booking/ui check-types` passes standalone
- [x] `pnpm -C solutions/driver_verification/ui check-types` passes standalone
- [x] Dashboard does not unconditionally import solution API modules
- [x] `pnpm -C apps/web lint` passes
- [x] `pnpm -C apps/web check-types` passes
- [x] All Playwright E2E tests pass
- [x] Chrome DevTools MCP desktop + mobile screenshots for changed pages

## Verification

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test
NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
tools/scripts/e2e/run-web-e2e.sh
# Chrome DevTools MCP verification (AGENTS.md rule 7)
# Desktop + mobile screenshots for every changed tenant page
```

## Non-Goals

- No observability decomposition (covered by M1)
- No backend API changes
- No new tenant pages
- No outbound campaign UI
- No public chat widget
- No i18n copy changes beyond sidebar labels
- No driver-verification decomposition (functional, lower priority)
