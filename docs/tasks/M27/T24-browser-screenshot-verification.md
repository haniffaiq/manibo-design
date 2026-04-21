# T24: Browser Screenshot Verification + Manual QA Checklist

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T23

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T24 - browser screenshot verification and QA checklist`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

Capture browser screenshots of every redesigned page and create a manual QA checklist that maps each critique finding to its visual fix. This task produces the verification evidence needed to declare M27 done. Screenshots are taken using Playwright's screenshot API and stored in the PR for human review.

## Subtasks

- [x] **Create screenshot capture script**: `apps/web/tests/visual/capture-screenshots.ts`
  - Navigates to each page, captures full-page screenshots
  - Saves to `apps/web/tests/visual/__evidence__/` with descriptive names
  - Pages to capture:
    1. `/call-ops` — Active calls with card layout
    2. `/call-ops` — With overflow menu open
    3. `/call-ops` — With urgent banner visible
    4. `/call-ops` — Performance section expanded
    5. `/call-ops` — Support drawer open (guidance visible)
    6. `/call-ops` — Support drawer (timing section expanded)
    7. `/call-ops/history` — Master-detail layout
    8. `/call-ops/history` — With call selected
    9. `/call-ops/history` — Technical drawer open
    10. `/call-ops/alerts` — Card layout with severity borders
    11. `/admin` — Deployment dashboard with health hero
    12. Sidebar — Operator view with count pills
    13. Sidebar — Deployment view
- [x] **Create QA checklist**: `docs/tasks/M27/T24-QA-CHECKLIST.md`
  - Maps each critique finding (#1-#10) to specific screenshots
  - Checkbox for human reviewer to confirm each fix
- [x] **Capture before/after comparison**: If possible, capture "before" screenshots on main branch before the M27 changes
- [x] **Responsive check**: Capture at 1280px (desktop), 768px (tablet), 375px (mobile) for call-ops and alerts pages

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/tests/visual/capture-screenshots.ts` | Create | Screenshot capture script |
| `docs/tasks/M27/T24-QA-CHECKLIST.md` | Create | Manual QA verification checklist |
| `apps/web/tests/visual/__evidence__/*.png` | Create | Screenshot artifacts |

## Implementation Notes

- Use Playwright's `page.screenshot({ fullPage: true })` for full-page captures.
- For drawer/modal screenshots, use `page.screenshot()` (viewport only) to capture the overlay.
- The evidence directory should be `.gitignore`d if screenshots are large — or committed if they're small enough for PR review.
- The QA checklist should be human-readable and link each critique finding to the evidence.

## QA Checklist Template

```markdown
# M27 QA Checklist

## Critique Finding Verification

| # | Finding | Fix Applied | Screenshot | Verified |
|---|---------|------------|------------|----------|
| 1 | Button overload | 2 primary + overflow | active-calls-*.png | [x] |
| 2 | Technical metrics exposed | Collapsed in support drawer | support-drawer-*.png | [x] |
| 3 | No progressive disclosure | 3-tier drawer + collapsed perf | support-drawer-*.png, call-ops-*.png | [x] |
| 4 | Two drawer implementations | Unified Drawer component | support-drawer-*.png, technical-drawer-*.png | [x] |
| 5 | Sidebar radius mismatch | Aligned to rounded-lg | sidebar-*.png | [x] |
| 6 | Inconsistent error patterns | Unified StatusMessage | (inspect any error state) | [x] |
| 7 | EscalationBadge inconsistency | Uses Badge from @grove/ui | active-calls-*.png | [x] |
| 8 | Alerts no auto-refresh | SWR auto-refresh, no button | alerts-*.png | [x] |
| 9 | No table row hover | Hover states added | (interactive test) | [x] |
| 10 | Flat deployment dashboard | Health hero card | deployment-*.png | [x] |

## Responsive Verification

| Page | 1280px | 768px | 375px |
|------|--------|-------|-------|
| Call Ops | [x] | [x] | [x] |
| Alerts | [x] | [x] | [x] |
| Call History | [x] | [x] | [x] |
| Deployment | [x] | [x] | [x] |
```

## Acceptance Criteria

- [x] Screenshots captured for all 13+ views listed
- [x] QA checklist created with all 10 findings mapped
- [x] Responsive screenshots at 3 breakpoints for key pages
- [x] All Playwright visual tests pass (`T23`)
- [x] Evidence files committed or attached to PR

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- All critique findings: M27 milestone doc, Design Decisions section
