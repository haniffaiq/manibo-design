# T15: Playwright Regression + Text-Fit Verification

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T05, T06, T07, T08, T09, T10, T11, T12, T13, T14, T16

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T15 - Playwright regression and text-fit verification`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

Final verification pass. Update all Playwright E2E tests for changed UI, add `expectTextFits()` guards on dense admin labels, and run the full suite + UI harness.

## Subtasks

- [x] **Update E2E tests** that assert on changed labels (sidebar groups, assistant statuses, dashboard structure)
- [x] **Add text-fit guards** for:
  - Tenant action columns (Suspend, Export, Offboard)
  - User action columns (Deactivate, Remove)
  - Settings action columns (Edit, Delete)
  - Solutions toggle buttons (Enable/Disable)
  - Release action buttons (View details, Apply to tenant)
- [x] **Run full Playwright suite**: All admin specs must pass
- [x] **Run UI harness**: Desktop + mobile proof screenshots
- [x] **Run Chrome DevTools MCP verification** on desktop and mobile for every changed admin page (required by AGENTS.md rule 7 for web UI/layout changes) — produce screenshot artifacts
- [x] **Verify sidebar** navigation: all 11 routes reachable, active highlighting correct
- [x] **Verify observability**: Tabs switch, case detail renders, evidence rail visible

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/e2e/admin-dashboard.spec.ts` | Modify | Update for new dashboard structure |
| `apps/web/e2e/admin-tenants.spec.ts` | Modify | Update for Select component |
| `apps/web/e2e/admin-agent-definitions.spec.ts` | Modify | Update for new status labels |
| `apps/web/e2e/observability.spec.ts` | Modify | Update for Tabs navigation |
| `apps/web/e2e/admin-releases.spec.ts` | Modify | Update for Select component |
| `apps/web/e2e/admin-solutions.spec.ts` | Modify | Update for Select component |
| `apps/web/e2e/admin-settings.spec.ts` | Modify | Update for tooltip + Select |
| `apps/web/e2e/admin-phone-numbers.spec.ts` | Modify | Update for Select component (T08 will break `.selectOption()` calls) |
| `apps/web/e2e/admin-users.spec.ts` | Modify | Update for Select component (T08 will break `.selectOption()` calls) |
| `apps/web/e2e/admin-security.spec.ts` | Modify | Update for Select component + skeleton loading |
| `apps/web/e2e/admin-health.spec.ts` | Modify | Update for skeleton loading + tooltip on unavailable metrics |

## Acceptance Criteria

- [x] `pnpm -C apps/web lint` passes
- [x] `pnpm -C apps/web check-types` passes
- [x] All E2E tests pass: `pnpm -C apps/web exec playwright test --project=chromium`
- [x] `expectTextFits()` guards exist on all dense action labels
- [x] UI harness produces desktop + mobile screenshots
- [x] Chrome DevTools MCP desktop + mobile screenshots for every changed admin page
- [x] No clipped button text, no overlapping controls, no truncated primary actions

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
- All prior tasks must be complete before this runs
