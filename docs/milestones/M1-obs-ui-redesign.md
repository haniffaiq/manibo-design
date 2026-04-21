# M1: Observability UI Redesign + Component Library Hardening

Status: done
Created: 2026-03-20
Owner: Jakit
Branch: feat/M1-obs-ui-redesign
Stream: ui
Depends on: M20, M22
Reference: docs/milestones/exec-plans/v2_ui_ux_control_system_execution_plan.md

## Goal

Decompose the 2,375-line monolithic `observability-workspace.tsx` into focused components and harden the shared component library with patterns discovered during M20/M21/M22. The obs workspace is the last monolith in the frontend — every milestone touches it. The component library gaps (DataTable loading, Select empty-value, E2E helpers, toErrorMessage, AdminPageShell) create repeated friction across all admin and tenant pages.

## Design Decisions

1. **Queue/Case/Compare as three navigation modes** — not a permanent split-screen. Queue gets full width for scanning. Case gets full width for the evidence rail. Compare gets full width for side-by-side.

2. **Component decomposition by concern** — CaseQueue, CaseHeader, EvidenceRail, EvidenceEventRow, CaseRecordPanel, EventInspector, AudioPlayer, RunCompare, CaseSummaryStrip. Each is a focused component with clear props contract.

3. **Evidence rail is the signature element** — gets the most screen real estate. Inline gap markers (amber dashed rows) for missing evidence, per V2 contract. Left-border severity accents instead of full-card coloring.

4. **No evidence source attribution yet** — backend doesn't expose source metadata per timeline item. No fake `[raw] [api] [ui]` tags until the API supports it.

5. **Tenant vs Admin remain structurally identical** — same components, different data (scope prop). No separate component trees.

6. **Visual language: forensic/operational** — paper neutrals, muted blue for selected, amber for degraded, red only for broken truth. No rainbow telemetry sludge.

7. **DataTable loading prop** — built-in Skeleton rendering based on column count. Eliminates 12 copies of the same loading conditional across admin and tenant pages.

8. **Select empty-value sentinel handled at component level** — `allowEmpty` prop on Select + internal `__none__` sentinel. Prevents the per-page footgun.

9. **Centralized toErrorMessage** — one function in `@grove/web-shared` that handles `PlatformApiError` + generic `Error`. Removes 3+ scattered copies.

## Tasks

### Phase 1 — Component library quick wins (all independent)

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T09 | Add loading prop to DataTable | done | none |
| T10 | Add allowEmpty prop to Select | done | none |
| T11 | Expand E2E Radix test helpers | done | none |
| T12 | Centralize toErrorMessage in web-shared | done | none |
| T13 | Extract AdminPageShell component | done | none |

### Phase 2 — Observability decomposition

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Extract utility functions and types | done | none |
| T02 | Extract CaseQueue component | done | T01 |
| T03 | Extract CaseHeader and CaseSummaryStrip | done | T01 |
| T04 | Extract EvidenceRail and EvidenceEventRow | done | T01 |
| T05 | Extract CaseRecordPanel (right rail) | done | T01 |
| T06 | Extract RunCompare and ComparisonSection | done | T01 |
| T07 | Reassemble Workspace from extracted components | done | T02-T06 |
| T08 | Verify no visual regression with E2E tests | done | T07 |

### Phase 3 — Adoption sweep

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T14 | Migrate admin pages to DataTable loading prop | done | T09 |
| T15 | Migrate pages to Select allowEmpty | done | T10 |
| T16 | Migrate pages to centralized toErrorMessage | done | T12 |

## Acceptance Criteria

### Observability decomposition
- [x] `observability-workspace.tsx` is under 300 lines (composition shell only)
- [x] Each extracted component is in its own file under `apps/web/src/components/observability/`
- [x] All existing E2E tests in `apps/web/e2e/observability.spec.ts` pass without modification
- [x] All existing unit tests in `apps/web/tests/observability-api.test.ts` pass
- [x] No visual regression: same HTML structure, same data-testid attributes

### Component library hardening
- [x] `DataTable` accepts `loading` prop and renders Skeletons matching column count
- [x] `Select` accepts `allowEmpty` prop — no `__none__` sentinel in page code
- [x] E2E harness has helpers for Radix Tabs and Tooltip verification
- [x] `toErrorMessage` exists in one place (`@grove/web-shared`) with `PlatformApiError` support
- [x] `AdminPageShell` encapsulates PageFrame + title + description + ActionBanners
- [x] No admin/tenant page has its own `toErrorMessage` function
- [x] No admin/tenant page has manual `{loading ? <Skeleton> : <DataTable>}` conditional

### Shared
- [x] `pnpm -C apps/web lint` passes
- [x] `pnpm -C apps/web check-types` passes
- [x] `pnpm -C apps/web test` passes
- [x] All Playwright E2E tests pass

## Verification

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C packages/ui check-types
pnpm -C packages/ui playwright:ct
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test
NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
```

## Non-Goals

- No visual changes to observability (pure decomposition in Phase 2)
- No backend API changes
- No new observability features
