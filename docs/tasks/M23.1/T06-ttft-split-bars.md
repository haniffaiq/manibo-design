# T06: Add TTFT Split Bars on Graph Node Waterfall

> **Milestone**: M23.1 — Test Workbench UX Hardening
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T05

---

## Description

Langfuse splits generation span bars into "time to first token" (lighter color) and "remaining streaming duration" (solid color). This is directly relevant to our voice pipeline — `CallTraceNodeSummary` already carries both `ttft_ms` and `latency_ms`.

**Target:** In the waterfall view (T05), split each node bar into two segments:
1. **TTFT segment** (lighter/hatched) — from node start to first LLM token
2. **Remaining segment** (solid) — from first token to node completion

This reveals whether latency is dominated by LLM inference (long TTFT) or by tool calls / TTS / other processing (long remaining).

## Subtasks

- [x] **Split bar rendering**: In waterfall mode, if `ttft_ms` is available on a node, render the bar in two segments:
  - First segment (0 → ttft_ms): lighter version of the latency color (e.g., `bg-amber-200` instead of `bg-amber-500`)
  - Second segment (ttft_ms → latency_ms): solid latency color
- [x] **Tooltip**: Hover on first segment shows "TTFT: 180ms", hover on second shows "Post-TTFT: 130ms"
- [x] **Legend update**: Add a legend entry explaining the split: "Lighter = time to first token, Solid = remaining"
- [x] **Graceful fallback**: If `ttft_ms` is null, show the bar as solid (current behavior)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/test-workbench/graph-trace-strip.tsx` | Modify | Add TTFT split rendering in waterfall bars |

## Acceptance Criteria

- [x] Nodes with `ttft_ms` show two-tone split bars in waterfall view
- [x] Nodes without `ttft_ms` show solid bars (no regression)
- [x] Hover tooltip shows TTFT and remaining durations separately
- [x] Chain view is unaffected
