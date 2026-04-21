# T08: Align Admin Browser-Voice Live Consumers With The Shared Control-Plane Client

> **Milestone**: M8.2-control-plane-refactor-hardening
> **Status**: Completed
> **Estimate**: S (1-3h)
> **Depends on**: T03, T04
> **Execution**: Completed on 2026-03-30 on milestone branch `feat/M8.2-control-plane-refactor-hardening` as commit `feat: M8.2 T08 - align admin browser-voice live consumers with the shared control-plane client`.
> **Checklist Rows**: `docs/requirements/checklist.md:228-233` — live call monitoring, transcripts, observe/takeover continuity, alerts, and history continuity are the only UI surfaces this client refactor is allowed to touch.

---

## Activation Guardrails

1. **Planning-only backlog** — do not implement until the active tracker explicitly activates M8.2
2. **Requirement-first** — revalidate checklist rows `228-233` before coding; inventory and consumer proof must stay explicit for UI/API-facing transport changes
3. **After activation: One Task = One Commit** — commit message: `feat: M8.2 T08 - align admin browser-voice live consumers with the shared control-plane client`
4. **After activation: One Milestone = One PR** — reserved branch: `feat/M8.2-control-plane-refactor-hardening`
5. Update `docs/tasks/M8.2/PROGRESS.md` after completing
6. **Do not re-own M8** — M8 T06/T07 own shared-client creation and tenant live-consumer migration. This task is only for the admin/browser-voice straggler surfaces and any tiny cleanup directly attached to them.

---

## Description

M8 owns the shared control-plane client plus the tenant live-consumer migration. T08 is the narrow post-M8 cleanup slice: align the admin/browser-voice live consumer with that shipped client boundary, delete any browser-voice-specific route-local transport glue that remains, and keep the repo from carrying a second live-client abstraction for the same stream contract.

## Subtasks

- [x] Confirm the shared client shipped by M8 and the current admin/browser-voice live-consumer path on the target branch
- [x] Align the admin browser-voice live consumer path to the shared client boundary
- [x] Delete remaining browser-voice-specific route-local SSE URL construction and payload fallback parsing
- [x] Add direct frontend tests for any browser-voice-specific adapter/client behavior touched by the cleanup
- [x] Regenerate inventory/scanner outputs so the admin browser-voice stream endpoints show explicit known consumers after the cleanup
- [x] Capture required Chrome DevTools MCP and Playwright MCP proof on desktop and mobile, keep screenshots/artifacts, and run the full `apps/web` Playwright suite plus `tools/scripts/e2e/run-web-e2e.sh`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/realtime/voice-control-plane-client.ts` | Create | Shared admin/tenant stream scope, replay URL, and bridge parsing boundary |
| `apps/web/src/lib/realtime/use-voice-call-transcript-feed.ts` | Modify | Reuse the shared client for transcript stream replay/parsing |
| `apps/web/src/lib/realtime/use-voice-call-runtime-feed.ts` | Modify | Reuse the shared client for runtime stream replay/parsing |
| `apps/web/src/components/observability/use-live-case-stream.ts` | Modify | Pass shared stream scope instead of raw route strings |
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/test/page.tsx` | Modify | Keep the admin browser-voice live consumer aligned to the shared client boundary |
| `apps/web/tests/voice-control-plane-client.test.ts` | Create or Modify | Verify browser-voice shared client and SSE adapter behavior directly |
| `apps/web/tests/voice-control-plane-transcript-feed.test.tsx` | Modify | Keep transcript hook coverage aligned to tenant/admin shared scope |
| `apps/web/tests/voice-control-plane-runtime-feed.test.tsx` | Modify | Keep runtime hook coverage aligned to tenant/admin shared scope |
| `apps/web/e2e/agent-test-workbench.spec.ts` | Modify | Verify admin browser-voice live consumer continuity if its stream client path changes |
| `tools/scripts/api_inventory_lib.py` | Modify | Keep the inventory scanner aware of the admin browser-voice consumer path after cleanup |
| `docs/arch/generated/api_inventory.md` | Regenerate | Verify known-consumer inventory proof for the admin browser-voice stream endpoints |

## Implementation Notes

- Do not smuggle websocket transport backlog or tenant live-consumer migration into this task. Those belong to M8.
- Reuse the shared client shipped by M8. If that client path is ugly, fix it there rather than creating a browser-voice-specific wrapper.
- Client consumers should not build route strings or parse legacy payload quirks directly.
- Include the admin browser-voice live consumer. Do not leave this task with an explicit defer note; the whole point is to close that straggler seam after M8.
- Keep transcript/runtime specialization above the transport layer and below UI components.
- Inventory and consumer proof must stay explicit: if the shared-client cleanup hides the browser-voice consumer from the scanner, update the inventory tooling instead of accepting a false “no known consumer” report.
- Because this task touches `apps/web/**`, completion requires Chrome DevTools MCP + Playwright MCP verification on desktop and mobile, screenshots/artifacts, the full `pnpm -C apps/web exec playwright test` suite, and `tools/scripts/e2e/run-web-e2e.sh`.

## Acceptance Criteria

- [x] No touched admin/browser-voice live consumer constructs stream URLs or parses bridge quirks directly
- [x] The admin browser-voice live consumer uses the shared control-plane client boundary shipped by M8
- [x] Direct shared-client/adapter tests plus the touched admin browser-voice proof remain green after cleanup
- [x] Regenerated inventory/scanner output shows known consumers for the admin browser-voice stream endpoints after the cleanup
- [x] Chrome DevTools MCP + Playwright MCP desktop/mobile proof, screenshots/artifacts, the full `apps/web` Playwright suite, and `tools/scripts/e2e/run-web-e2e.sh` are all part of the completion bundle

## Completion Notes

1. The real shared-client boundary on this branch is now `apps/web/src/lib/realtime/voice-control-plane-client.ts`. It owns tenant/admin stream scope typing, transcript/runtime replay URL construction, and canonical-plus-legacy bridge parsing. T08 did not invent a second wrapper; it pulled the remaining transport logic out of the individual feed hooks.
2. `apps/web/src/lib/realtime/use-voice-call-transcript-feed.ts` and `apps/web/src/lib/realtime/use-voice-call-runtime-feed.ts` now delegate shared URL/parsing behavior to that module, and `apps/web/src/components/observability/use-live-case-stream.ts` passes a typed `streamScope` instead of a raw base-path string.
3. The admin browser-voice consumer at `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/test/page.tsx` now passes `adminTenantVoiceControlPlaneStreamScope(tenantId)` instead of constructing `/api/platform/admin/tenants/.../calls` directly.
4. Direct client coverage now lives in `apps/web/tests/voice-control-plane-client.test.ts`, while the existing transcript/runtime feed tests were updated to assert tenant and admin shared-scope replay URLs. `apps/web/e2e/agent-test-workbench.spec.ts` now proves the admin workbench renders live transcript and runtime events from the shared client path.
5. `tools/scripts/api_inventory_lib.py` was updated because the scanner used to only infer SSE consumers from files that directly called `useSseStream()`. That was garbage once the shared client owned the `/stream` literals. Regenerated inventory now records `web` as the known consumer for both admin browser-voice stream endpoints.
6. Completion proof included:
   - `pnpm -C apps/web lint`
   - `pnpm -C apps/web check-types`
   - `pnpm -C apps/web exec vitest run tests/voice-control-plane-client.test.ts tests/voice-control-plane-transcript-feed.test.tsx tests/voice-control-plane-runtime-feed.test.tsx`
   - `pnpm -C apps/web exec playwright test e2e/agent-test-workbench.spec.ts`
   - `pnpm -C apps/web exec playwright test`
   - `tools/scripts/e2e/run-web-e2e.sh`
   - Playwright MCP desktop/mobile screenshots on the admin test workbench after transcript/runtime replay
   - Chrome DevTools MCP desktop/mobile screenshots on the same admin test workbench flow
   - Web UI harness artifacts at `tools/agents/artifacts/ui-harness/local-20260330T104622Z`

## References

- Milestone: [M8.2-control-plane-refactor-hardening.md](../../milestones/M8.2-control-plane-refactor-hardening.md)
- Related: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
