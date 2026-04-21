# T04: Extract EvidenceRail and EvidenceEventRow

> **Milestone**: M1-obs-ui-redesign
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Extract the evidence rail (timeline event list with pagination) and individual event rows into dedicated components. The evidence rail is the signature element of the observability UI.

## Subtasks

- [x] **Extract EvidenceEventRow**: single timeline item (badge, timestamp, label, detail, duration, selection highlight)
- [x] **Extract EvidenceRail**: container with filtered items, load-more pagination, rail header with counts
- [x] **Extract AudioPlayer**: recording URL management, seek-to-timeline-item, audio element
- [x] **Preserve data-testid**: `observability-timeline-*`, `observability-recording-state`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/evidence-event-row.tsx` | Create | Single timeline event |
| `apps/web/src/components/observability/evidence-rail.tsx` | Create | Timeline container with filtering and pagination |
| `apps/web/src/components/observability/audio-player.tsx` | Create | Recording playback with timeline sync |
| `apps/web/src/components/observability-workspace.tsx` | Modify | Replace inline timeline JSX |

## Acceptance Criteria

- [x] Timeline items render identically
- [x] Click-to-seek works (clicking item seeks audio)
- [x] Load-more pagination works
- [x] Timeline filter chips filter correctly
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M1-obs-ui-redesign.md](../../milestones/M1-obs-ui-redesign.md)
- Source: `apps/web/src/components/observability-workspace.tsx` lines 1778-1836
