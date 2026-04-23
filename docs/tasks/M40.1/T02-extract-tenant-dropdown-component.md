# T02: Admin Calls — Extract Inline TenantDropdown to Shared Component

> **Milestone**: M40.1-calls-frontend-polish
> **Status**: Not Started
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M40.1 T02 - extract TenantDropdown to shared component`

2. **One Milestone = One PR**
   - PR branch: `feat/M40.1-calls-frontend-polish`

3. **Follow CLAUDE.md and AGENTS.md**

4. **After Completing This Task**
   - Update `docs/tasks/M40.1/PROGRESS.md`

---

## Description

The admin calls page defines `TenantDropdown` inline (lines 105-147) with custom click-outside, keyboard escape, and live-count badge logic. This component is useful across multiple admin pages (calls, agent-definitions, telephony). Extract it to `@/components/admin-tenant-dropdown.tsx` and reuse it.

## Subtasks

- [ ] **Extract component**: Move `TenantDropdown` to `web/src/components/admin-tenant-dropdown.tsx`
- [ ] **Type the props**: Create a clean typed interface for the component
- [ ] **Replace usage**: Import the shared component in `admin/calls/page.tsx`
- [ ] **Check other pages**: If agent-definitions or telephony pages have similar inline tenant selectors, replace those too

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `web/src/components/admin-tenant-dropdown.tsx` | Create | Shared tenant dropdown with live counts and keyboard handling |
| `web/src/app/(deployment)/admin/calls/page.tsx` | Modify | Import shared component, remove inline definition |

## Acceptance Criteria

- [ ] `TenantDropdown` is a standalone importable component
- [ ] Admin calls page uses the shared component with identical behavior
- [ ] Click-outside and Escape key handling preserved
- [ ] Live count badges preserved
- [ ] `pnpm -C apps/web check-types` passes

## References

- Milestone: [M40.1-calls-frontend-polish.md](../../milestones/M40.1-calls-frontend-polish.md)
- Current inline component: `web/src/app/(deployment)/admin/calls/page.tsx:105-147`
