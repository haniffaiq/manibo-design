# T11: Add Tabs Navigation to Observability Workspace

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T11 - add Tabs navigation to observability workspace`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

Replace the current dropdown/filter pattern for observability subject types with horizontal Tabs using the new `@grove/ui/tabs` component. The 6 supported subject kinds become tab triggers: Sessions, Channel Sessions, Workflows, Incidents, Runtimes, Composition.

## Subtasks

- [x] **Import Tabs** from `@grove/ui/tabs` in the observability workspace
- [x] **Add TabsList** with 7 triggers: "All" (default) + 6 subject kinds
- [x] **Wire tab selection**: "All" shows the current mixed queue (no subject filter); individual tabs filter to that subject type
- [x] **Show tab counts** in triggers (e.g., "Sessions (3)" when data is available); "All" shows total count
- [x] **Preserve** applied-filter badges below tabs
- [x] **Keep** advanced filters behind disclosure section
- [x] **Verify**: Observability E2E tests pass

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability-workspace.tsx` | Modify | Add Tabs for subject navigation |

## Implementation Notes

Tab triggers should map to the V2 subject model:
- "Sessions" → `call_session` (voice sessions)
- "Channel Sessions" → `interactive_channel_session` (web chat / public ingress)
- "Workflows" → `workflow_run`
- "Incidents" → `control_plane_incident`
- "Runtimes" → `channel_runtime`
- "Composition" → `tenant_composition`

Note: `interactive_channel_session` already has admin routes and E2E coverage in `apps/web/src/lib/observability-routes.ts` and `apps/web/e2e/observability.spec.ts`. Dropping it from the tabs would remove the only discovery path for channel-session investigations.

"All" should be the default active tab — this preserves the current mixed-kind queue that the Health page links to (`/admin/observability`). Operators following that link must land on a cross-kind view, not a session-only filter.

Tabs with no available data should show "(0)" and remain clickable (empty state inside TabsContent).

## Acceptance Criteria

- [x] 7 horizontal tab triggers visible: All (default), Sessions, Channel Sessions, Workflows, Incidents, Runtimes, Composition
- [x] "All" tab shows the mixed-kind queue (no subject filter) — same behavior as the current page
- [x] Switching tabs filters the case queue to that subject type
- [x] Active tab uses purple styling from the Tabs component
- [x] Tab counts update with real data
- [x] All existing observability E2E tests pass

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
- Depends on: T01 (Tabs component must exist)
