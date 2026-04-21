# T05: E2E Tests and Visual Verification

> **Milestone**: M8.1-voice-turn-latency-observability
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T03, T04

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M8.1 T05 - e2e tests and visual verification`

2. **One Milestone = One PR**
   - PR branch: `feat/M8.1-voice-turn-latency-observability`

3. **Follow CLAUDE.md**

4. **Before Starting This Task**
   - Verify T03 and T04 are completed
   - Run full verification suite from milestone doc

5. **After Completing This Task**
   - Update `docs/tasks/M8.1/PROGRESS.md`

---

## Description

Add Playwright E2E tests for conversation turn rows in the observability workspace. Verify on desktop and mobile viewports. Run the full verification suite to confirm no regressions.

## Subtasks

- [x] **E2E: conversation turns render for voice call**: Navigate to completed call case detail, verify turn rows visible, verify latency bars render
- [x] **E2E: click-to-expand works**: Click a turn, verify expanded pipeline breakdown visible
- [x] **E2E: non-voice case unchanged**: Navigate to workflow run case, verify existing timeline renders (no conversation section)
- [x] **E2E: slow turn flagged**: Mock data with slow turn, verify warning indicator
- [x] **Verify mobile viewport**: Turn rows readable, bars don't overflow
- [x] **Run full suites**: `pnpm -C apps/web exec playwright test`, `pnpm -C apps/web exec vitest run`, `tools/scripts/e2e/run-web-e2e.sh`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/e2e/observability-turn-latency.spec.ts` | Create | Playwright E2E tests |

## Acceptance Criteria

- [x] E2E tests pass for conversation turns in voice call cases
- [x] E2E tests pass for click-to-expand
- [x] Non-voice cases pass without regression
- [x] Desktop and mobile viewports verified
- [x] `pnpm -C apps/web exec playwright test` passes (full suite)
- [x] `pnpm -C apps/web exec vitest run` passes (full suite)
- [x] `tools/scripts/e2e/run-web-e2e.sh` passes
- [x] `pnpm -C apps/web lint && pnpm -C apps/web check-types` passes

## References

- Milestone: [M8.1-voice-turn-latency-observability.md](../../milestones/M8.1-voice-turn-latency-observability.md)
- Existing E2E: `apps/web/e2e/observability-live.spec.ts`
