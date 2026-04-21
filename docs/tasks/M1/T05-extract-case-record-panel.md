# T05: Extract CaseRecordPanel (Right Rail)

> **Milestone**: M1-obs-ui-redesign
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Extract the sticky right rail containing case record, recommended actions, integrity gaps, related records, context fields, selected event inspector, trace context, transcript summary, and payload viewer.

## Subtasks

- [x] **Extract CaseRecordPanel**: container for all right-rail sections
- [x] **Extract EventInspector**: selected event detail (when, what, actor, duration, correlation ID, payload)
- [x] **Preserve data-testid**: `observability-case-record`, `observability-recommended-actions`, `observability-integrity-gaps`, `observability-related-records`, `observability-detail-context`, `observability-selected-event-label`, `observability-selected-event-correlation`, `observability-copy-correlation`, `observability-trace-context`, `observability-recommended-action-*`, `observability-related-entity-*`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/case-record-panel.tsx` | Create | Right-rail container |
| `apps/web/src/components/observability/event-inspector.tsx` | Create | Selected event detail |
| `apps/web/src/components/observability-workspace.tsx` | Modify | Replace inline right-rail JSX |

## Acceptance Criteria

- [x] Right rail renders identically with sticky positioning
- [x] Copy correlation ID works
- [x] Related entity links work
- [x] Recommended action CTAs work
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M1-obs-ui-redesign.md](../../milestones/M1-obs-ui-redesign.md)
- Source: `apps/web/src/components/observability-workspace.tsx` lines 1838-2083
