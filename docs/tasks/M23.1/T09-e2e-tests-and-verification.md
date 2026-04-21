# T09: Update E2E Tests and Visual Verification

> **Milestone**: M23.1 — Test Workbench UX Hardening
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01, T02, T03, T04, T05, T06, T07, T08

---

## Description

After all UX changes, update the existing E2E test suite to match the new layout and add new test coverage for the added features.

## Subtasks

- [x] **Update existing assertions**: Fix any selectors broken by T01-T08 changes (chat layout, system events panel, waterfall toggle, etc.)
- [x] **Add graph trace node visit tests**: Verify repeated nodes show visit indices
- [x] **Add waterfall toggle test**: Verify chain/waterfall toggle switches views
- [x] **Add chat layout tests**: Verify user/assistant messages have distinct styling
- [x] **Add system events filter test**: Verify type filter chips toggle event visibility
- [x] **Add token rollup test**: Verify graph trace header shows aggregated token count when trace data includes token fields
- [x] **Visual verification**: Capture screenshots with Playwright MCP or Chrome DevTools MCP for:
  - Graph trace with repeated nodes (chain + waterfall views)
  - Chat conversation with user/assistant bubbles
  - System events with colored type badges and filtering
  - Node inspector with TTFT split data
- [x] **Run full Playwright suite**: Ensure no regressions across the entire `agent-test-workbench.spec.ts`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/e2e/agent-test-workbench.spec.ts` | Modify | Update selectors, add new test cases |

## Acceptance Criteria

- [x] All existing E2E tests pass (no regressions)
- [x] New tests cover: visit indices, waterfall toggle, chat layout, event filtering, token rollup
- [x] Visual proof captured and stored
- [x] `pnpm -C apps/web check-types` and `pnpm -C apps/web lint` pass
