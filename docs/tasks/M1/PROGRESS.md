# M1: Observability UI Redesign + Component Library Hardening — Progress

## Task Status

### Phase 1 — Component library quick wins

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T09 | Add loading prop to DataTable | done | 2026-03-24 |
| T10 | Add allowEmpty prop to Select | done | 2026-03-24 |
| T11 | Expand E2E Radix test helpers | done | 2026-03-24 |
| T12 | Centralize toErrorMessage in web-shared | done | 2026-03-24 |
| T13 | Extract AdminPageShell component | done | 2026-03-24 |

### Phase 2 — Observability decomposition

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Extract utility functions and types | done | 2026-03-24 |
| T02 | Extract CaseQueue component | done | 2026-03-24 |
| T03 | Extract CaseHeader and CaseSummaryStrip | done | 2026-03-24 |
| T04 | Extract EvidenceRail and EvidenceEventRow | done | 2026-03-24 |
| T05 | Extract CaseRecordPanel (right rail) | done | 2026-03-24 |
| T06 | Extract RunCompare and ComparisonSection | done | 2026-03-24 |
| T07 | Reassemble Workspace from extracted components | done | 2026-03-24 |
| T08 | Verify no visual regression with E2E tests | done | 2026-03-24 |

### Phase 3 — Adoption sweep

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T14 | Migrate admin pages to DataTable loading prop | done | 2026-03-24 |
| T15 | Migrate pages to Select allowEmpty | done | 2026-03-24 |
| T16 | Migrate pages to centralized toErrorMessage | done | 2026-03-24 |

## Notes

Starting point: `apps/web/src/components/observability-workspace.tsx` (2,375 lines, monolithic)
Target: `apps/web/src/components/observability/` directory with focused components

Phase 1 quick wins discovered during M20/M21/M22 — tackle first since they're independent and small.
Phase 2 is the main decomposition — the last monolith in the frontend.
Phase 3 sweeps the quick-win patterns across existing pages.
