# T10: Playwright Regression + Chrome DevTools Verification

> **Milestone**: M15-workflow-client-ux
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T01, T02, T03, T04, T05, T06, T07, T08, T09

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M15 T10 - playwright regression + chrome devtools verification`
2. **One Milestone = One PR** — branch: `feat/M15-workflow-client-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M15/PROGRESS.md` after completing

---

## Description

Update the automations E2E tests to cover all UI changes from T01-T09. Add `expectTextFits()` guards on action buttons to catch text overflow. Run the full Playwright suite, UI harness, and capture Chrome DevTools screenshots at desktop and mobile breakpoints.

## Subtasks

- [ ] **Update E2E tests for Select component** (T02): Test that the status filter Select opens, selects an option, and filters correctly
- [ ] **Update E2E tests for Skeleton** (T03): Test that skeletons appear during loading and are replaced by content
- [ ] **Update E2E tests for Modal** (T04): Test that retry opens Modal, Cancel closes it, Start new run triggers API call
- [ ] **Update E2E tests for Tooltip** (T05): Test that disabled retry button shows tooltip on hover
- [ ] **Add expectTextFits() guards**: Verify action button text does not overflow its container
- [ ] **Template catalog tests** (T06): Test that template cards render, empty state shows when appropriate
- [ ] **Configuration form tests** (T07-T09): Test basic form interactions (open, fill, save, cancel)
- [ ] **Run full Playwright suite**: All automations E2E tests pass
- [ ] **Chrome DevTools screenshots**: Capture desktop (1280px) and mobile (375px) screenshots

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/e2e/automations.spec.ts` | Modify/Create | Update E2E tests for all M15 UI changes |

## Implementation Notes

- Use `page.getByTestId()` for elements with `data-testid`
- Use `page.getByRole()` for semantic elements (buttons, dialogs, comboboxes)
- `expectTextFits()` should compare element scrollWidth vs clientWidth
- Modal tests: verify both the open state and the API call on confirmation
- Screenshot comparisons: capture at consistent viewport sizes

## Acceptance Criteria

- [ ] All automations E2E tests pass
- [ ] Select component interactions tested (open, select, filter)
- [ ] Modal confirmation flow tested (open, cancel, confirm)
- [ ] Skeleton loading states tested (appear, disappear)
- [ ] Tooltip on disabled button tested (hover shows tooltip text)
- [ ] `expectTextFits()` guards on action buttons pass
- [ ] Chrome DevTools desktop screenshot captured (1280px width)
- [ ] Chrome DevTools mobile screenshot captured (375px width)
- [ ] Lint passes
- [ ] Type check passes

## References

- Milestone: [M15-workflow-client-ux.md](../../milestones/M15-workflow-client-ux.md)
