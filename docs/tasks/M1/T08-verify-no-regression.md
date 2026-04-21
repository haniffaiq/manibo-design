# T08: Verify No Visual Regression with E2E Tests

> **Milestone**: M1-obs-ui-redesign
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T07

---

## Description

Run the full E2E test suite and unit tests to verify zero regression from the decomposition. Fix any broken selectors or import paths.

## Subtasks

- [x] **Run unit tests**: `apps/web/tests/observability-api.test.ts`, `apps/web/tests/call-observability-api.test.ts`, `apps/web/tests/call-observability-presenters.test.ts`
- [x] **Run E2E tests**: `apps/web/e2e/observability.spec.ts`
- [x] **Run full Playwright suite**: all specs in `apps/web/e2e/`
- [x] **Fix any broken selectors**: update if component boundaries changed DOM structure
- [x] **Verify lint + types**: full pass

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/e2e/observability.spec.ts` | Modify (if needed) | Fix selectors if DOM changed |

## Acceptance Criteria

- [x] All observability unit tests pass
- [x] All observability E2E tests pass
- [x] Full Playwright suite passes (no collateral damage)
- [x] `pnpm -C apps/web lint` passes
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M1-obs-ui-redesign.md](../../milestones/M1-obs-ui-redesign.md)
- Tests: `apps/web/tests/observability-*.test.ts`, `apps/web/e2e/observability.spec.ts`
