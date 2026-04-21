# M27: Console Craft & Progressive Disclosure — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Add missing design tokens to brand.css | done | 2026-03-26 |
| T02 | Build Drawer component in @grove/ui | done | 2026-03-26 |
| T03 | Build OverflowMenu component | done | 2026-03-26 |
| T04 | Build RelativeTime utility component | done | 2026-03-26 |
| T05 | Build StatusMessage unified notice component | done | 2026-03-26 |
| T06 | Align sidebar visual language (radius, tokens, shadows) | done | 2026-03-26 |
| T07 | Add DataTable row hover states | done | 2026-03-26 |
| T08 | Replace EscalationBadge with Badge from @grove/ui | done | 2026-03-26 |
| T09 | Active calls: button hierarchy + overflow menu | done | 2026-03-26 |
| T10 | Active calls: card-per-call layout | done | 2026-03-26 |
| T11 | Urgent banner: inline action buttons | done | 2026-03-26 |
| T12 | Call ops: collapse performance section | done | 2026-03-26 |
| T13 | Support drawer: progressive disclosure (3 tiers) | done | 2026-03-26 |
| T14 | Support drawer: migrate to Drawer component | done | 2026-03-26 |
| T15 | Call history: master-detail split layout | done | 2026-03-26 |
| T16 | Call history: technical drawer uses Drawer component | done | 2026-03-26 |
| T17 | Alerts: SWR auto-refresh, remove Refresh button | done | 2026-03-26 |
| T18 | Alerts: card-per-alert layout + relative timestamps | done | 2026-03-26 |
| T19 | Deployment dashboard: health hero card | done | 2026-03-26 |
| T20 | Sidebar: nav live count pills | done | 2026-03-26 |
| T21 | Unify error/notice patterns across all pages | done | 2026-03-26 |
| T22 | Escalation modal: remove position hack | done | 2026-03-26 |
| T23 | Playwright visual regression suite | done | 2026-03-26 |
| T24 | Browser screenshot verification + manual QA checklist | done | 2026-03-26 |

## Summary

**24/24 tasks done.** All phases complete.

## Execution Phases

### Phase 1 — Foundations + Operator Safety (T01-T08, T11, T22)
Parallel: T01, T02, T03, T04, T05, T07, T11, T22 (all independent)
Then: T06 (needs T01), T08 (needs T01)

### Phase 2 — Core Redesigns (T09-T10, T12-T16, T17)
After Phase 1 foundations:
- T09 (needs T03, T08) → T10 (needs T09)
- T12 (independent)
- T13 (needs T02) → T14 (needs T02, T13)
- T15 (needs T02) → T16 (needs T02, T15)
- T17 (independent)

### Phase 3 — Polish + Unification (T18-T21)
- T18 (needs T04, T17)
- T19 (independent)
- T20 (needs T06)
- T21 (needs T05)

### Phase 4 — Verification (T23-T24)
- T23 (needs all T09-T22)
- T24 (needs T23)

## Dependency Graph

```
T01 ──► T06 ──► T20
   └──► T08 ──► T09 ──► T10
T02 ──► T13 ──► T14
   ├──► T15 ──► T16
T03 ──► T09
T04 ──► T18
T05 ──► T21
T07 (independent)
T11 (independent)
T12 (independent)
T17 ──► T18
T19 (independent)
T22 (independent)
T09-T22 ──► T23 ──► T24
```

## Notes

- UX decision carried from M21: No manual refresh buttons on any page.
- All wireframes documented in the critique session conversation (2026-03-26).
- T07 was already implemented when this milestone started (hover:bg on DataTable body <tr>).
