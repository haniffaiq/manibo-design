# T02: Extract Call Observability Projection Service From `calls.py`

> **Milestone**: M8.2-control-plane-refactor-hardening
> **Status**: Completed
> **Estimate**: L (4-8h)
> **Depends on**: None
> **Execution**: Completed on 2026-03-30 on branch `feat/M8.2-T02-call-observability-projection`.
> **Checklist Rows**: `docs/requirements/checklist.md:228-233` — observability summary, live/historical event continuity, and transcript/call monitoring projections depend on this route logic staying coherent.

---

## Activation Guardrails

1. **Activation satisfied** — M8.2/T02 was explicitly continued by the human on 2026-03-30
2. **Requirement-first** — revalidate checklist rows `228-233` before coding; if scope widens, update the task contract first
3. **After activation: One Task = One Commit** — commit message: `feat: M8.2 T02 - extract call observability projection service`
4. **Active branch** — `feat/M8.2-T02-call-observability-projection`
5. Update `docs/tasks/M8.2/PROGRESS.md` after completing

---

## Description

`apps/api/src/platform_api/routes/calls.py` currently owns data coercion, trace-context parsing, stack/latency synthesis, hotspot ranking, and response assembly. That logic is not HTTP routing. Extract it into shared projection/query helpers so route handlers stop being the only place where call observability semantics exist.

## Subtasks

- [x] Activate milestone/task tracking for T02 on 2026-03-30
- [x] Identify pure observability projection helpers inside `calls.py`
- [x] Move them into a dedicated call observability service/projection module
- [x] Add focused unit tests for the extracted projections
- [x] Keep existing route response shapes intact
- [x] Reduce `calls.py` responsibility before route-module splitting begins

## Current Extraction Plan

1. Move the observability projection models and typed row dataclasses from `apps/api/src/platform_api/routes/calls.py` into `packages/platform-core/src/platform_core/calls/observability_projection.py`.
2. Move only the pure helpers that build latency stacks, trace summaries, metric rollups, and observability summary responses.
3. Leave active-call workflow query coercion and SSE helpers in `calls.py`; they are adjacent but not part of the T02 seam.
4. Keep route handlers responsible only for HTTP validation, database fetches, and returning the extracted projection outputs.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/calls/observability_projection.py` | Create | Call observability normalization and summary builders |
| `packages/platform-core/tests/unit/test_calls/test_observability_projection.py` | Create | Unit coverage for extracted projection logic |
| `apps/api/src/platform_api/routes/calls.py` | Modify | Replace inline projection helpers with thin service calls |
| `apps/api/tests/integration/test_call_events.py` | Verify | Existing integration coverage for trace and observability summary shapes stays green |
| `apps/api/tests/integration/test_call_latency.py` | Verify | Existing integration coverage for latency response shape stays green |

## Implementation Notes

- Keep this extraction pure. It should operate on typed rows/value objects and return typed projection outputs.
- Do not bury FastAPI or request objects inside the projection layer.
- If a helper is really route-specific, leave it behind. This task is about the shared observability logic, not every tiny utility.

## Acceptance Criteria

- [x] Observability projection logic no longer lives inline inside `calls.py`
- [x] Projection helpers have direct unit coverage
- [x] Existing call observability API responses remain unchanged
- [x] `calls.py` becomes smaller and more route-focused

## Completion Notes

1. Extracted the pure observability projection models, typed row dataclasses, and summary builders into `packages/platform-core/src/platform_core/calls/observability_projection.py`.
2. Rewired `apps/api/src/platform_api/routes/calls.py` to use the shared builders for call latency, call trace summary, call runtime event normalization, and tenant/admin observability summary assembly.
3. Added direct unit coverage in `packages/platform-core/tests/unit/test_calls/test_observability_projection.py` for runtime-event stack fallback, trace-context parsing, summary rollups, and the admin sort-key helper.
4. Kept route responsibilities limited to HTTP validation and database access. SSE helpers and active-call workflow query coercion stayed in `calls.py`, which is exactly where the T02 scope line should stop.

## Verification Evidence

- `uv run ruff check apps/api/src/platform_api/routes/calls.py packages/platform-core/src/platform_core/calls/observability_projection.py packages/platform-core/tests/unit/test_calls/test_observability_projection.py`
- `uv run ruff format apps/api/src/platform_api/routes/calls.py packages/platform-core/src/platform_core/calls/observability_projection.py packages/platform-core/tests/unit/test_calls/test_observability_projection.py --check`
- `uv run pytest packages/platform-core/tests/unit/test_calls/test_observability_projection.py apps/api/tests/integration/test_call_events.py apps/api/tests/integration/test_call_latency.py -q --tb=short`
- `uv run pyright -p pyrightconfig.ci.json`

## References

- Milestone: [M8.2-control-plane-refactor-hardening.md](../../milestones/M8.2-control-plane-refactor-hardening.md)
- Related follow-on: planned turn-latency observability work
