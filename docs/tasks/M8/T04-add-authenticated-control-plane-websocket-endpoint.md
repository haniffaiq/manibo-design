# T04: Add Authenticated Control-Plane WebSocket Endpoint

> **Milestone**: M8-v2-voice-control-plane
> **Status**: Complete
> **Estimate**: L (4-8h)
> **Depends on**: T01, T02, T03
> **Checklist Rows**: `docs/requirements/checklist.md:228-233` — live call monitoring, transcripts, silent observer, takeover, operator alerts, and live/historical event-contract continuity.

---

## Activation Guardrails

1. **Planning-only backlog** — do not implement until the active tracker explicitly activates M8
2. **Requirement-first** — replace the planning-only checklist placeholder with exact checklist row(s) before coding
3. **After activation: One Task = One Commit** — commit message: `feat: M8 T04 - add authenticated control-plane websocket endpoint`
4. **After activation: One Milestone = One PR** — reserved branch: `feat/M8-v2-voice-control-plane`
5. Update `docs/tasks/M8/PROGRESS.md` after completing

---

## Description

Add the first authenticated WebSocket endpoint for the control plane. This is the canonical bidirectional transport for full V2, but it must sit on top of the typed envelope and durable command model, not bypass them.

## Subtasks

- [x] **Add control-plane route** in `apps/api/src/platform_api/routes/control_plane.py`
- [x] **Authenticate and authorize socket connections** for tenant scope plus the existing admin/deployment read-model consumers that share the voice control-plane contract
- [x] **Support subscription to the initial voice topics** needed by the first migrated consumer
- [x] **Emit canonical envelopes** from the existing replayable rails
- [x] **Support replay bootstrap** from a supplied cursor/sequence boundary
- [x] **Add integration tests** for auth, replay bootstrap, and live event delivery

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/control_plane.py` | Create | Canonical authenticated control-plane WebSocket route |
| `apps/api/src/platform_api/main.py` | Modify | Mount control-plane route |
| `packages/platform-core/src/platform_core/control_plane/` | Modify | Shared transport helpers if needed |
| `apps/api/tests/integration/` | Create/Modify | WebSocket auth/replay/live-delivery tests |

## Implementation Notes

- Start with the voice topics already used by tenant plus existing admin/deployment read-model consumers. Do not broaden into unrelated multi-topic multiplexing in the first commit.
- Realtime transport is not the business authority. It projects durable truth and accepted commands.
- Keep the transport contract narrow: subscribe, replay bootstrap, event delivery.
- Do not move all consumers in the same task. One transport endpoint is enough here.
- API inventory only validates HTTP/SSE `APIRoute` surfaces today. WebSocket transport must be proven by dedicated WebSocket contract tests until inventory tooling grows websocket support.
- If HTTP/SSE companion route inventory or consumer ownership changes, regenerate and verify the generated API inventory before marking this task done.

## Acceptance Criteria

- [x] Authenticated tenant WebSocket endpoint exists
- [x] WebSocket emits canonical control-plane envelopes
- [x] Replay bootstrap from a cursor/sequence boundary works
- [x] Unauthorized clients are rejected correctly
- [x] Existing admin/deployment read-model consumers of the shared voice contract stay authorized correctly
- [x] `uv run pytest apps/api/tests/integration/test_control_plane_websocket.py -q --tb=short` passes
- [x] If HTTP/SSE companion routes or consumer ownership change, `uv run python tools/scripts/generate_api_inventory.py` runs after the route lands
- [x] If HTTP/SSE companion routes or consumer ownership change, `uv run python tools/scripts/check_api_inventory.py` passes
- [x] If the implementation touches `apps/*/src/**`, `packages/*/src/**`, or `solutions/*/src/**`, the PR body includes `OTLP spans emitted: Yes` plus captured output from `tools/scripts/obs/traceql.sh`, `tools/scripts/obs/logql.sh`, and `tools/scripts/obs/promql.sh`

## References

- Milestone: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
- Related: [T02-add-command-record-and-lifecycle-model.md](./T02-add-command-record-and-lifecycle-model.md)
