# M21: Operator Console UX — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Reorganize tenant sidebar into job-groups | done | 2026-03-24 |
| T02 | Wrap all tenant pages in PageFrame | done | 2026-03-24 |
| T03 | Extract use-sse-stream hook from call-ops | done | 2026-03-24 |
| T04 | Extract ActiveCallsTable component | done | 2026-03-24 |
| T05 | Extract SlowdownSummary component | done | 2026-03-24 |
| T06 | Extract LiveTranscript component | done | 2026-03-24 |
| T07 | Extract SupportDrawer as proper slide-over | done | 2026-03-24 |
| T08 | Extract EscalationModal component | done | 2026-03-24 |
| T09 | Reassemble call-ops from extracted components | done | 2026-03-24 |
| T10 | Replace native alert() with inline notices | done | 2026-03-24 |
| T11 | Extract shared use-call-detail hook | done | 2026-03-24 |
| T12 | Refactor call-history to use shared hooks | done | 2026-03-24 |
| T13 | Add Skeleton loading to all tenant pages | done | 2026-03-24 |
| T14 | Add Tooltip to disabled actions on tenant pages | done | 2026-03-24 |
| T15 | Replace native confirm() with Modal on team page | done | 2026-03-24 |
| T16 | Decompose bookings-page into focused components | done | 2026-03-24 |
| T17 | Playwright regression + Chrome DevTools verification | done | 2026-03-24 |
| T18 | Extract shared API types to packages/web-shared | done | 2026-03-24 |
| T19 | Move tenant locale hooks to packages/web-shared | done | 2026-03-24 |
| T20 | Solutions receive copy/locale as props | done | 2026-03-24 |
| T21 | Move useTenantSolutionState to props pattern | done | 2026-03-24 |
| T22 | Dashboard conditional solution API imports | done | 2026-03-24 |
| T23 | Move tenant-locale format functions to web-shared | done | 2026-03-24 |
| T24 | Decompose BookingDetail (955 lines) into sub-components | done | 2026-03-24 |
| T25 | Decompose SupportDrawer (588 lines) into sub-components | done | 2026-03-24 |
| T26 | Consolidate duplicate utilities into call-ops-presenters | done | 2026-03-24 |
| T27 | Replace call-ops apiFetch with platformApiRequest | done | 2026-03-24 |
| T28 | Create shared InlineNotice component + useNotice hook | done | 2026-03-24 |
| T29 | Split useBookingsData god-hook into focused hooks | done | 2026-03-24 |
| T30 | BookingDetail/ClinicConfigEditor own data fetching (reduce prop drilling) | done | 2026-03-24 |
| T31 | Centralize SWR cache keys | done | 2026-03-24 |

## Summary

**31/31 tasks done.** M21 is complete.

### Shipped in PR #660 (2026-03-24)
Phase A (T18-T22): solution package decoupling — shared API types, locale hooks, solution state props, dashboard conditional imports.
Phase B (T01-T12, T15-T17, T20): operator console structure — sidebar job-groups, PageFrame, call-ops decomposition (1,422→335 lines), bookings decomposition (1,922→301 lines), alert/confirm replacement, SSE hook, call-detail hook, Playwright regression.

### Shipped in PR #665 (2026-03-24)
Phase C (T23-T31): post-decomposition refactoring — format functions to web-shared, BookingDetail 955→124, SupportDrawer 581→199, shared utilities, InlineNotice component, god-hook split (9 SWR→5 hooks), prop drilling reduction (17→6 props), centralized SWR keys (40+ factories).

### Final closure
- M20 delivered the shared Skeleton and Tooltip primitives that unblocked T13/T14.
- PR #671 closed the last remaining M21 work and marked the milestone complete.

## Notes

**UX decision (2026-03-24):** No manual refresh buttons. Pages must auto-update via SWR revalidation intervals or real-time updates (SSE). Remove existing refresh buttons when touching those pages. Applies to: dashboard, call-ops, bookings, all tenant pages.
