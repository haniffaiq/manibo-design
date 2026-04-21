# T07: Add Subtree Token/Cost Rollup to Graph Trace Header

> **Milestone**: M23.1 — Test Workbench UX Hardening
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Description

Both LangSmith and Langfuse show aggregated token counts at the trace level with subtree rollup. Our `GraphTraceStrip` header only shows "8 nodes · 3 routes" — no token or cost information. Engineers want to see "this call used 4,200 tokens across 6 nodes" at a glance without clicking into each node.

**Data available:** `CallTraceNodeSummary` already carries `prompt_tokens` and `completion_tokens` per node. The aggregation is a simple frontend sum.

## Subtasks

- [x] **Aggregate tokens**: Sum `prompt_tokens` and `completion_tokens` across all trace nodes
- [x] **Display in header**: Show aggregated totals in the graph trace header strip:
  - Format: "8 nodes · 3 routes · 4.2K tokens" or "8 nodes · 2,140 in / 860 out"
  - Keep compact — one line, not a separate card
- [x] **Per-node token indicators**: In both chain and waterfall views, show a small token count beneath each node that has token data (e.g., "1.2K tok")
- [x] **Graceful fallback**: If no nodes have token data, don't show the token aggregate

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/test-workbench/graph-trace-strip.tsx` | Modify | Add token aggregation to header and per-node indicators |

## Acceptance Criteria

- [x] Graph trace header shows aggregated token count when data is available
- [x] Token count format is compact and human-readable (e.g., "4.2K tokens")
- [x] Per-node token indicators visible without clicking into NodeInspector
- [x] No token display when all nodes have null token data
