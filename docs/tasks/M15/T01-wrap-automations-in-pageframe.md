# T01: Wrap Automations Page in PageFrame

> **Milestone**: M15-workflow-client-ux
> **Status**: Not Started
> **Estimate**: S
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M15 T01 - wrap automations page in PageFrame`
2. **One Milestone = One PR** — branch: `feat/M15-workflow-client-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M15/PROGRESS.md` after completing

---

## Description

Replace the top-level `<div className="space-y-6">` wrapper in the automations page with the `<PageFrame width="standard">` layout component. This brings the automations page in line with other pages that already use PageFrame for consistent max-width, padding, and responsive behavior.

## Subtasks

- [ ] Import `PageFrame` from the shared layout components
- [ ] Replace `<div className="space-y-6">` with `<PageFrame width="standard">`
- [ ] Verify page renders correctly at all breakpoints
- [ ] Verify lint + type check pass

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/automations/page.tsx` | Modify | Replace outer div with PageFrame |

## Acceptance Criteria

- [ ] Page uses `<PageFrame width="standard">` as the outer wrapper
- [ ] No remaining `<div className="space-y-6">` as the page root
- [ ] Lint passes
- [ ] Type check passes

## References

- Milestone: [M15-workflow-client-ux.md](../../milestones/M15-workflow-client-ux.md)
