# T14: Playwright Regression After Solution Move

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T05

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T14 - Playwright regression after solution move`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

Run the full Playwright E2E suite to verify that solution pages still render and function correctly after moving UI code from `apps/web/src/solutions/` into standalone `@solution/*-ui` packages. The move should be transparent to end users — no visual or functional regressions.

## Subtasks

- [x] **Run clinic-bookings spec** — `apps/web/e2e/clinic-bookings.spec.ts` passes
- [x] **Run clinic-knowledge-base spec** — `apps/web/e2e/clinic-knowledge-base.spec.ts` passes
- [x] **Run clinic-browser-voice spec** — `apps/web/e2e/clinic-browser-voice.spec.ts` passes
- [x] **Run driver-verification spec** — `apps/web/e2e/driver-verification.spec.ts` passes
- [x] **Run dashboard spec** — `apps/web/e2e/dashboard.spec.ts` passes (dashboard widgets from solution packages)
- [x] **Run solution-gating spec** — `apps/web/e2e/solution-gating.spec.ts` passes
- [x] **Fix any failing tests** — update selectors or imports if the package move affected rendering

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/e2e/clinic-bookings.spec.ts` | Verify/Modify | May need import updates if test references moved code |
| `apps/web/e2e/clinic-knowledge-base.spec.ts` | Verify/Modify | May need import updates |
| `apps/web/e2e/clinic-browser-voice.spec.ts` | Verify/Modify | May need import updates |
| `apps/web/e2e/driver-verification.spec.ts` | Verify/Modify | May need import updates |
| `apps/web/e2e/dashboard.spec.ts` | Verify/Modify | Dashboard widgets now from packages |
| `apps/web/e2e/solution-gating.spec.ts` | Verify/Modify | Solution visibility gating |

## Acceptance Criteria

- [x] All Playwright E2E tests pass: clinic-bookings, clinic-knowledge-base, clinic-browser-voice, driver-verification, dashboard, solution-gating
- [x] No visual regression in solution pages
- [x] Solution pages render identical content before and after the move

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
- Depends on: T05 (generated registry wired into apps/web)
