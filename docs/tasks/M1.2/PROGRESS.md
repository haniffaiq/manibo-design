# M1.2: Evidence Rail Redesign — Progress

## Task Status

### Phase 0 — Post-M1.1 cleanup

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T11 | Replace CaseQueue/CaseHeader prop drilling with context/compound pattern | done | 2026-03-25 |
| T12 | Split utils.ts into formatters + domain-logic + api-dispatch | done | 2026-03-25 |
| T13 | Move navigation handlers from use-queue-filters to mode-aware hook | done | 2026-03-25 |
| T14 | Add timeline virtualization (react-window) for large event lists | done | 2026-03-25 |
| T15 | Add emoji channel badges (📞💬📧⚙🔴) with accent colors | done | 2026-03-25 |
| T16 | Style live/historical separator with LIVE label per wireframe | Superseded | M1.3 added streaming indicator + auto-scroll; no inline separator needed |

### Phase 1 — Evidence rail redesign

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | EvidenceEventRow with left-border severity | done | 2026-03-25 |
| T02 | IntegrityGapMarker component for inline gaps | done | 2026-03-25 |
| T03 | Insert gap markers from availability data | done | 2026-03-25 |
| T04 | Channel-aware CaseSummaryStrip (metrics vary by channel) | done | 2026-03-25 |
| T05 | Channel-aware right-rail sections (lead capture, delivery, journey) | done | 2026-03-25 |
| T06 | Tighten right-rail layout (remove cards-within-cards) | done | 2026-03-25 |
| T07 | Channel badge in case header | done | 2026-03-24 |
| T08 | Update E2E tests for new selectors and channel badges | done | 2026-03-25 |
| T09 | Adopt Tier 1 shadcn components (Resizable, ToggleGroup, Accordion, Sheet) | done | 2026-03-25 |
| T10 | Audio waveform timeline with synchronized playback (LiveKit Console pattern) | done | 2026-03-25 |

## Audit Summary (2026-03-25)

Phase 0 + Phase 1 complete. 15 of 16 tasks done.

- **15 done:** T01-T15
- **1 superseded:** T16 (M1.3 live streaming made this irrelevant)

## Notes

Depends on M1.1 completion (navigation modes) — DONE.

Phase 0 addresses pain points discovered during M1.1:
- T11: CaseQueue takes 30+ props, workspace shell has a wall of ws.* assignments
- T12: utils.ts at 605 lines mixes formatters, domain logic, and API dispatch
- T13: openRun/openListView are navigation concerns, not filter concerns
- T14: filteredTimeline.map() renders every event — no virtualization for large lists
- T15: Channel badges are text-only, wireframes show emoji + channel-specific styling
- T16: Superseded by M1.3 live streaming approach

Component foundation: copy shadcn source into packages/ui/, adapt to design tokens. Do NOT install shadcn CLI.
Audio waveform: LiveKit Telephony Console pattern — scrub audio + transcript/events pinned to same timeline.
