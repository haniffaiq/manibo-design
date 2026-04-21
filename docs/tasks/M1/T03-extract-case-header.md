# T03: Extract CaseHeader and CaseSummaryStrip

> **Milestone**: M1-obs-ui-redesign
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T01

---

## Description

Extract the case detail header (title, status, metrics grid, availability alerts, timeline filter chips, compare selector) into `CaseHeader` and `CaseSummaryStrip` components.

## Subtasks

- [x] **Extract CaseHeader**: title, subtitle, status badge, back button, timeline filter chips, compare selector
- [x] **Extract CaseSummaryStrip**: metrics grid (the 3-column layout of key metrics)
- [x] **Preserve data-testid**: `observability-selected-title`, `observability-selected-status`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/case-header.tsx` | Create | Case title, status, filters, compare |
| `apps/web/src/components/observability/case-summary-strip.tsx` | Create | Metrics grid |
| `apps/web/src/components/observability-workspace.tsx` | Modify | Replace inline header JSX |

## Acceptance Criteria

- [x] Header renders identically to current
- [x] Metrics grid renders identically
- [x] Timeline filter chips and compare selector work
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M1-obs-ui-redesign.md](../../milestones/M1-obs-ui-redesign.md)
- Source: `apps/web/src/components/observability-workspace.tsx` lines 1550-1660
