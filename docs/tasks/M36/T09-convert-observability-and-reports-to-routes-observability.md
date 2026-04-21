# T09: Convert observability and reports to `routes/observability`

> **Milestone**: M36-platform-api-route-topology-phase1
> **Status**: Completed
> **Estimate**: L (4-8h)
> **Depends on**: T01

---

## Description

Convert the observability surface into a package-backed module and move the observability support files under the same domain package. This is the largest structural slice in phase 1, but it must still remain topology-only: no internal decomposition beyond the package move.

## Subtasks

- [x] **Create `routes/observability/`**: replace the flat `observability.py` module with `router.py` plus `__init__.py` re-exports.
- [x] **Move observability support modules under the same package**: relocate the live support modules `observability_enrichers.py` and `span_correlation.py` under the same package.
- [x] **Move `reports.py` under the observability domain**: make reports part of the same domain package while preserving the top-level `platform_api.routes.reports` import path via a shim.
- [x] **Keep import compatibility stable**: preserve `create_observability_router`, `create_admin_observability_router`, `create_reports_router`, `create_admin_reports_router`, and `annotate_span_correlation` at their current import sites.
- [x] **Retain focused proof for main wiring and reports**: keep or add tests that prove observability and reports still mount the same factories after the move.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/observability/__init__.py` | Create | Re-export observability router factories from the new package |
| `apps/api/src/platform_api/routes/observability/router.py` | Create | New implementation home for the current `observability.py` routes |
| `apps/api/src/platform_api/routes/observability/reports.py` | Create | New implementation home for the current `reports.py` routes |
| `apps/api/src/platform_api/routes/observability/observability_channel_runtime_support.py` | Create | Observability support helper under the domain package |
| `apps/api/src/platform_api/routes/observability/observability_enrichers.py` | Create | Observability support helper under the domain package |
| `apps/api/src/platform_api/routes/observability/span_correlation.py` | Create | Observability support helper under the domain package |
| `apps/api/src/platform_api/routes/reports.py` | Modify | Compatibility shim to `routes.observability.reports` |
| `apps/api/src/platform_api/routes/observability_channel_runtime_support.py` | Modify | Compatibility shim to `routes.observability.observability_channel_runtime_support` |
| `apps/api/src/platform_api/routes/observability_enrichers.py` | Modify | Compatibility shim to `routes.observability.observability_enrichers` |
| `apps/api/src/platform_api/routes/span_correlation.py` | Modify | Compatibility shim to `routes.observability.span_correlation` |
| `apps/api/src/platform_api/main.py` | Modify selectively | Preserve observability and reports factory imports/mounting |
| `apps/api/tests/` | Modify/Create | Focused route-wiring coverage for observability and reports |

## Implementation Notes

- Planning-only task. Do not execute until the human explicitly activates M36.
- `observability.py` becomes a package, so the compatibility mechanism is package `__init__.py` re-export, not a same-name flat shim file.
- `span_correlation.py` is imported from multiple route modules today. Preserve its old import path with a top-level shim or equivalent compatibility export so callers do not have to change in the same milestone.
- Do not split the 8k-line observability router internally yet. That is the next phase.

## Acceptance Criteria

- [x] `observability` becomes a package-backed route module with `router.py` plus `__init__.py`.
- [x] `reports.py` and the observability support helpers live under the `routes/observability/` domain package.
- [x] The current factory and helper import paths remain available during phase 1.
- [x] Main wiring and focused observability/report tests remain green after the move.

## Verification

```bash
uv run ruff check \
  apps/api/src/platform_api/routes/observability \
  apps/api/src/platform_api/routes/reports.py \
  apps/api/src/platform_api/routes/observability_enrichers.py \
  apps/api/src/platform_api/routes/span_correlation.py \
  apps/api/src/platform_api/main.py \
  apps/api/tests

uv run pyright \
  apps/api/src/platform_api/routes/observability \
  apps/api/src/platform_api/routes/reports.py \
  apps/api/src/platform_api/routes/observability_enrichers.py \
  apps/api/src/platform_api/routes/span_correlation.py \
  apps/api/src/platform_api/main.py

uv run pytest \
  apps/api/tests/integration/test_observability.py \
  apps/api/tests/integration/test_public_ingress_observability.py \
  apps/api/tests/integration/test_telnyx_webhook_observability.py \
  apps/api/tests/integration/test_observability_solution_enrichers.py \
  apps/api/tests/integration/test_reports_kpis.py \
  apps/api/tests/unit/test_observability_v2_read_models.py \
  apps/api/tests/unit/test_span_correlation_routes.py \
  -q --tb=short
```

## References

- Milestone: [M36-platform-api-route-topology-phase1.md](../../milestones/M36-platform-api-route-topology-phase1.md)
- Design: `wiki/queries/2026-04-11-design-platform-api-route-topology-refactor.md`
