# T10: Add Architecture Guards And Refactor Proof Coverage

> **Milestone**: M8.2-control-plane-refactor-hardening
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T01, T03, T05, T06, T08, T09
> **Execution**: Active implementation on milestone branch `feat/M8.2-control-plane-refactor-hardening` as of 2026-03-30 by explicit human instruction.
> **Checklist Rows**: `docs/requirements/checklist.md:228-233,381,385` — proof and guardrails exist only to protect the call-monitoring and governed-agent surfaces M8.2 is allowed to refactor.

---

## Activation Guardrails

1. **Active milestone only** — implement only on the activated milestone branch and keep one task = one commit
2. **Requirement-first** — revalidate checklist rows `228-233,381,385` before coding; proof scope may not wander outside those surfaces
3. **After activation: One Task = One Commit** — commit message: `feat: M8.2 T10 - add architecture guards and refactor proof coverage`
4. **After activation: One Milestone = One PR** — reserved branch: `feat/M8.2-control-plane-refactor-hardening`
5. Update `docs/tasks/M8.2/PROGRESS.md` after completing

---

## Description

If M8.2 lands without mechanical enforcement, the repo will drift straight back into monoliths and split ownership. Lock in the new boundaries with architecture/file-size checks and an explicit proof bundle covering API inventory, workflow/runtime behavior, and web UI regressions.

## Subtasks

- [x] Tighten or extend file-size/architecture checks around the refactored surfaces
- [x] Add tests that prove new shared modules own the behavior that used to be duplicated
- [x] Regenerate and verify API inventory for the route/module split
- [x] Run the relevant backend, runtime, and web proof suites
- [x] Carry the repo-mandated Chrome DevTools MCP + Playwright MCP desktop/mobile proof, screenshots/artifacts, full `apps/web` Playwright run, and `tools/scripts/e2e/run-web-e2e.sh` into any M8.2 task that touches `apps/web/**`
- [x] Require OTLP TraceQL, LogQL, and PromQL evidence for any implementation PR that touches `apps/*/src/**`, `packages/*/src/**`, or `solutions/*/src/**`
- [x] Document the required proof commands in the milestone progress notes if implementation starts

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tests/architecture/test_repo_file_size.py` | Modify | Reflect new budgets and prevent regrowth into monoliths |
| `packages/grove/tests/unit/architecture/` | Create/Modify | Add boundary checks if needed for shared workflow/runtime modules |
| `docs/tasks/M8.2/PROGRESS.md` | Modify | Record proof state once implementation begins |
| `docs/arch/generated/api_inventory.md` | Modify | Regenerated inventory after route refactors |

## Implementation Notes

- Favor existing mechanical checks before inventing new harnesses.
- The point is not a bigger test pile. The point is preventing regression into the same structure we just paid to remove.
- Keep verification scoped to the touched surfaces plus the required global gates.
- For any M8.2 implementation that touches `apps/web/**`, the UI proof bar is non-optional: Chrome DevTools MCP + Playwright MCP on desktop and mobile, screenshots/artifacts, full `pnpm -C apps/web exec playwright test`, and `tools/scripts/e2e/run-web-e2e.sh`.
- For checklist rows `228-233`, proof is not complete without the runtime snapshot, call latency, call events, and observability API coverage that already guards those live-call surfaces.
- OTLP proof is part of "done" for implementation PRs that touch source files, not an optional nice-to-have.

## Acceptance Criteria

- [x] Architecture/file-size guardrails catch the regrowth paths that M8 exposed
- [x] Refactor-specific proof commands are documented and reproducible
- [x] API inventory, backend tests, runtime tests, web lint/typecheck, Playwright, and UI harness remain green
- [x] UI-touching M8.2 tasks explicitly require Chrome DevTools MCP + Playwright MCP desktop/mobile proof plus screenshots/artifacts
- [x] OTLP TraceQL, LogQL, and PromQL evidence is required and documented for source-touching implementation PRs

## Completion Notes

- Tightened the stale file-size ceilings in `tests/architecture/test_repo_file_size.py` and `packages/grove/tests/unit/architecture/test_file_size.py` to the actual post-refactor baselines for `calls.py`, `voice_call_workflow.py`, `voice_job.py`, `structured-agent-editor.tsx`, and the extracted `runtime_bridge.py` / `observability_projection.py` seams.
- Added `packages/grove/tests/unit/architecture/test_live_call_runtime_state_wiring.py` and `tests/architecture/test_m8_2_refactor_guards.py` so the refactored shells now mechanically prove they still delegate to the extracted shared modules.
- Reduced `tools/scripts/api_inventory_lib.py` back under the shrink-only ceiling after the T08 admin-stream consumer scan update, then regenerated and rechecked the inventory contract.
- No additional Chrome DevTools MCP or Playwright MCP manual browser capture was required for T10 itself because no `apps/web/src/**` file changed. The guard now lives in the task/milestone docs and the full web Playwright + UI harness lanes were rerun anyway.

## Proof

- `uv run ruff check tests/architecture/test_repo_file_size.py packages/grove/tests/unit/architecture/test_file_size.py packages/grove/tests/unit/architecture/test_live_call_runtime_state_wiring.py tests/architecture/test_m8_2_refactor_guards.py tools/scripts/api_inventory_lib.py`
- `uv run ruff format tests/architecture/test_repo_file_size.py packages/grove/tests/unit/architecture/test_file_size.py packages/grove/tests/unit/architecture/test_live_call_runtime_state_wiring.py tests/architecture/test_m8_2_refactor_guards.py tools/scripts/api_inventory_lib.py --check`
- `uv run pyright -p pyrightconfig.ci.json`
- `uv run pytest tests/architecture/ -q -k 'repo_file_size or m8_2_refactor_guards or pr_observability_evidence_guard or api_inventory_contract' --tb=short`
- `uv run pytest packages/grove/tests/unit/architecture/test_file_size.py packages/grove/tests/unit/architecture/test_live_call_runtime_state_wiring.py packages/grove/tests/unit/temporal/test_live_call_runtime_state.py packages/grove/tests/unit/temporal/test_manual_takeover_workflow_lifecycle.py packages/grove-voice-livekit/tests/test_entrypoint.py packages/grove-voice-livekit/tests/unit/test_entrypoint_metadata_integration.py packages/grove-voice-livekit/tests/unit/test_session_bootstrap.py -q --tb=short`
- `uv run python tools/scripts/generate_api_inventory.py`
- `uv run python tools/scripts/check_api_inventory.py`
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web lint`
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web check-types`
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web exec vitest run tests/voice-control-plane-client.test.ts tests/voice-control-plane-transcript-feed.test.tsx tests/voice-control-plane-runtime-feed.test.tsx tests/structured-agent-editor-voice-panel.test.tsx tests/structured-agent-editor-voice-panel-render.test.tsx tests/structured-agent-editor-voice-panel.test.ts`
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3119 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3119 pnpm -C apps/web exec playwright test`
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/e2e/run-web-e2e.sh`

## References

- Milestone: [M8.2-control-plane-refactor-hardening.md](../../milestones/M8.2-control-plane-refactor-hardening.md)
- Related: [AGENTS.md](../../../AGENTS.md)
