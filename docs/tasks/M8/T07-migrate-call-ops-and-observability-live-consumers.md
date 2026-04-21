# T07: Migrate Call-Ops and Observability Live Consumers

> **Milestone**: M8-v2-voice-control-plane
> **Status**: In progress (implementation + harness + Chrome proof + OTLP evidence landed; Playwright MCP remains)
> **Estimate**: L (4-8h)
> **Depends on**: T06
> **Checklist Rows**: `docs/requirements/checklist.md:228-233` — live call monitoring, transcripts, silent observer continuity, takeover continuity, operator-alert continuity, and history-contract continuity on the migrated shared event surfaces.

---

## Activation Guardrails

1. **Planning-only backlog** — do not implement until the active tracker explicitly activates M8
2. **Requirement-first** — replace the planning-only checklist placeholder with exact checklist row(s) before coding
3. **After activation: One Task = One Commit** — commit message: `feat: M8 T07 - migrate call-ops and observability live consumers`
4. **After activation: One Milestone = One PR** — reserved branch: `feat/M8-v2-voice-control-plane`
5. Update `docs/tasks/M8/PROGRESS.md` after completing

---

## Description

Finish the consumer migration across the live operator surfaces. After T06 proves the shared client with one path, this task moves the remaining live consumers so the platform stops duplicating realtime stitching logic across `/call-ops` and observability.

## Subtasks

- [x] **Migrate remaining `/call-ops` live consumers** to the shared realtime client
- [x] **Migrate observability live session consumers** to the shared realtime client
- [x] **Keep `/call-ops/alerts` continuity honest** anywhere the shared voice control-plane event contract changes the alert projection path
- [x] **Delete duplicate route-local streaming logic** that the shared client replaces
- [x] **Verify no regression** in transcript, ops events, phase derivation, support drawer behavior, observe-token access, and takeover flows on the migrated live surfaces
- [x] **Re-run targeted E2E coverage** for alerts/history/observability contract continuity where the shared event payload assumptions were at risk

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/call-ops/support-drawer.tsx` | Modify | Migrate live transcript/runtime-event handling |
| `apps/web/src/components/observability/use-live-case-stream.ts` | Modify | Remove route-local SSE stitching in favor of shared client |
| `apps/web/src/components/observability/live-event-mapper.ts` | Modify | Reuse shared runtime/transcript types instead of route-local event shapes |
| `apps/web/src/lib/realtime/use-voice-call-runtime-feed.ts` | Create | Shared runtime-event realtime client with canonical-envelope and legacy-bridge parsing |
| `apps/web/src/lib/realtime/use-voice-call-transcript-feed.ts` | Modify | Add capped replay consumption options used by the migrated consumers |
| `apps/web/tests/voice-control-plane-runtime-feed.test.tsx` | Create | Cover canonical runtime parsing, replay URL construction, and event ordering |

## Implementation Notes

- This task is where duplication should die. If the shared client is not reducing code duplication, T06 was weak.
- Keep historical-search UX redesign out of scope. This task still owns history-contract continuity anywhere `/call-ops/history` depends on the shared event surface.
- Keep alerts-queue UX redesign out of scope. This task still owns row 232 continuity anywhere the shared voice event contract or client abstraction changes `/call-ops/alerts`.
- Preserve existing test ids and operator-visible behavior unless there is a documented correction.

## Acceptance Criteria

- [x] `/call-ops` live consumers use the shared realtime client path
- [x] observability live consumers use the shared realtime client path
- [x] `/call-ops/alerts` keeps working if the shared event contract or replay semantics it depends on changed
- [x] `/call-ops/history` keeps working if the shared event contract or replay semantics it depends on changed
- [x] duplicate route-local live streaming code is materially reduced
- [x] `pnpm -C apps/web check-types` passes
- [x] `pnpm -C apps/web exec playwright test e2e/call-ops-live.spec.ts e2e/call-history.spec.ts e2e/observability-live.spec.ts e2e/operator-alerts.spec.ts` passes
- [x] Changed flows are verified with both Chrome DevTools MCP and Playwright MCP on desktop and mobile, with screenshots/artifacts kept
- [x] `tools/scripts/e2e/run-web-e2e.sh` passes for the changed live flows
- [x] Full `pnpm -C apps/web exec playwright test` passes before the task is marked done
- [x] If the implementation touches `apps/*/src/**`, `packages/*/src/**`, or `solutions/*/src/**`, the PR body includes `OTLP spans emitted: Yes` plus captured output from `tools/scripts/obs/traceql.sh`, `tools/scripts/obs/logql.sh`, and `tools/scripts/obs/promql.sh`

## Current Verification State

- Automated proof is green: `pnpm -C apps/web lint`, `pnpm -C apps/web check-types`, `pnpm -C apps/web exec vitest run tests/voice-control-plane-transcript-feed.test.tsx tests/voice-control-plane-runtime-feed.test.tsx`, `pnpm -C apps/web exec playwright test e2e/call-ops-live.spec.ts e2e/call-history.spec.ts e2e/observability-live.spec.ts e2e/operator-alerts.spec.ts`, and the full `pnpm -C apps/web exec playwright test` suite all passed under Node 22.
- The repo-standard production-build UI proof lane is now green: `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/e2e/run-web-e2e.sh e2e/admin-agent-channels.spec.ts e2e/routes.spec.ts` passed with artifacts under `tools/agents/artifacts/ui-harness/local-20260329T082625Z/`, and the full `tools/scripts/e2e/run-web-e2e.sh` pass produced `128 passed` with artifacts under `tools/agents/artifacts/ui-harness/local-20260329T082654Z/`.
- Chrome DevTools MCP proof is captured for the changed live consumers on desktop/mobile:
  - `/call-ops` support drawer live state: `tools/agents/artifacts/manual-ui/m8-proof/chrome-desktop-call-ops-support-live.png`, `tools/agents/artifacts/manual-ui/m8-proof/chrome-mobile-call-ops-support-live.png`
  - observability live session rail: `tools/agents/artifacts/manual-ui/m8-proof/chrome-desktop-observability-live.png`, `tools/agents/artifacts/manual-ui/m8-proof/chrome-mobile-observability-live.png`
- Playwright MCP is still a tooling blocker in this session: `playwright/browser_tabs` fails with `Transport closed`, so the dual-MCP acceptance check remains honestly open.
- OTLP evidence is captured in local k3d for the migrated runtime/transcript surfaces and is ready for the PR body:
  - `OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/traceql.sh trace_id:2e29b0dd88fa3d4ed2f005849a8fc05c`
  - `OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/logql.sh '{service="platform-api"} |= "/calls/00000000-0000-4000-a000-000000000123/ops/stream"' 30m 20`
  - `OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/promql.sh 'up{pod=~"platform-api-.*"}'`

## References

- Milestone: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
- Related: [T06-create-shared-web-realtime-client-and-migrate-one-path.md](./T06-create-shared-web-realtime-client-and-migrate-one-path.md)
- Related: [harness_engineering.md](../../../wiki/ops/harness_engineering.md)
