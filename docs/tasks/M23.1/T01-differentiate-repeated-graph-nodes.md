# T01: Differentiate Repeated Graph Nodes by Visit Index

> **Milestone**: M23.1 — Test Workbench UX Hardening
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Description

When the agent loops through the same flow node multiple times (e.g., `specialty_selection` visited 8 times), the graph trace strip shows 8 identical "specialty_selection" labels. This makes the trace unreadable — you can't tell which visit is which.

**Root cause:** `CallTraceNodeSummary.node_name` carries only the YAML node name. When the same node is re-entered (common in flow graphs with route loops), every instance shows the same label.

**Fix:** Show visit index and route context on repeated nodes.

## Subtasks

- [x] **Detect repeated node names**: In `GraphTraceStrip`, group nodes by `node_name` and compute visit index (1st, 2nd, 3rd...)
- [x] **Show visit index on repeated nodes**: Display "specialty_selection #2" or "specialty_selection (2nd)" when a node name appears more than once
- [x] **Show incoming route label**: If the previous node's `route` or `next_node_name` is available, display the route that led to this visit (e.g., "via: identified")
- [x] **Compact display**: For nodes visited >3 times, consider collapsing middle visits with an expand affordance

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/test-workbench/graph-trace-strip.tsx` | Modify | Add visit counting, route labeling, and collapse logic |

## Acceptance Criteria

- [x] Repeated nodes show visit index (e.g., `greeting`, `specialty_selection #2`, `specialty_selection #3`)
- [x] First visit of any node shows no index suffix
- [x] Route label from previous node shown on the connector between nodes
- [x] Graph trace is scannable at 8+ nodes without horizontal overflow dominating
