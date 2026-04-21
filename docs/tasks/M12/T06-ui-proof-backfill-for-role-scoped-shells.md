# T06: UI Proof Backfill for Role-Scoped Shells

> **Milestone**: M12-workbench-composition
> **Status**: In Progress
> **Estimate**: M (2-4h)
> **Depends on**: T01
> **Checklist Rows**: `docs/requirements/checklist.md:45` — role-scoped shell behavior shipped in code, but repo-standard UI verification is still missing.

---

## Activation Guardrails

1. This is verification work, not an excuse to redesign the shell again.
2. If proof uncovers a real product bug, stop pretending this is just docs debt and spin the fix into the relevant M12 task before claiming closure.
3. One task = one commit:
   - `feat: M12 T06 - backfill role-scoped shell UI proof`
4. Update `docs/tasks/M12/PROGRESS.md` and the milestone proof section when done.

---

## Description

Backfill the repo-standard UI proof package for the shipped role-scoped tenant/deployment shell work. Historical Playwright coverage exists, but the milestone still lacks the required Chrome DevTools MCP + Playwright MCP desktop/mobile verification, full `apps/web` Playwright run, and `tools/scripts/e2e/run-web-e2e.sh` evidence. Until that proof is recorded, `#615` is not honestly closed under repo policy.

## Subtasks

- [x] Verify `client_operator` shell behavior with Chrome DevTools MCP on desktop + mobile
- [x] Verify `client_operator` shell behavior with Playwright MCP on desktop + mobile
- [x] Verify `client_admin` shell behavior with Chrome DevTools MCP on desktop + mobile
- [x] Verify `client_admin` shell behavior with Playwright MCP on desktop + mobile
- [x] Verify deployment shell shared-platform sections with Chrome DevTools MCP on desktop + mobile
- [x] Verify deployment shell shared-platform sections with Playwright MCP on desktop + mobile
- [x] Verify role-restricted admin-only route denial in both tool passes
- [x] Extend `apps/web/e2e/workbench-shells.spec.ts` only if the current suite misses one of the required flows
- [x] Run the full `apps/web` Playwright suite and capture the command output
- [x] Run `tools/scripts/e2e/run-web-e2e.sh` and capture the command output
- [x] Record artifact paths and proof commands in the milestone doc / progress doc
- [x] Close `#615` only after the proof package is recorded

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/e2e/workbench-shells.spec.ts` | Modify if needed | Fill any shell-proof gaps the current suite misses |
| `docs/milestones/M12-workbench-composition.md` | Modify | Record artifact paths and proof commands for the shell/layout flows |
| `docs/tasks/M12/PROGRESS.md` | Modify | Mark T06 done and note proof location |
| `wiki/ops/harness_engineering.md` | Reference only | Follow the repo-standard harness/proof guidance rather than inventing another ritual |

## Implementation Notes

- STTCPW: reuse the existing `workbench-shells.spec.ts` coverage first. Add only the minimum missing assertions.
- Proof package must cover the flows the repo UI gate actually cares about:
  - `client_operator` shell with admin-only nav hidden
  - `client_admin` shell with management nav visible
  - deployment shell shared-platform sections
  - role-restricted solution route access denial
- Use the same proof matrix for both tools:
  - Chrome DevTools MCP: desktop + mobile for every required flow
  - Playwright MCP: desktop + mobile for every required flow
- Record both:
  - exact commands run
  - exact artifact paths or output references
- Do not mark this done with “tests pass locally” hand-waving. The milestone needs recorded proof.

## Execution Phases

### Phase 1 — Fill proof gaps

- Add or tighten any missing `workbench-shells.spec.ts` assertions
- Keep scope limited to the shipped shell behavior

### Phase 2 — Run proof and record it

- Run Chrome DevTools MCP desktop/mobile verification
- Run Playwright MCP desktop/mobile verification
- Run full `apps/web` Playwright suite
- Run `tools/scripts/e2e/run-web-e2e.sh`
- Record the proof package in milestone/progress docs

## Acceptance Criteria

- [x] The role-scoped shell flows are verified with Chrome DevTools MCP on desktop and mobile
- [x] The role-scoped shell flows are verified with Playwright MCP on desktop and mobile
- [x] `apps/web/e2e/workbench-shells.spec.ts` covers the required role-shell scenarios without missing known gaps
- [x] `pnpm -C apps/web exec playwright test --project=chromium` is recorded for the full web suite
- [x] `tools/scripts/e2e/run-web-e2e.sh` is recorded
- [x] The milestone doc contains artifact paths or output references for the shell/layout proof package
- [x] `docs/tasks/M12/PROGRESS.md` marks T06 done only after the proof is recorded
- [x] `#615` is not re-closed until the recorded proof package exists

## References

- Milestone: [M12-workbench-composition.md](../../milestones/M12-workbench-composition.md)
- Progress: [PROGRESS.md](./PROGRESS.md)
- Issue: `#615`
