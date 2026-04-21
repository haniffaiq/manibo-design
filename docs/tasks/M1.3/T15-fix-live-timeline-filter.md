# T15: Fix live items bypassing timeline filters

> **Milestone**: M1.3-obs-live-streaming
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T04

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:** See `docs/tasks/_templates/task-template.md` for full rules.

---

## Description

`mergedTimeline` in `evidence-rail.tsx` is `[...filteredTimeline, ...liveItems]`. The historical `filteredTimeline` is already filtered by `timelineMatchesFilter()`, but `liveItems` are appended raw. If the user selects "Tools only", they still see live transcript events.

## Subtasks

- [x] **Filter liveItems through timelineMatchesFilter**: apply the current `timelineFilter` to `liveItems` before merging
- [x] **Pass timelineFilter to the merge logic**: either pass it as a prop or filter inside the `useMemo`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/evidence-rail.tsx` | Modify | Filter `liveItems` through `timelineMatchesFilter` before merging |

## Implementation Notes

The fix is one line inside the `useMemo`:
```ts
const filteredLive = liveItems.filter((item) => timelineMatchesFilter(item, timelineFilter));
return [...filteredTimeline, ...filteredLive];
```
Requires adding `timelineFilter` as a prop to `EvidenceRail` (it's currently only in `CaseHeader`), or moving the filter application to the workspace level.

The simpler option: the workspace already has `ws.timelineFilter` — pass it through as a prop.

## Acceptance Criteria

- [x] Selecting a timeline filter (e.g. "Tools") hides non-matching live events
- [x] "All" filter shows all live events
- [x] "Warnings & errors" filter shows only live events with severity != info

## References

- Milestone: [completed/M1.3-obs-live-streaming.md](../../milestones/M1.3-obs-live-streaming.md)
- Filter logic: `apps/web/src/components/observability/utils.ts:timelineMatchesFilter`
