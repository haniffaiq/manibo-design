# T04: Redesign System Events with Type Badges, Grouping, and Filtering

> **Milestone**: M23.1 — Test Workbench UX Hardening
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Description

System events are currently a flat chronological list of 92+ items, all with the same gray "Logs" badge. This is completely unusable at scale — engineers can't find what they're looking for.

**Current state:** `LiveTimelineRow` renders every non-transcript event identically. The `kind` field (log, node, route, tool, workflow_step, recording, metric) exists but is only shown as a text label inside a generic badge.

**Problems:**
1. No visual differentiation between event types — `voice.stack.configured` looks identical to `langgraph.node.completed`
2. No grouping — 92 items in a flat list
3. No filtering — can't show only "node" events or only "tool" events
4. Mostly noise — `caller.started_speaking` / `caller.stopped_speaking` pairs are low-value for most debugging

## Subtasks

- [x] **Type-colored badges**: Each `ObservabilityTimelineKind` gets a distinct color:
  - `node` = purple (matches AI/LLM color)
  - `route` = blue
  - `tool` = orange
  - `log` = gray
  - `workflow_step` = green
  - `recording` = teal
  - `metric` = amber
- [x] **Group by turn or time window**: Group events into collapsible sections by the graph node they occurred during (match `langgraph.node.started` / `langgraph.node.completed` boundaries) or by turn index
- [x] **Filter chips**: Add clickable filter chips for each event type. Active by default, click to toggle off. Show count per type.
- [x] **Compact rows**: Reduce row height — current rows have too much padding. Event type + summary on one line, detail on the next. Timestamp as a relative offset ("T+12s") not absolute datetime.
- [x] **Suppress noise**: Auto-collapse or de-emphasize low-value pairs (`caller.started_speaking` + `caller.stopped_speaking`, `agent.started_speaking` + `agent.stopped_speaking`) — show as collapsed "Speech: caller 12:06:00 → 12:06:01" instead of 2 separate rows

## Layout Change

System events move from the left column (below conversation) to the **right column** (below Node Inspector). The conversation panel becomes full-height on the left — the only primary artifact.

Right column stacking order:
1. Node Inspector — selected graph node detail
2. System Events — grouped by graph node, filtered by type
3. Escalation — alert state
4. Call Context — reference metadata

**Key interaction:** Clicking a graph node updates both the Node Inspector AND scrolls/filters system events to show events from that node's execution window.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/test-workbench/system-events-panel.tsx` | Create | New system events component with type badges, grouping, and filtering |
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/test/page.tsx` | Modify | Move system events from left column to right column below NodeInspector |

## Acceptance Criteria

- [x] Each event type has a visually distinct colored badge
- [x] Events are grouped by graph node execution or time window
- [x] Filter chips allow toggling event types on/off
- [x] Speech start/stop pairs collapsed into single summary rows
- [x] 92 events are navigable without scrolling through every item
- [x] Relative timestamps ("T+12s") instead of absolute datetimes
