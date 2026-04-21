# T04: Extract Shared Call Subscription Authorization Policy

> **Milestone**: M8.2-control-plane-refactor-hardening
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: None
> **Execution**: Completed on 2026-03-30 as its own task commit on milestone branch `feat/M8.2-control-plane-refactor-hardening`.
> **Checklist Rows**: `docs/requirements/checklist.md:228-233` — read/stream subscription access gates tenant call monitoring, transcripts, observe/takeover continuity, alerts, and historical/live event continuity.

---

## Activation Guardrails

1. **Activation satisfied** — M8.2/T04 was explicitly continued by the human on 2026-03-30
2. **Requirement-first** — revalidate checklist rows `228-233` before coding; access-policy scope may not widen beyond those reader surfaces without a new contract
3. **After activation: One Task = One Commit** — commit message: `feat: M8.2 T04 - extract call subscription authorization policy`
4. **Active branch** — `feat/M8.2-control-plane-refactor-hardening`
5. Update `docs/tasks/M8.2/PROGRESS.md` after completing

---

## Description

Call stream/read auth is still encoded too close to route handlers in the tenant call readers, and the parallel admin browser-voice stream surfaces are at risk of drifting the same way. Extract the policy into one shared access module now so tenant, admin, and persisted-call replay rules have a single source of truth.

## Subtasks

- [x] Define a shared call subscription authorization helper for live and persisted call readers
- [x] Centralize tenant/admin/super-admin fallback behavior
- [x] Reuse the helper from tenant call routes and admin browser-voice stream/read routes
- [x] Add regression tests for tenant mismatch and admin fallback cases

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/calls/subscription_access.py` | Create | Shared call subscription/access policy helpers |
| `apps/api/src/platform_api/routes/call_access.py` | Modify | Keep request-bound adapters thin over the shared Platform Core policy |
| `apps/api/src/platform_api/routes/calls_streams.py` | Modify | Reuse the shared policy for tenant transcript/ops stream access in the split route layout |
| `apps/api/src/platform_api/routes/browser_voice.py` | Modify | Reuse the same shared policy for admin browser-voice stream/read routes |
| `apps/api/src/platform_api/routes/control_plane.py` | Modify | Reuse the shared tenant/admin auth selection for control-plane socket subscriptions |
| `apps/api/tests/integration/test_browser_voice_streams.py` | Create/Modify | Cover admin browser-voice stream/read auth parity |
| `packages/platform-core/tests/unit/test_calls/test_subscription_access.py` | Create | Cover shared policy resolution and active-vs-persisted access behavior |

## Implementation Notes

- Keep the authorization policy in Platform Core. Route modules should adapt request/context state into that shared helper, not own the policy themselves.
- The shared helper should answer "may this caller subscribe to this call surface?" and nothing more.
- Preserve the super-admin tenant override behavior that M8 had to fix.
- Include the admin browser-voice stream/read path explicitly; otherwise the repo keeps two policy owners by accident.

## Current Plan

1. Move call-subscription access checks out of route-local code into `packages/platform-core/src/platform_core/calls/subscription_access.py`.
2. Keep `apps/api/src/platform_api/routes/call_access.py` as a thin request adapter over the shared policy so existing route imports do not sprawl.
3. Reuse the shared policy from tenant call stream/read routes, admin browser-voice stream/read routes, and the control-plane websocket fallback path.
4. Add focused unit coverage for the shared policy plus integration coverage for browser-voice admin parity and existing control-plane fallback behavior.

## Outcome

1. Shared subscription/read access now lives in `packages/platform-core/src/platform_core/calls/subscription_access.py` and covers persisted-or-active call checks plus tenant/admin auth selection.
2. `apps/api/src/platform_api/routes/call_access.py` now adapts request state into the shared helper instead of owning access policy locally.
3. Tenant transcript streaming, admin browser-voice event/stream readers, and control-plane websocket auth selection now reuse the same shared policy path.
4. Focused unit and integration tests now lock tenant mismatch, admin fallback, and admin browser-voice read/stream parity.

## Acceptance Criteria

- [x] Tenant call routes and admin browser-voice stream/read routes use one shared call-subscription authorization policy
- [x] Tenant mismatch plus admin fallback behavior is regression-tested
- [x] Admin browser-voice transcript/ops/test-history auth behavior has real integration coverage
- [x] No route keeps a separate copy of persisted-or-active call access rules

## Verification Evidence

```bash
uv run ruff check apps/api/src/platform_api/routes/browser_voice.py apps/api/src/platform_api/routes/call_access.py apps/api/src/platform_api/routes/calls_streams.py apps/api/src/platform_api/routes/control_plane.py packages/platform-core/src/platform_core/calls/subscription_access.py packages/platform-core/tests/unit/test_calls/test_subscription_access.py apps/api/tests/integration/test_browser_voice_streams.py
uv run ruff format apps/api/src/platform_api/routes/browser_voice.py apps/api/src/platform_api/routes/call_access.py apps/api/src/platform_api/routes/calls_streams.py apps/api/src/platform_api/routes/control_plane.py packages/platform-core/src/platform_core/calls/subscription_access.py packages/platform-core/tests/unit/test_calls/test_subscription_access.py apps/api/tests/integration/test_browser_voice_streams.py --check
uv run pyright -p pyrightconfig.ci.json
uv run pytest packages/platform-core/tests/unit/test_calls/test_subscription_access.py apps/api/tests/integration/test_browser_voice_streams.py apps/api/tests/integration/test_control_plane_websocket.py apps/api/tests/integration/test_calls_transcript_stream.py -q --tb=short
```

Expected results recorded on 2026-03-30:

- Ruff check: passed
- Ruff format `--check`: passed
- Pyright: `0 errors, 0 warnings, 0 informations`
- Pytest: `15 passed`

## References

- Milestone: [M8.2-control-plane-refactor-hardening.md](../../milestones/M8.2-control-plane-refactor-hardening.md)
- Related: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
