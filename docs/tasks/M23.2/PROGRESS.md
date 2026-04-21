# M23.2: Unified Call Observation Layer — Progress

## Context

The observability stack has fragmented across 6 milestones (M1, M1.1, M1.2, M1.3, M8.1, M23, M23.1) into three separate surfaces that all show the same underlying call data but use different components:

| Surface | Persona | Verb | Milestones |
|---------|---------|------|-----------|
| Observability workspace | Ops + Engineers | INVESTIGATE | M1, M1.1, M1.2, M1.3, M8.1 |
| Test workbench | Engineers | DEBUG | M23, M23.1 |
| Call-ops dashboard | Ops staff | INTERVENE | (various) |

**The problem:** Components built for one surface don't benefit the others. The test workbench has GraphTraceStrip, NodeInspector, LatencyStripGauges, ChatConversation, SystemEventsPanel — none usable in the observability workspace. The observability workspace has AudioWaveformTimeline, IntegrityGapMarker, CaseRecordPanel, RunCompare, OperatorActionBar — none usable in the test workbench.

**M23.2 unifies** by building shared observation components that work across all surfaces, then wiring them into both the test workbench AND the observability workspace.

## What's Working (M23 + M23.1, verified 2026-03-31)

| Feature | Verdict | Why |
|---------|---------|-----|
| Chat bubbles | Good | Clear user/assistant separation, readable conversation |
| Tool call visibility | Good | `search_clinic_booking_options 0ms ✗` with error detail visible |
| System events grouping | Good | Grouped by phase, colored badges (purple=node, orange=tool, blue=route), filter chips |
| Latency gauges | Useful | 6.6s AI and 10.3s Turn immediately flag a problem |
| Inline voice controls | Good | Compact single-row, Start/End toggle, mute icon |
| Graph trace (chain view) | Good | Visit indices on repeated nodes (#2, #3...), token rollup in header |
| Waterfall view | Partial | TTFT split works, but time axis has edge cases with pre-node silence |
| Node Inspector | Partial | Shows metrics (latency, TTFT, tokens, tools, route) but no I/O content |

## What's Broken / Misleading

| Issue | Symptom | Root Cause |
|-------|---------|------------|
| "20.4s" on first user turn | Impossible latency for "Laba diena." | `mergeConversationTurns` pairs by positional index. Transcript items are per-utterance, latency turns are per-round-trip. Misaligned. |
| Waterfall empty space | 55s timeline, bars at 45-55s | `started_at_ms` is absolute from call start. First node may start at T+16s after voice stack init. |
| Only 2-3 waterfall bars | 6+ conversation turns | Trace API may lag behind transcript streaming. Different polling intervals. |
| Tool errors hard to read | Long validation errors inline in chat bubbles | Need expandable tool detail panel, not inline text |
| Fragmented components | Test workbench and observability use different components for the same data | No shared observation component layer |

## Unified Component Architecture

```
apps/web/src/components/
├── observe/                          ← NEW shared layer
│   ├── conversation-view.tsx         ← variant="chat" | "evidence" (replaces both)
│   ├── graph-trace-strip.tsx         ← move from test-workbench/ (reusable)
│   ├── node-inspector.tsx            ← move from test-workbench/ (reusable)
│   ├── latency-strip-gauges.tsx      ← move from test-workbench/ (reusable)
│   ├── system-events-panel.tsx       ← move from test-workbench/ (reusable)
│   ├── flow-graph-dag.tsx            ← NEW: YAML flow graph with traversal
│   ├── tool-call-detail.tsx          ← NEW: expandable args + response
│   ├── llm-prompt-view.tsx           ← NEW: system/user messages + completion
│   ├── score-badges.tsx              ← NEW: inline evaluator results
│   └── hooks/
│       ├── use-call-latency.ts       ← already in lib/realtime/
│       ├── use-call-trace.ts         ← already in lib/realtime/
│       └── use-call-events.ts        ← NEW: tool I/O, LLM I/O
├── observability/                    ← existing M1 components (keep, wire shared)
│   ├── evidence-rail.tsx             ← integrate ConversationView variant="evidence"
│   ├── case-record-panel.tsx         ← add NodeInspector section
│   ├── ...
├── test-workbench/                   ← thin shells, delegate to observe/
│   ├── chat-conversation.tsx         ← becomes ConversationView variant="chat"
│   ├── inline-voice-controls.tsx     ← stays (workbench-specific)
│   └── ...
```

## Task Status

### Phase 1 — P0 Bug Fixes

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Fix conversation turn merge (positional → round-trip aware) | Done | 2026-03-31 |
| T02 | Fix waterfall time axis edge cases | Done | 2026-03-31 |

### Phase 2 — Shared Observation Components

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T03 | Move GraphTraceStrip, NodeInspector, LatencyStripGauges, SystemEventsPanel to `observe/` | Done | 2026-03-31 |
| T04 | Build FlowGraphDAG from YAML `flow_definition` with traversal overlay | Done | 2026-03-31 |
| T05 | Build ToolCallDetail expandable component (args + response JSON) | Done | 2026-03-31 |
| T06 | Add node instructions from YAML to NodeInspector | Done | 2026-03-31 |
| T07 | Add route decision detail to NodeInspector | Done | 2026-03-31 |
| T08 | Build ConversationView with variant="chat" and variant="evidence" | Done | 2026-03-31 |

### Phase 3 — Wire Shared Components into Both Surfaces

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T09 | Wire GraphTraceStrip + NodeInspector + FlowGraphDAG into observability case view | Done | 2026-03-31 |
| T10 | Wire LatencyStripGauges + SystemEventsPanel into observability case view | Done | 2026-03-31 |
| T11 | Update test workbench to import from `observe/` instead of `test-workbench/` | Done | 2026-03-31 |

### Phase 4 — Deep Debugging (Backend + Frontend)

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T12 | Backend: emit tool args/result in runtime events, add `CallTraceToolIO` to trace projection | Done | 2026-03-31 |
| T13 | Frontend: tool I/O expandable view in NodeInspector (depends on T12) | Done | 2026-03-31 |
| T14 | Frontend: nested tool I/O tree in NodeInspector with input/output JSON views | Done | 2026-03-31 |

### Phase 5 — Evaluation & Comparison

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T15 | Build inline score badges with voice-agent evaluators | Done | 2026-03-31 |
| T16 | Build run comparison view (latency diff, flow path diff) | Done | 2026-03-31 |
| T17 | Aggregate metrics dashboard per agent version | Done | 2026-03-31 |

## How Surfaces Compose Shared Components

### Test Workbench (engineer debugging)
```
Control bar (InlineVoiceControls + version selector + status)
FlowGraphDAG (full YAML graph with "you are here")
GraphTraceStrip (chain/waterfall toggle)
LatencyStripGauges (4 gauges + sparklines)
┌────────────────────────────┬──────────────────────────────┐
│ ConversationView           │ NodeInspector                │
│   variant="chat"           │   + node instructions        │
│   + ToolCallDetail expand  │   + route decision           │
│   + ScoreBadges            │   + LLM prompt/completion    │
│                            │ SystemEventsPanel            │
│                            │ Escalation                   │
│                            │ Call Context                 │
└────────────────────────────┴──────────────────────────────┘
RecentRunsStrip
```

### Observability Case View (operator investigating)
```
CaseHeader + CaseSummaryStrip
OperatorActionBar (live only)
FlowGraphDAG (same component, read-only, no "you are here" when historical)
GraphTraceStrip (same component)
LatencyStripGauges (same component)
┌────────────────────────────┬──────────────────────────────┐
│ EvidenceRail               │ CaseRecordPanel              │
│   ConversationView         │   + NodeInspector section     │
│     variant="evidence"     │   + SystemEventsPanel         │
│     + ToolCallDetail       │ Recommended actions           │
│   AudioWaveformTimeline    │ Integrity gaps                │
│   IntegrityGapMarker       │ Related records               │
└────────────────────────────┴──────────────────────────────┘
RunCompare (compare mode)
```

### Call-Ops Dashboard (ops intervening)
```
ActiveCallsTable
┌────────────────────────────┬──────────────────────────────┐
│ ConversationView           │ LatencyStripGauges (compact)  │
│   variant="chat"           │ Escalation                    │
│   (live transcript)        │ Quick actions                 │
└────────────────────────────┴──────────────────────────────┘
```

## What Each Milestone Contributed (Lineage)

| Milestone | Delivered | Shared Component Potential |
|-----------|-----------|--------------------------|
| M1 | Component decomposition: CaseQueue, EvidenceRail, CaseRecordPanel, RunCompare | EvidenceRail layout, case record fields |
| M1.1 | Queue/Case/Compare navigation, channel badges, live pinning | Queue navigation (obs-only) |
| M1.2 | Severity accents, gap markers, channel-aware metrics, audio waveform | AudioWaveformTimeline, IntegrityGapMarker |
| M1.3 | Live SSE streaming, operator actions, LiveKit listen-in, live-to-historical | SSE hooks, OperatorActionBar, LiveKit observer |
| M8.1 | Per-turn latency bars (ConversationTurnRow), pipeline breakdown, tool executions | ConversationTurnRow internals |
| M23 | Test workbench: browser voice, live observation, recent runs | Voice session management |
| M23.1 | Chat bubbles, graph trace, waterfall, TTFT split, token rollup, type badges, system events panel | GraphTraceStrip, NodeInspector, LatencyStripGauges, SystemEventsPanel |

## Architecture Notes

### ConversationView variants

`variant="chat"` (test workbench, call-ops):
- User messages left-aligned, agent right-aligned
- Transcript text is primary, timing bars subordinate
- Tool calls as compact pills below text
- Auto-scroll during live

`variant="evidence"` (observability workspace):
- All items in chronological evidence rail format
- Left-border severity accents
- Equal visual weight to transcript, tools, system events
- Virtualized for large event lists (react-window)
- Gap markers for missing evidence

Both variants share:
- Same `MergedConversationTurn` data shape
- Same timing bar component (STT/LLM/TTS/Speak segments)
- Same tool call rendering (pills + expandable detail)
- Same expand/collapse behavior

### Backend data gaps

The Grove runtime currently emits:
- `langgraph.node.started/completed` — node lifecycle with metrics
- `langgraph.route.selected` — route decisions
- `tool.started/completed/failed` — tool lifecycle (name + duration only)
- `llm.started/first_token` — timing only, no content

**Missing for T12-T14:**
- `llm.input` — messages array sent to model
- `llm.output` — raw model response (text + tool calls)
- `tool.input` — arguments passed to tool
- `tool.output` — tool response body

Emission point: `packages/grove/src/grove/runtime/graph_flow_node.py` and `packages/grove/src/grove/runtime/executor.py`. Must be configurable per-tenant (privacy: strip PII from persisted events).

### Flow graph DAG data source

The YAML `flow_definition` is in `AdminAgentDefinitionVersionDetail.source_yaml`. Parse on the frontend with a YAML library to extract `nodes`, `edges`, `conditional_edges`. No new API needed.

## References

- Parent milestones: M23 (Test Workbench), M23.1 (UX Hardening)
- Observability lineage: M1, M1.1, M1.2, M1.3, M8.1
- Competitive: LangSmith (nested trace tree, waterfall, I/O inspector), Langfuse (score badges, evaluator library, metrics dashboard)
- Agent config: `solutions/appointment_booking/configs/clinic_registration_agent.yaml`
