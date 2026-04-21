# T03: Add Skeleton Loading States

> **Milestone**: M15-workflow-client-ux
> **Status**: Not Started
> **Estimate**: S
> **Depends on**: M20 T04

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M15 T03 - add skeleton loading states`
2. **One Milestone = One PR** — branch: `feat/M15-workflow-client-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M15/PROGRESS.md` after completing

---

## Description

Replace the 3 "Loading..." text placeholders in the automations page with Skeleton components from `@grove/ui/skeleton`. Each skeleton should match the dimensions of the content it replaces to prevent layout shift.

## Subtasks

- [ ] Import `Skeleton` from `@grove/ui/skeleton`
- [ ] **Executions list** (line ~301): Replace "Loading..." with 3 skeleton cards matching execution card layout (height, padding, spacing)
- [ ] **Detail panel** (line ~398): Replace "Loading..." with skeleton blocks matching title + badge + 4-card grid layout
- [ ] **Step timeline** (line ~480): Replace "Loading..." with 3 skeleton step cards matching step card layout
- [ ] Verify no remaining "Loading..." text strings
- [ ] Verify no layout shift when content loads

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/automations/page.tsx` | Modify | Replace 3 Loading... texts with Skeleton components |

## Acceptance Criteria

- [ ] No "Loading..." text remains in the automations page
- [ ] Execution list skeleton shows 3 rows matching card dimensions
- [ ] Detail panel skeleton matches title + badge + 4-card grid
- [ ] Step timeline skeleton shows 3 rows matching step card dimensions
- [ ] No layout shift when real content replaces skeletons
- [ ] Lint passes
- [ ] Type check passes

## References

- Milestone: [M15-workflow-client-ux.md](../../milestones/M15-workflow-client-ux.md)
- Dependency: M20 T04 (Skeleton component must exist in `@grove/ui/skeleton`)
