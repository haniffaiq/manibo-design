# T07: Move call-ops core routes into `routes/call_ops`

> **Milestone**: M36-platform-api-route-topology-phase1
> **Status**: Completed
> **Estimate**: L (4-8h)
> **Depends on**: T01

---

## Description

Create the `routes/call_ops` package for the core call-operations surface and move the call aggregation and core call route/support modules under it. This is the structural base that T08 will extend with the admin and browser call surfaces.

## Subtasks

- [x] **Create `routes/call_ops/`**: add the domain package and introduce `router.py` as the new home of the current `calls.py` aggregation logic.
- [x] **Move the call-ops core implementations**: relocate `call_access.py`, `call_takeover.py`, `calls_history.py`, `calls_live.py`, `calls_observability.py`, `calls_streams.py`, and `calls_test_call.py`.
- [x] **Keep compatibility shims**: preserve `calls.py` plus the moved flat module filenames as thin re-export shims.
- [x] **Preserve aggregator behavior exactly**: the same sub-routers must still mount under the same `/calls` prefixes after the move.
- [x] **Retain architecture proof**: keep `tests/architecture/test_m8_2_refactor_guards.py` and any call-routing tests green after the regroup.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/call_ops/` | Create | Domain package for core call-ops route/support implementations |
| `apps/api/src/platform_api/routes/calls.py` | Modify | Compatibility shim to `routes.call_ops.router` |
| `apps/api/src/platform_api/routes/call_access.py` | Modify | Compatibility shim to `routes.call_ops.call_access` |
| `apps/api/src/platform_api/routes/call_takeover.py` | Modify | Compatibility shim to `routes.call_ops.call_takeover` |
| `apps/api/src/platform_api/routes/calls_history.py` | Modify | Compatibility shim to `routes.call_ops.calls_history` |
| `apps/api/src/platform_api/routes/calls_live.py` | Modify | Compatibility shim to `routes.call_ops.calls_live` |
| `apps/api/src/platform_api/routes/calls_observability.py` | Modify | Compatibility shim to `routes.call_ops.calls_observability` |
| `apps/api/src/platform_api/routes/calls_streams.py` | Modify | Compatibility shim to `routes.call_ops.calls_streams` |
| `apps/api/src/platform_api/routes/calls_test_call.py` | Modify | Compatibility shim to `routes.call_ops.calls_test_call` |
| `apps/api/src/platform_api/main.py` | Modify selectively | Preserve import and mount behavior for call routes |
| `tests/architecture/test_m8_2_refactor_guards.py` | Modify if needed | Keep existing refactor-hardening assertions green after the move |
| `apps/api/tests/` | Modify/Create | Focused coverage for call-route aggregation and `/calls` mounting |

## Implementation Notes

- Planning-only task. Do not execute until the human explicitly activates M36.
- `calls.py` is not a trivial file move. Treat its aggregation behavior as part of the API topology contract.
- Do not merge T08 scope into this task. This slice is only the core call routes plus their direct support modules.
- Preserve the same router-factory names so `platform_api.main` and any tests keep working without semantic edits.

## Acceptance Criteria

- [x] The core call-ops implementations live under `routes/call_ops/`.
- [x] `calls.py` becomes a thin shim to the new `call_ops.router`.
- [x] The `/calls` route aggregation and mounting behavior remain unchanged.
- [x] Existing call-route architecture tests remain green after the move.

## Verification

```bash
uv run ruff check \
  apps/api/src/platform_api/routes/call_ops \
  apps/api/src/platform_api/routes/calls.py \
  apps/api/src/platform_api/routes/call_access.py \
  apps/api/src/platform_api/routes/call_takeover.py \
  apps/api/src/platform_api/routes/calls_history.py \
  apps/api/src/platform_api/routes/calls_live.py \
  apps/api/src/platform_api/routes/calls_observability.py \
  apps/api/src/platform_api/routes/calls_streams.py \
  apps/api/src/platform_api/routes/calls_test_call.py \
  apps/api/src/platform_api/main.py \
  tests/architecture/test_m8_2_refactor_guards.py \
  apps/api/tests

uv run pyright \
  apps/api/src/platform_api/routes/call_ops \
  apps/api/src/platform_api/main.py

uv run pytest \
  tests/architecture/test_m8_2_refactor_guards.py \
  apps/api/tests/integration/test_calls.py \
  apps/api/tests/integration/test_calls_history.py \
  apps/api/tests/integration/test_call_ops_stream.py \
  apps/api/tests/integration/test_call_runtime_snapshot.py \
  apps/api/tests/integration/test_call_latency.py \
  apps/api/tests/integration/test_calls_transcript_stream.py \
  apps/api/tests/integration/test_calls_takeover.py \
  apps/api/tests/integration/test_telnyx_webhook_observability.py \
  apps/api/tests/integration/test_recordings.py \
  apps/api/tests/unit/test_calls_active_pagination.py \
  apps/api/tests/unit/test_calls_list_query.py \
  apps/api/tests/unit/test_calls_operator_test_call.py \
  apps/api/tests/unit/test_calls_transcript_stream_backoff.py \
  -q --tb=short
```

## References

- Milestone: [M36-platform-api-route-topology-phase1.md](../../milestones/M36-platform-api-route-topology-phase1.md)
- Design: `wiki/queries/2026-04-11-design-platform-api-route-topology-refactor.md`
