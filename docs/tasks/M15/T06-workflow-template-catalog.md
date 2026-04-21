# T06: Workflow Template Catalog API + UI

> **Milestone**: M15-workflow-client-ux
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M15 T06 - workflow template catalog API + UI`
2. **One Milestone = One PR** — branch: `feat/M15-workflow-client-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M15/PROGRESS.md` after completing

---

## Description

Add a workflow template catalog that shows available workflow templates as a card grid below the execution list.

**Backend prerequisite:** There is currently no API endpoint that lists workflow templates. The existing tenant workflow surface only exposes executions/detail/steps/retry (`apps/api/src/platform_api/routes/workflows.py`). This task must first add a backend endpoint (e.g., `GET /workflows/templates`) that derives available templates from installed solution entry points and their workflow definitions, OR use existing solution config/metadata as a proxy. Do not implement the UI card grid against a nonexistent API.

## Subtasks

- [ ] **Backend endpoint**: Add `GET /workflows/templates` (or equivalent) that lists available workflow templates from installed solutions. Each template should expose: id, title, description, solution_name, configurable_fields metadata
- [ ] **API client**: Create or extend `apps/web/src/lib/api/workflows.ts` with a function to fetch from the new endpoint
- [ ] **Define template shape**: Type for template (id, title, description, category, configurable fields metadata)
- [ ] **UI card grid**: Render templates as cards below the execution list
- [ ] **Card layout**: Title, description text, [Configure] button per card
- [ ] **Empty state**: Show appropriate message when no templates are available
- [ ] **Loading state**: Use Skeleton cards while templates are loading
- [ ] **Error handling**: Show error notice if template fetch fails

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/workflows.py` | Modify | Add `GET /workflows/templates` endpoint |
| `apps/web/src/app/(tenant)/automations/page.tsx` | Modify | Add template catalog card grid UI |
| `apps/web/src/lib/api/workflows.ts` | Modify | Add API client for fetching workflow templates |

## Implementation Notes

- Reuse the card-grid pattern from M20 assistant starter picker
- Templates may come from solution config entry points or a platform API endpoint
- The [Configure] button should open/navigate to configuration (wired in T07)
- Keep the template type generic enough to support different solution types

## Acceptance Criteria

- [ ] Admin sees available workflow templates as a card grid
- [ ] Each card shows title, description, and [Configure] button
- [ ] Empty state renders when no templates are available
- [ ] Loading state uses Skeleton cards
- [ ] API client function exists and is typed
- [ ] Lint passes
- [ ] Type check passes

## References

- Milestone: [M15-workflow-client-ux.md](../../milestones/M15-workflow-client-ux.md)
- Pattern reference: M20 assistant starter picker card grid
