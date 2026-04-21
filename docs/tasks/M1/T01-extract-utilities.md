# T01: Extract Utility Functions and Types

> **Milestone**: M1-obs-ui-redesign
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Description

Extract all pure utility functions, type definitions, and constants from the monolithic `observability-workspace.tsx` into dedicated files. This is the foundation that all other extraction tasks depend on.

## Subtasks

- [x] **Create directory**: `apps/web/src/components/observability/`
- [x] **Extract types**: `TimelineFilter`, `FilterPreset`, `CoverageState`, `SearchParamsLike` and all local type aliases
- [x] **Extract constants**: `RUN_KIND_OPTIONS`, `SUBJECT_COVERAGE`, `STATUS_OPTIONS`, `DURATION_OPTIONS`, `FILTER_PRESETS`, `TIMELINE_FILTERS`, `EMPTY_RUNS`, `EMPTY_TIMELINE`, `EMPTY_FACETS`, `TIMELINE_PAGE_SIZE`
- [x] **Extract pure functions**: `toErrorMessage`, `observabilityErrorMessage`, `formatDateTime`, `formatDurationMs`, `timelineGroupLabel`, `statusVariant`, `coverageVariant`, `coverageLabel`, `severityVariant`, `severityBadgeVariant`, `timelineMatchesFilter`, `runSummaryKindLabel`, `facetLabel`, `parseMinDuration`, `parseDateFilter`, `startDateToIso`, `endDateToIso`, `isPresetActive`, `availabilityMessages`, `countRunsNeedingAttention`, `countRunsWithAudio`, `runFilterKindLabel`, `candidateRunLabel`, `evidenceCoverage`
- [x] **Extract data loaders**: `loadRunDetail`, `loadTimelinePage`
- [x] **Verify imports**: all extracted items are re-importable from new locations

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/types.ts` | Create | Shared types and type aliases |
| `apps/web/src/components/observability/constants.ts` | Create | Filter options, coverage data, timeline config |
| `apps/web/src/components/observability/utils.ts` | Create | Pure formatting and classification functions |
| `apps/web/src/components/observability/loaders.ts` | Create | Data loading functions (loadRunDetail, loadTimelinePage) |
| `apps/web/src/components/observability-workspace.tsx` | Modify | Replace inline definitions with imports |

## Acceptance Criteria

- [x] All extracted functions pass existing tests when imported from new locations
- [x] `observability-workspace.tsx` imports from the new files instead of defining inline
- [x] No functional change — same runtime behavior
- [x] `pnpm -C apps/web lint` passes
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M1-obs-ui-redesign.md](../../milestones/M1-obs-ui-redesign.md)
- Source: `apps/web/src/components/observability-workspace.tsx` lines 1-585
