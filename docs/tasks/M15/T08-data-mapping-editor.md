# T08: Data Mapping Editor UI

> **Milestone**: M15-workflow-client-ux
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T06

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M15 T08 - data mapping editor UI`
2. **One Milestone = One PR** — branch: `feat/M15-workflow-client-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M15/PROGRESS.md` after completing

---

## Description

Add a structured form for mapping fields between the trigger payload and workflow input. This is NOT a visual graph editor (explicit non-goal). It is a tabular form where each row maps a destination field to a source field path.

**Backend constraint:** Current tenant overrides only persist workflow data mappings as plain destination→source strings (`packages/platform-core/src/platform_core/agents/tenant_overrides.py:83-125`). There is no transform field in the model. Do not add a transform dropdown — its value would be unsaveable.

## Subtasks

- [ ] **Row layout**: Each mapping row has: destination field (text input) → source field path (text input). No transform — the backend model does not support it.
- [ ] **Add row**: Button to add a new empty mapping row
- [ ] **Remove row**: Button to remove a mapping row
- [ ] **Validation**: Source and destination are required; duplicate destination fields are flagged
- [ ] **Save action**: Submit mappings via API
- [ ] **Pre-populate**: When editing an existing mapping, load current values into the form

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/automations/page.tsx` | Modify | Add data mapping editor form |

## Implementation Notes

- Explicit non-goal: no visual graph, no drag-and-drop, no node-based editor
- Keep it simple: destination input → source path input
- Source field paths use dot notation (e.g., `payload.caller.phone_number`)
- No transform dropdown — the backend model (`WorkflowTriggerOverride`) only persists destination→source string pairs

## Acceptance Criteria

- [ ] Admin can map destination fields to source field paths
- [ ] Each row has destination and source path (no transform — not in backend model)
- [ ] Rows can be added and removed
- [ ] Duplicate destination fields are flagged as validation errors
- [ ] Source and destination are required fields
- [ ] Form saves via API
- [ ] Lint passes
- [ ] Type check passes

## References

- Milestone: [M15-workflow-client-ux.md](../../milestones/M15-workflow-client-ux.md)
