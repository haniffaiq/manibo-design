# M23.1: Test Workbench UX Hardening — Progress

## Context

M23 delivered the agent test workbench with live voice testing, latency metrics, conversation turns, and system events. M23.1 addresses 4 UX bugs and 4 feature gaps discovered during real usage and LangSmith/Langfuse competitive research.

**Bugs discovered in live usage (2026-03-31):**
1. Graph trace shows all nodes as "specialty_selection" — repeated node names without visit differentiation
2. User turns display LLM/TTS/Speak latency bars — only assistant turns should show the full pipeline
3. Conversation panel is an engineer data table, not a chat — should look like a chatbot window with timing annotations beneath
4. System events (92 items) flat list with identical "Logs" badges — completely unusable at scale

**Feature gaps identified from LangSmith/Langfuse competitive research:**
1. No waterfall timeline for graph nodes (both competitors have horizontal Gantt-chart span views)
2. No TTFT split on node bars (Langfuse splits generation bars into TTFT + remaining)
3. No subtree token/cost rollup (both competitors show aggregated tokens at trace level)
4. No observation type badges (Langfuse uses distinct colored badges per span type)

## Task Status

### Phase 1 — Bug Fixes

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Differentiate repeated graph nodes by visit index | Done | |
| T02 | Suppress LLM/TTS/Speak bars on user-only turns | Done | |
| T03 | Redesign conversation panel as chat-style layout | Done | |
| T04 | Redesign system events with type badges, grouping, and filtering | Done | |

### Phase 2 — Competitive Feature Parity

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T05 | Add waterfall timeline view to GraphTraceStrip | Done | |
| T06 | Add TTFT split bars on graph node waterfall | Done | |
| T07 | Add subtree token/cost rollup to graph trace header | Done | |
| T08 | Add observation type badges to system events | Done | |

### Phase 3 — Verification

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T09 | Update E2E tests and visual verification | Done | |

## Notes

Parent milestone: M23 (Agent Test Workbench)
Branch: `fix/ux-dx-improvements` (existing) or `feat/M23.1-test-workbench-ux-hardening`
