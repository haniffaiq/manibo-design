# T06: Cross-Page Responsive Polish and Empty State Consistency

> **Milestone**: M40.1-calls-frontend-polish
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T01, T03

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M40.1 T06 - responsive polish and empty state consistency`

2. **One Milestone = One PR**
   - PR branch: `feat/M40.1-calls-frontend-polish`

3. **Follow CLAUDE.md and AGENTS.md**

4. **After Completing This Task**
   - Update `docs/tasks/M40.1/PROGRESS.md`

---

## Description

After T01-T05, sweep all calls pages for mobile responsiveness and empty state consistency. The admin calls page uses inline styles and custom CSS that may not stack correctly on mobile. Ensure all pages follow the M27 progressive disclosure patterns.

## Subtasks

- [ ] **Admin calls on mobile**: Ensure live/history tables switch to card layout on narrow screens (pattern from M27 T10)
- [ ] **Call replay on mobile**: Stack the transcript and event inspector vertically
- [ ] **Tenant call-ops on mobile**: Verify dashboard grid, history master-detail, and alerts cards stack correctly
- [ ] **Empty states**: Ensure all calls pages use the same empty state pattern — centered icon, title, description, optional action button
- [ ] **Loading states**: Ensure all pages use skeleton loading (not bare "Loading..." text)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `web/src/app/(deployment)/admin/calls/page.tsx` | Modify | Mobile card layout for tables |
| `web/src/app/(deployment)/admin/calls/[callId]/page.tsx` | Modify | Mobile stacking |
| `web/src/app/(tenant)/call-ops/page.tsx` | Modify | Mobile grid verification |
| `web/src/app/(tenant)/call-ops/history/page.tsx` | Modify | Mobile master-detail stacking |
| Multiple empty state sections across pages | Modify | Consistent pattern |

## Acceptance Criteria

- [ ] Admin calls tables switch to cards on mobile
- [ ] Call replay stacks transcript + inspector on mobile
- [ ] Tenant call-ops pages stack correctly on mobile
- [ ] All empty states use consistent visual pattern
- [ ] All loading states use skeletons
- [ ] Visual proof at 375px and 1440px

## References

- Milestone: [M40.1-calls-frontend-polish.md](../../milestones/M40.1-calls-frontend-polish.md)
- M27 mobile patterns: `docs/milestones/M27-console-craft-progressive-disclosure.md`
