# M8.1: Voice Turn Latency Observability — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Align frontend LiveCallTurnLatency types with backend | done | 2026-03-30 |
| T02 | Build ConversationTurnRow component with inline latency bars | done | 2026-03-30 |
| T03 | Integrate unified conversation turns into EvidenceRail | done | 2026-03-30 |
| T04 | Add live turn latency polling hook and wire live updates | done | 2026-03-30 |
| T05 | E2E tests and visual verification | done | 2026-03-30 |

## Notes

Backend data pipeline (M8) already collects 29 fields per turn and API returns them.
Frontend `LiveCallTurnLatency` has 11 fields with 2 name mismatches — T01 fixes this.
M1 decomposed observability into clean components — T03 integrates into that structure.
Unified turn rows merge transcript text + latency bars — no separate waterfall section.
Click-to-expand shows pipeline breakdown inline — no sidebar detail card.
