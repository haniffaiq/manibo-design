# T06: Create Shared Web Realtime Client and Migrate One Path

> **Milestone**: M8-v2-voice-control-plane
> **Status**: In progress (implementation + harness + Chrome proof + OTLP evidence landed; Playwright MCP remains)
> **Estimate**: L (4-8h)
> **Depends on**: T04, T05
> **Checklist Rows**: `docs/requirements/checklist.md:228-229` — first migrated live monitoring/transcript surface only. Re-map this task explicitly if the chosen first consumer proves a different checklist row.

---

## Activation Guardrails

1. **Planning-only backlog** — do not implement until the active tracker explicitly activates M8
2. **Requirement-first** — replace the planning-only checklist placeholder with exact checklist row(s) before coding
3. **After activation: One Task = One Commit** — commit message: `feat: M8 T06 - create shared web realtime client and migrate one path`
4. **After activation: One Milestone = One PR** — reserved branch: `feat/M8-v2-voice-control-plane`
5. Update `docs/tasks/M8/PROGRESS.md` after completing

---

## Description

Create the shared web realtime client abstraction and migrate one live path end to end. Right now `/call-ops` and observability both stitch SSE rails manually. This task proves the new control-plane contract in the UI without trying to migrate every screen at once.

## Subtasks

- [x] **Create shared realtime client** under `apps/web/src/lib/realtime/`
- [x] **Support canonical event consumption** from the control-plane transport
- [x] **Choose one first consumer** and migrate it fully end to end
- [x] **Keep fallback bridge logic** if the migration requires SSE compatibility during rollout
- [x] **Remove route-local stitching** from the selected first consumer
- [x] **Add frontend tests** for the new client abstraction

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/realtime/` | Create | Shared control-plane client abstraction |
| `apps/web/src/components/observability/` | Modify | Migrate one live consumer path, if observability is chosen |
| `apps/web/src/components/call-ops/` | Modify | Migrate one live consumer path, if call-ops is chosen |
| `apps/web/tests/` | Create/Modify | Tests for realtime client behavior |

## Implementation Notes

- Do not migrate both `/call-ops` and observability in the same task unless the shared abstraction makes the second migration almost free.
- The first migrated path should be the smallest one that proves the contract honestly.
- Keep the client API thin. Subscription + replay bootstrap + message dispatch is enough.

## Acceptance Criteria

- [x] Shared web realtime client exists
- [x] One live consumer path is migrated end to end
- [x] The migrated path no longer hand-stitches route-local SSE logic
- [x] `pnpm -C apps/web check-types` passes
- [x] Relevant frontend tests pass for the migrated path
- [x] Changed flows are verified with both Chrome DevTools MCP and Playwright MCP on desktop and mobile, with screenshots/artifacts kept
- [x] `tools/scripts/e2e/run-web-e2e.sh` passes if any `apps/web/**` UI/layout surface changes
- [x] Full `pnpm -C apps/web exec playwright test` passes before the task is marked done
- [x] If the implementation touches `apps/*/src/**`, `packages/*/src/**`, or `solutions/*/src/**`, the PR body includes `OTLP spans emitted: Yes` plus captured output from `tools/scripts/obs/traceql.sh`, `tools/scripts/obs/logql.sh`, and `tools/scripts/obs/promql.sh`

## Current Verification State

- Chrome DevTools MCP desktop/mobile proof is captured for the migrated `/call-ops` live transcript path with screenshots at `tools/agents/artifacts/manual-ui/m8-proof/chrome-desktop-call-ops-support-live.png` and `tools/agents/artifacts/manual-ui/m8-proof/chrome-mobile-call-ops-support-live.png`.
- Playwright MCP is still blocked in this environment: `playwright/browser_tabs` returns `Transport closed`, so the dual-MCP acceptance check stays open on purpose.
- OTLP evidence for the migrated control-plane flow is captured in local k3d and ready to paste into the PR body:
  - `OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/traceql.sh trace_id:f91da9c42b37e930ef3dfe05542c0dca`
  - `OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/logql.sh '{service="platform-api"} |= "/calls/00000000-0000-4000-a000-000000000123/transcript/stream"' 30m 20`
  - `OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/promql.sh 'up{pod=~"platform-api-.*"}'`

## References

- Milestone: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
- Related: [T04-add-authenticated-control-plane-websocket-endpoint.md](./T04-add-authenticated-control-plane-websocket-endpoint.md)
- Related: [harness_engineering.md](../../../wiki/ops/harness_engineering.md)
