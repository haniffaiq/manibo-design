# T23: Playwright Visual Regression Suite

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T09, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20, T21, T22

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T23 - Playwright visual regression suite`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

Create a Playwright test suite that covers all redesigned screens. These tests verify the visual structure, interactive behavior, and accessibility of every page modified in M27. Run against a local dev server with mock data.

## Subtasks

- [x] **Test: Active calls page**
  - Page loads with call cards (not table rows)
  - Each card shows max 2 primary buttons + overflow menu
  - Overflow menu opens and shows 4 secondary actions
  - Urgent banner shows inline Transfer + Join buttons
  - Performance section is collapsed by default
  - Click "Performance summary" expands it
- [x] **Test: Support drawer**
  - Opens from call card action
  - Guidance section visible immediately (no scroll)
  - "Timing & performance" section is collapsed
  - "Technical trace" section is collapsed
  - Expanding sections reveals content
  - Escape closes the drawer
- [x] **Test: Call history page**
  - Master-detail layout renders (list + detail side by side)
  - Click a result row → detail panel updates
  - Detail panel shows session insights, summary tiles
  - "Technical details" opens a Drawer (not a hacked Modal)
  - Deep link `?call_id=X` works
- [x] **Test: Alerts page**
  - Cards render with severity left borders
  - Relative timestamps display ("X min ago")
  - No "Refresh" button present
  - Ack and Resolve buttons work
  - Filters change triggers data refresh
- [x] **Test: Deployment dashboard**
  - Health hero card is the first card
  - Worker status indicators visible
  - Error rate card adjacent to health
  - Quick links below hero section
  - Degraded state: health card border changes color
- [x] **Test: Sidebar**
  - Nav items use rounded-lg (not rounded-2xl)
  - Live count pills visible on Active Calls and Alerts
  - Active route highlighted correctly
- [x] **Test: Escalation modal**
  - Opens centered (no position hack)
  - Transfer button is destructive (red)
  - Textarea allows long input
- [x] **Test: DataTable hover**
  - Table rows highlight on hover
- [x] **Test: Error/notice consistency**
  - Error messages use StatusMessage component (bordered variant)
  - Notice messages use StatusMessage component

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/tests/visual/active-calls.spec.ts` | Create | Active calls visual tests |
| `apps/web/tests/visual/support-drawer.spec.ts` | Create | Support drawer visual tests |
| `apps/web/tests/visual/call-history.spec.ts` | Create | Call history visual tests |
| `apps/web/tests/visual/alerts.spec.ts` | Create | Alerts visual tests |
| `apps/web/tests/visual/deployment-dashboard.spec.ts` | Create | Deployment dashboard visual tests |
| `apps/web/tests/visual/sidebar.spec.ts` | Create | Sidebar visual tests |
| `apps/web/tests/visual/shared-patterns.spec.ts` | Create | Error/notice, DataTable hover tests |

## Implementation Notes

- Check existing Playwright setup: `apps/web/playwright.config.ts` or `apps/web/tests/`.
- Tests should use `data-testid` selectors (already present on all components).
- Mock API responses using Playwright's `page.route()` to intercept fetch calls.
- For visual regression, use `expect(page).toHaveScreenshot()` or `expect(locator).toHaveScreenshot()` with a tolerance threshold.
- Store baseline screenshots in `apps/web/tests/visual/__screenshots__/`.
- Tests should be runnable in CI (headless Chromium).

## Acceptance Criteria

- [x] All test files created and pass locally
- [x] Each redesigned page has at least one visual assertion
- [x] Interactive behaviors tested (expand/collapse, drawer open/close, overflow menu)
- [x] Tests use data-testid selectors (stable, not CSS-based)
- [x] Tests can run in headless mode for CI
- [x] `pnpm --filter @nfq/web playwright:test -- tests/visual/` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Existing Playwright setup: check `apps/web/playwright.config.ts`
