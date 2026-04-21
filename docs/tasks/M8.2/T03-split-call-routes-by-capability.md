# T03: Split Call Routes By Capability

> **Milestone**: M8.2-control-plane-refactor-hardening
> **Status**: Completed
> **Estimate**: L (4-8h)
> **Depends on**: T02
> **Execution**: Completed on 2026-03-30 on branch `feat/M8.2-T03-split-call-routes-by-capability`.
> **Checklist Rows**: `docs/requirements/checklist.md:228-233` — call monitoring, transcripts, observe/takeover flows, alerts, and history continuity all depend on the route split preserving the same public surfaces.

---

## Activation Guardrails

1. **Activation satisfied** — T03 was explicitly continued by the human on 2026-03-30
2. **Requirement-first** — revalidate checklist rows `228-233` before coding; route/API changes must preserve inventory and consumer ownership proof
3. **After activation: One Task = One Commit** — commit message: `feat: M8.2 T03 - split call routes by capability`
4. **Active branch** — `feat/M8.2-T03-split-call-routes-by-capability`
5. Update `docs/tasks/M8.2/PROGRESS.md` after completing

---

## Description

After projection/query logic is extracted, the route layer still needs to stop pretending one file should own live call APIs, history/detail APIs, streams, observability, and admin wrappers. Split the tenant call routes by capability, and align the parallel admin browser-voice stream surfaces to the same shared helpers, so each module has one reason to change.

## Subtasks

- [x] Split the existing `calls.py` handlers into capability-specific route modules
- [x] Keep route registration and import wiring simple
- [x] Pull the admin browser-voice transcript/ops stream surfaces onto the same shared stream helpers or document an explicit out-of-scope follow-on
- [x] Move admin wrappers out of the tenant call route module
- [x] Regenerate and verify API inventory after the split
- [x] Preserve all public routes and OpenAPI response contracts

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/calls_live.py` | Create | Active-call and live workflow handlers |
| `apps/api/src/platform_api/routes/calls_history.py` | Create | Historical call detail and recordings handlers |
| `apps/api/src/platform_api/routes/calls_streams.py` | Create | Transcript and ops stream handlers |
| `apps/api/src/platform_api/routes/calls_observability.py` | Create | Tenant-scoped observability handlers |
| `apps/api/src/platform_api/routes/admin_calls.py` | Create/Modify | Admin call wrappers over shared services |
| `apps/api/src/platform_api/routes/browser_voice.py` | Modify | Reuse the shared stream/read helpers for admin browser-voice stream surfaces |
| `apps/api/src/platform_api/routes/calls.py` | Modify | Reduce to minimal router assembly or remove if a package layout is cleaner |
| `apps/api/tests/integration/test_browser_voice_streams.py` | Create | Cover admin browser-voice transcript/ops/test-history continuity after the split |
| `docs/arch/generated/api_inventory.md` | Modify | Regenerated route inventory after the split |

## Implementation Notes

- Do not split by arbitrary line count. Split by capability ownership.
- The admin browser-voice stream endpoints are real surfaces too. Do not let them drift as a second stream/auth implementation by omission.
- Keep route helpers local to the capability module unless they are genuinely shared.
- A tiny bootstrap file is acceptable. Another junk drawer is not.

## Current Split Plan

1. Create capability route modules for live, history, streams, observability, and admin calls.
2. Leave `apps/api/src/platform_api/routes/calls.py` as a thin assembly root that includes those subrouters and preserves the `/calls` and `/admin/calls` surfaces.
3. Reuse the split stream/read helpers from `calls_*` modules inside `apps/api/src/platform_api/routes/browser_voice.py` for admin transcript/ops/event parity instead of maintaining a second implementation.
4. Regenerate `docs/arch/generated/api_inventory.md` and verify it after the split.

## Result

T03 completed with capability-owned route modules:

1. `apps/api/src/platform_api/routes/calls_live.py` now owns active-call listing/detail, live events, LiveKit token minting, and takeover endpoints.
2. `apps/api/src/platform_api/routes/calls_history.py` now owns historical list/detail and recordings endpoints.
3. `apps/api/src/platform_api/routes/calls_streams.py` now owns transcript and ops SSE handlers plus the shared stream builders reused by `browser_voice.py`.
4. `apps/api/src/platform_api/routes/calls_observability.py` now owns tenant observability summary, latency, events, and trace handlers.
5. `apps/api/src/platform_api/routes/admin_calls.py` now owns deployment-scoped admin wrappers.
6. `apps/api/src/platform_api/routes/calls.py` is reduced to thin router assembly only.
7. `apps/api/src/platform_api/routes/browser_voice.py` now reuses the shared stream/event helpers instead of carrying a second admin implementation.

## Acceptance Criteria

- [x] Call routes are grouped by capability instead of one `calls.py` monolith
- [x] Admin browser-voice stream/read routes either reuse the same shared helpers or have an explicit deferred follow-on documented
- [x] Admin browser-voice transcript/ops/test-history surfaces have real integration coverage after the split
- [x] All existing route paths remain stable
- [x] Generated API inventory remains accurate and passes verification
- [x] Route modules are thin and mostly orchestration, not projection logic

## Verification

- `uv run pytest apps/api/tests/unit/test_calls_list_query.py apps/api/tests/unit/test_calls_active_pagination.py apps/api/tests/unit/test_calls_transcript_stream_backoff.py apps/api/tests/integration/test_calls.py apps/api/tests/integration/test_calls_history.py apps/api/tests/integration/test_recordings.py apps/api/tests/integration/test_calls_takeover.py apps/api/tests/integration/test_call_runtime_snapshot.py apps/api/tests/integration/test_call_events.py apps/api/tests/integration/test_call_latency.py apps/api/tests/integration/test_calls_transcript_stream.py apps/api/tests/integration/test_call_ops_stream.py apps/api/tests/integration/test_browser_voice_streams.py -q --tb=short`
- `uv run pyright -p pyrightconfig.ci.json`
- `uv run ruff check apps/api/src/platform_api/routes/calls.py apps/api/src/platform_api/routes/admin_calls.py apps/api/src/platform_api/routes/calls_history.py apps/api/src/platform_api/routes/calls_live.py apps/api/src/platform_api/routes/calls_observability.py apps/api/src/platform_api/routes/calls_streams.py apps/api/src/platform_api/routes/browser_voice.py apps/api/tests/integration/test_browser_voice_streams.py apps/api/tests/integration/test_call_runtime_snapshot.py apps/api/tests/unit/test_calls_list_query.py apps/api/tests/unit/test_calls_active_pagination.py apps/api/tests/unit/test_calls_transcript_stream_backoff.py`
- `uv run ruff format apps/api/src/platform_api/routes/calls.py apps/api/src/platform_api/routes/admin_calls.py apps/api/src/platform_api/routes/calls_history.py apps/api/src/platform_api/routes/calls_live.py apps/api/src/platform_api/routes/calls_observability.py apps/api/src/platform_api/routes/calls_streams.py apps/api/src/platform_api/routes/browser_voice.py apps/api/tests/integration/test_browser_voice_streams.py apps/api/tests/integration/test_call_runtime_snapshot.py apps/api/tests/unit/test_calls_list_query.py apps/api/tests/unit/test_calls_active_pagination.py apps/api/tests/unit/test_calls_transcript_stream_backoff.py --check`
- `uv run python tools/scripts/generate_api_inventory.py`
- `uv run python tools/scripts/check_api_inventory.py`

## References

- Milestone: [M8.2-control-plane-refactor-hardening.md](../../milestones/M8.2-control-plane-refactor-hardening.md)
- Related: [T02-extract-call-observability-projection-service.md](./T02-extract-call-observability-projection-service.md)
