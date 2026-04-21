# M1.3 Session Prompt: Live Streaming Cases

> Historical prompt only. M1.3 is complete and archived; do not use this as a live implementation brief.

Historical implementation prompt for M1.3. Original branch: `feat/M1.3-obs-live-streaming` (worktree at `../manibo-m1.3`).

## Context
- M1.1 (navigation modes) and M1.2 (evidence rail redesign) are merged to main.
- The observability workspace has ~15 focused files under `apps/web/src/components/observability/`.
- The workspace renders in 3 modes: queue (full-width), case (full-width), compare (full-width).
- M1.3 makes live cases stream evidence in real-time with channel-appropriate operator actions.

## Key files to read first
- docs/milestones/M1.3-obs-live-streaming.md (milestone doc with wireframes, backend table, 13 tasks)
- docs/tasks/M1.3/PROGRESS.md (task status tracker)
- apps/web/src/hooks/use-sse-stream.ts (138 lines — SSE subscription hook with reconnect/backoff)
- apps/web/src/components/call-ops/support-drawer.tsx (dual SSE stream pattern — transcript + ops)
- apps/web/src/components/observability/evidence-rail.tsx (virtualized timeline with react-window)
- apps/web/src/components/observability/case-header.tsx (metrics strip, timeline filters, compare)
- apps/web/src/components/observability/case-record-panel.tsx (right rail with RailSection)
- apps/web/src/components/observability/case-evidence.tsx (summary insights, evidence map, recording player)
- apps/web/src/components/observability/workspace-context.ts (WorkspaceContext + useWorkspace hook)
- apps/web/src/components/observability/use-workspace-state.ts (composition hook — state for all modes)
- apps/web/src/components/observability/formatters.ts (display helpers — labels, variants, severity)
- apps/web/src/components/observability/types.ts (type aliases + constants)
- apps/api/src/platform_api/routes/calls.py (SSE endpoints at lines 1632, 1983; LiveKit tokens at 1546, 1589)

## Execution order

Phase 0 (all independent, can parallel):
  T01 (action bar) + T02 (SSE hook) + T03 (SSE-to-timeline mapper) + T09 (duration counter)

Phase 1 (streaming core — depends on Phase 0):
  T04 (streaming rail with auto-scroll, depends T02+T03)
  T05 (live phase indicator, depends T02)

Phase 2 (LiveKit — depends on T01):
  T06 (room connection) -> T07 (audio playback) -> T10 (visualizer bar)
  T11 (session provider, depends T06)

Phase 3 (polish — depends on Phase 1):
  T08 (live-to-historical transition, depends T04)
  T12 (metrics placeholder state, depends T04)
  T13 (E2E tests, depends T01-T09)

## Critical implementation notes

1. T01 reuses existing call-ops action handlers. `support-drawer.tsx` already implements Take Over and Transfer via `platformApiRequest()`. Extract the action dispatch logic into reusable functions.

2. T02 dual-stream pattern: two `useSseStream` calls running concurrently — one for `/calls/{id}/transcript/stream`, one for `/calls/{id}/ops/stream`. Both track `after_seq` in a ref. Merge results into a single chronologically-ordered feed. The `support-drawer.tsx:93-118` pattern is the template.

3. T03 mapper is critical. SSE transcript events `{seq, speaker, timestamp, text}` and ops events `{seq, event_type, occurred_at_ms, summary, payload}` must transform into `ObservabilityTimelineItem` shape `{id, kind, label, detail, severity, occurred_at, ...}`. Without this, SSE events can't render in the evidence rail.

4. T04 auto-scroll: track whether user is at the bottom of the list. If yes, `scrollToItem(items.length - 1)` on every new event. If user scrolls up, pause. Resume when they scroll back to bottom. react-window `List` ref has `scrollToItem()`.

5. T06 LiveKit connection: `new Room() -> room.connect(url, token) -> room.on('trackSubscribed', ...)`. Subscribe-only token prevents operator broadcasting. Disconnect on unmount or case transition.

6. T08 transition detection: SSE sends `event: end` when case ends. Alternatively poll `detail.data?.summary.status` — when Running -> Completed/Failed, trigger transition. Remove OperatorActionBar, stop SSE, disconnect LiveKit, refresh detail for final metrics.

7. T09 duration counter: `isRunningStatus()` and LIVE badge already exist. Add elapsed time via `setInterval(1000)` computing `Date.now() - started_at`. Display as `formatDurationMs()`.

8. T12 metrics placeholder: when `isRunningStatus(status)` is true, metrics strip shows labels with "--" values. When case transitions, refresh `detail` to get final values.

## Backend SSE event formats

Transcript stream (`/calls/{id}/transcript/stream`):
```
event: segment
data: {"seq": 1, "speaker": "agent", "timestamp": "2026-03-25T10:42:14Z", "text": "Hello..."}
```

Ops stream (`/calls/{id}/ops/stream`):
```
event: runtime_event
data: {"seq": 1, "event_type": "call.escalated", "occurred_at_ms": 120, "summary": "Agent requested human help", "created_at": "2026-03-25T10:42:16Z", "payload": {}}
```

End signal (both streams):
```
event: end
data: {}
```

Keepalive: `: keepalive\n\n`

## LiveKit token response

```json
{"room_name": "rm_abc123", "token": "eyJ...", "expires_at": "2026-03-25T11:00:00Z"}
```

Subscribe-only (`/livekit-token`): `can_subscribe=true`, `can_publish=false`
Operator (`/livekit-operator-token`): `can_publish=true`
