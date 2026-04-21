# T05: Add Waterfall Timeline View to GraphTraceStrip

> **Milestone**: M23.1 — Test Workbench UX Hardening
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Both LangSmith and Langfuse use horizontal Gantt-chart waterfall views for trace/span visualization. Our `GraphTraceStrip` currently shows a dot-chain (node dots connected by lines). This makes it impossible to visually compare node durations — a 200ms node looks the same as a 3.3s node.

**Target:** Add a toggle between "chain" view (current) and "waterfall" view. In waterfall mode, each node is a horizontal bar proportional to its `latency_ms`, aligned on a shared time axis.

## Subtasks

- [x] **View toggle**: Add a "Chain | Waterfall" toggle (two small buttons or segmented control) in the graph trace header
- [x] **Waterfall layout**: In waterfall mode, render nodes as horizontal bars:
  - Each row: node name label (left) + horizontal bar (right, proportional to `latency_ms`)
  - Bars start at the node's `started_at_ms` relative to the first node's start
  - Bars end at `completed_at_ms`
  - Active (incomplete) nodes show a pulsing bar growing in real-time
  - Color: use the same latency color scale (green < 200ms, amber < 500ms, red > 500ms)
- [x] **Time axis**: Show a subtle time axis at the top or bottom with tick marks (0s, 1s, 2s, ...)
- [x] **Click interaction**: Clicking a bar in waterfall mode selects the node (same as clicking a dot in chain mode) and updates the NodeInspector
- [x] **Route labels**: Show route labels on the gap between consecutive bars (or as a small annotation)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/test-workbench/graph-trace-strip.tsx` | Modify | Add waterfall view mode with toggle |

## Implementation Notes

- Use CSS grid or flexbox for waterfall bars — no need for SVG or canvas.
- `started_at_ms` and `completed_at_ms` are relative millisecond timestamps from the backend. Normalize by subtracting the first node's `started_at_ms` to get relative offsets.
- The chain view stays as default — waterfall is opt-in via toggle.

## Acceptance Criteria

- [x] Toggle between "Chain" and "Waterfall" views
- [x] Waterfall bars proportional to node duration
- [x] Bottleneck nodes visually obvious (long red/amber bars)
- [x] Active nodes show growing bar in real-time
- [x] Click-to-select works in both views
- [x] Time axis shows elapsed seconds

## Design Reference

LangSmith: "Waterfall Graphs to Spot Latency Bottlenecks" — horizontal bars for each span, parallel vs sequential clearly visible.

Langfuse: "Timeline View" — horizontal bar per observation, indented for nesting, with TTFT split.
