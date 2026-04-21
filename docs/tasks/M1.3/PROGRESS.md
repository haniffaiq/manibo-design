# M1.3: Live Streaming Cases — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | OperatorActionBar with channel-specific actions (reuse support-drawer handlers) | Done | 2026-03-25 |
| T02 | Dual SSE subscription hook for transcript + ops events | Done | 2026-03-25 |
| T03 | SSE event to ObservabilityTimelineItem mapper | Done | 2026-03-25 |
| T04 | Streaming evidence rail (append events, auto-scroll with user-override) | Done | 2026-03-25 |
| T05 | Live phase indicator in right rail | Done | 2026-03-25 |
| T06 | LiveKit room connection as observer | Done | 2026-03-25 |
| T07 | LiveKit audio playback inline in evidence rail | Done | 2026-03-25 |
| T08 | Live-to-historical transition | Done | 2026-03-25 |
| T09 | Live elapsed duration counter for running cases in queue | Done | 2026-03-25 |
| T10 | LiveKit AgentAudioVisualizerBar for operator listen-in | Done | 2026-03-25 |
| T11 | LiveKit AgentSessionProvider for room context | Done | 2026-03-25 |
| T12 | Live metrics placeholder state in metrics strip | Done | 2026-03-25 |
| T13 | Update E2E tests for live case elements | Done | 2026-03-25 |
| T14 | Fix evidence rail auto-scroll (container not scrollable, user-override is dead code) | Done | 2026-03-25 |
| T15 | Fix live items bypassing timeline filters | Done | 2026-03-25 |
| T16 | Extract useLiveCaseSession composition hook from workspace | Done | 2026-03-25 |
| T17 | Opt-in "Join call" with mute toggle — wire OperatorActionBar to LiveKit observer | Done | 2026-03-25 |
| T18 | Remove unused AgentSessionProvider or wire it into the live audio section | Done | 2026-03-25 |
| T19 | Harden event kind/severity mapping (prefix match instead of includes) | Done | 2026-03-25 |

## Notes

Depends on M1.2 completion (evidence rail redesign) — DONE.

Backend infrastructure verified:
- Transcript SSE: `GET /calls/{id}/transcript/stream` (event: segment, payload: {seq, speaker, timestamp, text})
- Ops SSE: `GET /calls/{id}/ops/stream` (event: runtime_event, payload: {seq, event_type, occurred_at_ms, summary, payload})
- LiveKit subscribe token: `POST /calls/{id}/livekit-token` (15min TTL, can_subscribe=true)
- LiveKit operator token: `POST /calls/{id}/livekit-operator-token` (can_publish=true)

Frontend infrastructure:
- `useSseStream` hook at `apps/web/src/hooks/use-sse-stream.ts` (auto-reconnect, backoff, event parsing)
- Dual-stream pattern proven in `support-drawer.tsx:93-118`
- `livekit-client@2.17.2` installed, React 19 + Tailwind 4 in place

Execution: Phase 0 (T01+T02+T03+T09 parallel) -> Phase 1 (T04+T05) -> Phase 2 (T06->T07->T10, T11) -> Phase 3 (T08+T12+T13).
