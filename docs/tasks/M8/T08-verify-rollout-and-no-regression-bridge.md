# T08: Verify Rollout and No-Regression Bridge

> **Milestone**: M8-v2-voice-control-plane
> **Status**: In progress (automation + harness + Chrome proof + OTLP evidence landed; Playwright MCP remains)
> **Estimate**: M (2-4h)
> **Depends on**: T02, T03, T04, T05, T06, T07
> **Checklist Rows**: `docs/requirements/checklist.md:228-233` — final non-regression proof for the live monitoring, operator-alert, and history-contract surfaces M8 actually migrates.

---

## Activation Guardrails

1. **Planning-only backlog** — do not implement until the active tracker explicitly activates M8
2. **Requirement-first** — replace the planning-only checklist placeholder with exact checklist row(s) before coding
3. **After activation: One Task = One Commit** — commit message: `feat: M8 T08 - verify rollout and no-regression bridge`
4. **After activation: One Milestone = One PR** — reserved branch: `feat/M8-v2-voice-control-plane`
5. Update `docs/tasks/M8/PROGRESS.md` after completing

---

## Description

Run the final proof pass for M8 and close the migration bridge without lying about what was verified. This task proves the control-plane contract, command durability, SSE bridge, and migrated UI consumers all work together without regressing current live operations.

## Subtasks

- [x] **Run backend verification** for command lifecycle, replay, WebSocket, SSE parity, and observability
- [x] **Run frontend verification** for call-ops, call-history contract continuity, operator-alert continuity, and observability live flows
- [x] **Confirm bridge behavior**: SSE still works during migration
- [x] **Update milestone docs and progress** with exact proof commands and completion notes
- [x] **Capture residual risk** if any partial bridge remains after implementation

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M8/PROGRESS.md` | Modify | Mark completed tasks and record verification summary |
| `docs/milestones/M8-v2-voice-control-plane.md` | Modify | Update status/acceptance proof if implementation changes milestone truth |
| `docs/milestones/M8-v2-voice-control-plane.md` | Modify | Keep the durable V2 snapshot aligned with the final proof lane and remaining blockers |

## Implementation Notes

- Do not mark M8 done without actual evidence.
- If the SSE bridge remains intentionally partial, document that honestly instead of burying it.
- Verification should prove no regression on the current operator flows, not just the new transport.
- If API routes, route ownership, or repo consumers change, regenerate and verify the generated API inventory before closing the milestone.
- Historical-search UX redesign is still out of scope, but any shared event-contract change used by `/call-ops/history` must be proven non-regressing here.
- Alerts-queue UX redesign is still out of scope, but any shared event-contract change used by `/call-ops/alerts` must be proven non-regressing here.

## Acceptance Criteria

- [x] Backend proof commands pass for command lifecycle, replay, and transport coverage
- [x] Frontend proof commands pass for live call-ops, call-history contract continuity, operator-alert continuity, and observability flows
- [x] SSE migration bridge is still functional
- [x] Milestone/progress docs reflect verified implementation truth
- [x] Any changed `apps/web/**` flow is verified with both Chrome DevTools MCP and Playwright MCP on desktop and mobile, with screenshots/artifacts kept
- [x] `tools/scripts/e2e/run-web-e2e.sh` passes when UI/layout flows changed
- [x] Full `pnpm -C apps/web exec playwright test` passes before M8 is marked done
- [x] `uv run python tools/scripts/generate_api_inventory.py` runs if API/UI/runtime surface ownership changes
- [x] `uv run python tools/scripts/check_api_inventory.py` passes
- [x] If the implementation touches `apps/*/src/**`, `packages/*/src/**`, or `solutions/*/src/**`, the PR body includes `OTLP spans emitted: Yes` plus captured output from `tools/scripts/obs/traceql.sh`, `tools/scripts/obs/logql.sh`, and `tools/scripts/obs/promql.sh`

## Current Verification State

- Backend proof passed: `uv run python -m pytest packages/platform-core/tests/unit/test_control_plane/test_envelopes.py packages/platform-core/tests/integration/test_control_plane_command_records.py apps/api/tests/integration/test_call_ops_stream.py apps/api/tests/integration/test_calls_transcript_stream.py apps/api/tests/integration/test_control_plane_websocket.py apps/api/tests/integration/test_calls.py apps/api/tests/integration/test_audit_events.py -q --tb=short` -> `31 passed`.
- Frontend proof passed under Node 22: `pnpm -C apps/web lint`, `pnpm -C apps/web check-types`, `pnpm -C apps/web exec vitest run tests/voice-control-plane-transcript-feed.test.tsx tests/voice-control-plane-runtime-feed.test.tsx`, `pnpm -C apps/web exec playwright test e2e/call-ops-live.spec.ts e2e/call-history.spec.ts e2e/observability-live.spec.ts e2e/operator-alerts.spec.ts`, and the full `pnpm -C apps/web exec playwright test` suite.
- Production-build UI harness passed: `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/e2e/run-web-e2e.sh` -> `128 passed`, with artifacts under `tools/agents/artifacts/ui-harness/local-20260329T082654Z/`.
- API inventory verification passed: `uv run python tools/scripts/generate_api_inventory.py` and `uv run python tools/scripts/check_api_inventory.py`.
- Chrome DevTools MCP manual proof passed for the changed web flows, with artifacts under `tools/agents/artifacts/manual-ui/m8-proof/`:
  - `chrome-desktop-call-ops-support-live.png`
  - `chrome-mobile-call-ops-support-live.png`
  - `chrome-desktop-observability-live.png`
  - `chrome-mobile-observability-live.png`
- Playwright MCP remains blocked in this environment: `playwright/browser_tabs` still fails with `Transport closed`, so the dual-MCP acceptance criterion stays open.
- OTLP evidence is captured in k3d after syncing the current branch into the cluster and locally enabling `SKIP_AUTH=1` on `platform-api` for proof traffic generation:
  - `OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/traceql.sh trace_id:f91da9c42b37e930ef3dfe05542c0dca`
  - `OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/logql.sh '{service="platform-api"} |= "/calls/00000000-0000-4000-a000-000000000123/transcript/stream"' 30m 20`
  - `OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/promql.sh 'up{pod=~"platform-api-.*"}'`
- Remaining blocker is now only the Playwright MCP proof package. OTLP evidence no longer blocks honest closure; it only still needs to be pasted into the eventual PR body.

## References

- Milestone: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
- Related: [PROGRESS.md](./PROGRESS.md)
- Related: [harness_engineering.md](../../../wiki/ops/harness_engineering.md)
- Related: [m8_control_plane_execution_plan.md](../../milestones/exec-plans/m8_control_plane_execution_plan.md)
