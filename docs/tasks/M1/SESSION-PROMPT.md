# M1 Session Prompt: Observability UI Redesign + Component Library Hardening

> Historical prompt only. M1 is complete and archived; do not use this as a live implementation brief.

Historical implementation prompt for M1.

## Context
- M20 (Deployment Console UX), M21 (Operator Console UX), M22 (Admin Shared Patterns) are done.
- The observability workspace (2,375 lines) is the last monolith in the frontend.
- 5 component library gaps were discovered during M20-M22 implementation.
- M1 combines the obs decomposition with the quick-win library fixes.

## Key files to read first
- docs/milestones/M1-obs-ui-redesign.md (milestone doc with all 16 tasks across 3 phases)
- docs/tasks/M1/PROGRESS.md (task status tracker)
- apps/web/src/components/observability-workspace.tsx (the 2,375-line monolith)
- packages/ui/src/components/data-table.tsx (DataTable — needs loading prop)
- packages/ui/src/components/select.tsx (Select — needs allowEmpty prop)
- apps/web/e2e/harness.ts (E2E helpers — needs Radix expansion)
- apps/web/src/hooks/use-action-state.ts (has toErrorMessage — needs centralization)

## Execution order

Phase 1 (all independent, can parallel):
  T09 (DataTable loading) + T10 (Select allowEmpty) + T11 (E2E helpers) + T12 (toErrorMessage) + T13 (AdminPageShell)

Phase 2 (sequential decomposition):
  T01 (types/utils) → T02-T06 (extract components) → T07 (reassemble) → T08 (E2E verify)

Phase 3 (adoption sweep, depends on Phase 1):
  T14 (DataTable loading adoption) + T15 (Select allowEmpty adoption) + T16 (toErrorMessage adoption)

## Critical implementation notes

1. Phase 2 is pure decomposition — NO visual changes. Same HTML, same test IDs, same behavior.
2. The observability workspace has 3 pre-existing E2E failures on main. Don't try to fix them — just ensure no new failures.
3. DataTable loading prop should render Skeletons matching the column count and widths.
4. Select allowEmpty should use `__none__` sentinel internally, never exposed to consumers.
5. toErrorMessage must handle PlatformApiError (extends Error with structured message).
6. AdminPageShell composes PageFrame + title/description + ActionBanners from useActionState.
7. OTLP evidence is required in PR body even for frontend-only changes (see CLAUDE.md).
8. Resolve PR review threads after addressing comments (gh api graphql resolveReviewThread).
