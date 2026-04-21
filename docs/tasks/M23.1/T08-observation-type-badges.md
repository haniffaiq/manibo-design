# T08: Add Observation Type Badges to System Events

> **Milestone**: M23.1 — Test Workbench UX Hardening
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T04

---

## Description

Langfuse uses distinct colored badges for each observation type (Agent=purple, Tool=orange, Generation=magenta, etc.). Our system events use the same gray "Logs" badge for everything, making it impossible to scan 92 events for a specific type.

This task defines the color mapping. T04 implements the full system events redesign including these badges.

**Note:** This task is tightly coupled with T04. If T04 is implemented first, the badge colors should be included there. This task exists as a standalone specification for the badge color system to ensure consistency across the platform (not just the test workbench).

## Subtasks

- [x] **Define badge color map**: Create a shared constant mapping `ObservabilityTimelineKind` to badge color:

  | Kind | Color | Hex/Class | Rationale |
  |------|-------|-----------|-----------|
  | `node` | Purple | `bg-purple-100 text-purple-700` | Matches AI/LLM semantic (purple = model thinking) |
  | `route` | Blue | `bg-blue-100 text-blue-700` | Navigation/decision (blue = routing/flow) |
  | `tool` | Orange | `bg-orange-100 text-orange-700` | Action/execution (orange = tool use, matches Langfuse) |
  | `log` | Gray | `bg-neutral-100 text-neutral-600` | Generic infrastructure log |
  | `workflow_step` | Green | `bg-green-100 text-green-700` | Workflow progress (green = forward movement) |
  | `recording` | Teal | `bg-teal-100 text-teal-700` | Media/recording (teal = media) |
  | `metric` | Amber | `bg-amber-100 text-amber-700` | Measurement (amber = data/warning adjacent) |
  | `transcript` | Indigo | `bg-indigo-100 text-indigo-700` | Speech content (indigo = conversation) |

- [x] **Export as shared constant**: Place in `apps/web/src/components/observability/formatters.ts` alongside existing `severityVariant` and `timelineGroupLabel` functions
- [x] **Apply in system events**: Use in T04's `SystemEventsPanel` and in `LiveTimelineRow`
- [x] **Apply in evidence rail**: Update `EvidenceRail` in `observability/evidence-rail.tsx` to use the same color map for consistency across test workbench and observability workspace

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/formatters.ts` | Modify | Add `timelineKindBadgeVariant()` function with color map |
| `apps/web/src/components/test-workbench/system-events-panel.tsx` | Modify | Use new badge colors (if T04 completed first) |
| `apps/web/src/components/observability/evidence-rail.tsx` | Modify | Use new badge colors for consistency |

## Acceptance Criteria

- [x] Each event type has a visually distinct colored badge
- [x] Color map is defined as a shared constant, not duplicated per component
- [x] Both test workbench and observability workspace use the same colors
- [x] Color choices are accessible (sufficient contrast on both light backgrounds)
