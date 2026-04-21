# T08: Move call-ops admin and browser routes into `routes/call_ops`

> **Milestone**: M36-platform-api-route-topology-phase1
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T07

---

## Description

Extend the `routes/call_ops` package created in T07 to absorb the remaining call-operations admin, browser, recording, and event surfaces. This finishes the call-ops domain regroup without changing any runtime behavior.

## Subtasks

- [x] **Move remaining call-ops implementations**: relocate `admin_calls.py`, `browser_voice.py`, `control_plane.py`, `recordings.py`, `operator_events.py`, and `audit_events.py` under `routes/call_ops/`.
- [x] **Keep top-level compatibility shims**: preserve the original flat module imports as thin re-exports to the moved implementations.
- [x] **Preserve current factory wiring**: keep the same route factories mounted from `platform_api.main` after the move.
- [x] **Retain proof for event and recording surfaces**: keep or add focused tests for browser voice, operator/audit events, and recording route wiring after the regroup.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/call_ops/` | Modify | Extend the domain package with the remaining call-ops route implementations |
| `apps/api/src/platform_api/routes/admin_calls.py` | Modify | Compatibility shim to `routes.call_ops.admin_calls` |
| `apps/api/src/platform_api/routes/browser_voice.py` | Modify | Compatibility shim to `routes.call_ops.browser_voice` |
| `apps/api/src/platform_api/routes/control_plane.py` | Modify | Compatibility shim to `routes.call_ops.control_plane` |
| `apps/api/src/platform_api/routes/recordings.py` | Modify | Compatibility shim to `routes.call_ops.recordings` |
| `apps/api/src/platform_api/routes/operator_events.py` | Modify | Compatibility shim to `routes.call_ops.operator_events` |
| `apps/api/src/platform_api/routes/audit_events.py` | Modify | Compatibility shim to `routes.call_ops.audit_events` |
| `apps/api/src/platform_api/main.py` | Modify selectively | Preserve current imports and route mounting behavior |
| `apps/api/tests/` | Modify/Create | Focused coverage for browser voice, recording, and event route wiring |

## Implementation Notes

- Planning-only task. Do not execute until the human explicitly activates M36.
- This task depends on T07 because both slices share the same `routes/call_ops/` package. Do not build two competing layouts.
- Do not change the control-plane or recording semantics here. Keep this slice purely structural.
- `operator_events.py` and `audit_events.py` rely on shared span-correlation helpers; keep those imports working until T09 moves the observability support package.

## Acceptance Criteria

- [x] The remaining call-ops admin/browser/event files live under `routes/call_ops/`.
- [x] The original flat filenames remain as compatibility shims.
- [x] Main route wiring and focused browser/event/recording tests remain green after the move.

## Verification

```bash
uv run ruff check \
  apps/api/src/platform_api/routes/call_ops \
  apps/api/src/platform_api/routes/admin_calls.py \
  apps/api/src/platform_api/routes/browser_voice.py \
  apps/api/src/platform_api/routes/control_plane.py \
  apps/api/src/platform_api/routes/recordings.py \
  apps/api/src/platform_api/routes/operator_events.py \
  apps/api/src/platform_api/routes/audit_events.py \
  apps/api/src/platform_api/routes/calls_observability.py \
  apps/api/src/platform_api/main.py \
  apps/api/tests

uv run pyright \
  apps/api/src/platform_api/routes/call_ops \
  apps/api/src/platform_api/main.py

uv run pytest \
  apps/api/tests/integration/test_browser_voice_runtime_security.py \
  apps/api/tests/integration/test_browser_voice_streams.py \
  apps/api/tests/integration/test_control_plane_websocket.py \
  apps/api/tests/integration/test_operator_events.py \
  apps/api/tests/integration/test_audit_events.py \
  apps/api/tests/integration/test_recordings.py \
  apps/api/tests/unit/test_browser_voice.py \
  apps/api/tests/unit/test_span_correlation_routes.py \
  -q --tb=short
```

## References

- Milestone: [M36-platform-api-route-topology-phase1.md](../../milestones/M36-platform-api-route-topology-phase1.md)
- Design: `wiki/queries/2026-04-11-design-platform-api-route-topology-refactor.md`
