# T07: Ship PR

> **Milestone**: M41.0-appointment-booking-package-structure
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T06

---

## Description

Run the final M41.0 verification, complete cleanup, update docs, and prepare
the PR evidence.

## Subtasks

- [x] **Run milestone verification**: run all commands listed in the milestone.
- [x] **Run docs/API checks**: regenerate API inventory if route surfaces moved.
- [x] **Garbage-collection pass**: delete stale shims/helpers where possible
      and document any kept candidates.
- [x] **Update progress and log**: mark the milestone complete if all evidence
      passes.
- [x] **Prepare PR body**: include tests, GC pass, docs, and follow-up notes.

## Verification Evidence

- `uv run python -c "import appointment_booking; from appointment_booking.manifest import manifest; print(manifest.name)"` -> `appointment_booking`
- `uv run pytest solutions/appointment_booking/tests/unit/ -q` -> 94 passed
- `uv run pytest solutions/appointment_booking/tests/integration/ -q` -> 12 passed
- `uv run pytest solutions/appointment_booking/tests/api_integration/ -q` -> 21 passed
- `uv run ruff check solutions/appointment_booking/src/ solutions/appointment_booking/tests/ apps/api/src/platform_api/routes/` -> passed
- `uv run pyright solutions/appointment_booking/src/ apps/api/src/platform_api/routes/appointment_booking apps/api/src/platform_api/routes/observability/observability_enrichers.py` -> 0 errors
- `uv run python tools/scripts/check_api_inventory.py` -> API inventory contract OK, endpoints=254
- `uv run pytest tests/architecture/test_repo_file_size.py tests/architecture/test_app_layer_boundaries.py tests/architecture/test_solution_isolation.py -q` -> 16 passed
- `uv run pytest apps/api/tests/integration/test_observability_solution_enrichers.py apps/api/tests/integration/test_observability_solution_enrichers_details.py apps/temporal-worker/tests/unit/test_inbound_call_orchestrator_budget.py packages/platform-core/tests/unit/test_e2e_fixture_contracts.py -q` -> 16 passed
- `uv run pyright tools/scripts/run_clinic_booking_two_agent_monitor.py` -> 0 errors
- `uv run ruff check tools/scripts/run_clinic_booking_two_agent_monitor.py` -> passed
- live code/test/tool old-import grep -> no matches
- `uv run pytest solutions/appointment_booking/tests/api_integration/ -q` -> 21 passed
- `uv run pyright solutions/appointment_booking/src/ apps/api/src/platform_api/routes/appointment_booking apps/api/src/platform_api/routes/observability/observability_enrichers.py tools/scripts/run_clinic_booking_two_agent_monitor.py` -> 0 errors
- `uv run ruff check solutions/appointment_booking/src/ solutions/appointment_booking/tests/ apps/api/src/platform_api/routes/appointment_booking tools/scripts/run_clinic_booking_two_agent_monitor.py` -> passed
- `uv run pytest tests/architecture/test_repo_file_size.py tests/architecture/test_app_layer_boundaries.py tests/architecture/test_solution_isolation.py -q` -> 16 passed
- stale milestone-number grep across the working tree -> no matches
- `uv run pytest packages/grove/tests/unit/architecture/test_doc_integrity.py packages/grove/tests/unit/architecture/test_doc_freshness.py -q` -> 10 passed, 1 skipped
- `uv run ruff check apps/api/src/platform_api/routes/appointment_booking/presenters.py` -> passed
- CI architecture follow-up:
  `uv run pytest tests/architecture/test_platform_api_route_import_surface.py tests/architecture/test_platform_api_route_topology.py tests/architecture/test_v2_preparation_contracts.py tests/architecture/test_component_graph_contract.py tests/architecture/test_installable_package_dependency_declarations.py tests/architecture/test_repo_file_size.py -q` -> 31 passed
- CI architecture follow-up:
  `uv run pytest tests/architecture -q` -> 1277 passed
- PR #957 review follow-up:
  `uv run ruff check apps/api/src/platform_api/routes/appointment_booking/bookings.py apps/api/src/platform_api/routes/appointment_booking/automation.py solutions/appointment_booking/src/appointment_booking/booking/records.py solutions/appointment_booking/src/appointment_booking/automation/service.py` -> passed
- PR #957 review follow-up:
  `uv run pyright apps/api/src/platform_api/routes/appointment_booking/bookings.py apps/api/src/platform_api/routes/appointment_booking/automation.py solutions/appointment_booking/src/appointment_booking/booking/records.py solutions/appointment_booking/src/appointment_booking/automation/service.py` -> 0 errors
- PR #957 review follow-up:
  `uv run pytest solutions/appointment_booking/tests/api_integration/test_clinic_booking_results.py -q` -> 11 passed, 23 warnings
- PR #957 review follow-up:
  `uv run pytest tests/architecture/test_platform_api_route_import_surface.py tests/architecture/test_platform_api_route_topology.py tests/architecture/test_repo_file_size.py -q` -> 21 passed
- PR #957 artifact-exclusion follow-up:
  `uv run pytest tests/architecture/test_installable_package_dependency_declarations.py tests/architecture/test_component_graph_contract.py -q` -> 4 passed
- PR #957 artifact-exclusion follow-up:
  `bash tools/scripts/ci/merge-gate/validate-artifact-profiles.sh` -> passed
- PR #957 strict-typing review follow-up:
  `rg -n "pyright: reportUnknown|reportPrivateUsage=false" solutions/appointment_booking/src/appointment_booking apps/api/src/platform_api/routes/appointment_booking -S` -> no matches
- PR #957 strict-typing review follow-up:
  `uv run pyright solutions/appointment_booking/src/ apps/api/src/platform_api/routes/appointment_booking` -> 0 errors
- PR #957 strict-typing review follow-up:
  `uv run ruff check apps/api/src/platform_api/routes/appointment_booking solutions/appointment_booking/src/appointment_booking` -> passed
- PR #957 strict-typing review follow-up:
  `uv run pytest solutions/appointment_booking/tests/unit/ -q` -> 94 passed
- PR #957 strict-typing review follow-up:
  `uv run pytest solutions/appointment_booking/tests/api_integration/ -q` -> 21 passed, 23 warnings
- PR #957 strict-typing review follow-up:
  `uv run pytest apps/api/tests/integration/test_observability_solution_enrichers.py apps/api/tests/integration/test_observability_solution_enrichers_details.py -q` -> 7 passed, 7 warnings
- PR #957 strict-typing review follow-up:
  `uv run pytest tests/architecture/test_platform_api_route_import_surface.py tests/architecture/test_platform_api_route_topology.py tests/architecture/test_repo_file_size.py -q` -> 21 passed
- PR #957 app-layer asyncpg CI follow-up:
  `uv run pyright apps/api/src/platform_api/routes/appointment_booking solutions/appointment_booking/src/` -> 0 errors
- PR #957 app-layer asyncpg CI follow-up:
  `uv run ruff check apps/api/src/platform_api/routes/appointment_booking/runtime.py` -> passed
- PR #957 app-layer asyncpg CI follow-up:
  `uv run pytest tests/architecture/test_app_layer_boundaries.py::test_asyncpg_usage_is_restricted_in_apps -q` -> 1 passed
- PR #957 app-layer asyncpg CI follow-up:
  `rg -n "^import asyncpg|^from asyncpg" apps/api/src/platform_api/routes/appointment_booking -S` -> no matches
- PR #957 app-layer asyncpg CI follow-up:
  `git diff --check` -> passed
- PR #957 merge-conflict follow-up:
  `rg -n "<<<<<<<|=======|>>>>>>>|\|\|\|\|\|\|\|" wiki/log.md` -> no matches
- PR #957 merge-conflict follow-up:
  `git diff --name-only --diff-filter=U` -> no unresolved merge paths
- PR #957 merge-conflict follow-up:
  `git diff --check` -> passed

## Blockers / Caveats

- The broad milestone typecheck command
  `uv run pyright solutions/appointment_booking/src/ apps/api/src/platform_api/routes/`
  still fails outside the M41.0 surface in `apps/api/src/platform_api/routes/call_ops/active_workflows.py`,
  `apps/api/src/platform_api/routes/call_ops/calls_live_runtime.py`,
  `apps/api/src/platform_api/routes/call_ops/runtime.py`, and
  `apps/api/src/platform_api/routes/observability/reports.py`.
  The changed appointment-booking route package and touched observability
  enricher typecheck cleanly.
- CI found one missed tool-script import after the PR opened:
  `tools/scripts/run_clinic_booking_two_agent_monitor.py` still imported
  `appointment_booking.scheduling`. It now imports
  `appointment_booking.booking.scheduling`.
- Review finding resolved: moved clinic follow-up queue/read/action state
  operations from the app route into
  `appointment_booking.booking.follow_ups`. The app route now handles auth,
  request parsing, HTTP exception mapping, audit events, spans, and response
  return.
- Milestone numbering conflict resolved: the Affidea booking milestone series
  now uses M41 because PR #950 owns the previous milestone number.
- CI architecture contracts resolved: route topology/import inventory,
  installable dependency declaration, V2 prep paths, and generated graph
  artifacts now reflect the approved appointment-booking route package.
- PR #957 review findings resolved: booking-result read models now live behind
  public solution-owned record functions, and automation service errors are
  solution domain exceptions mapped to HTTP only in the app route.
- PR #957 artifact-exclusion failure resolved: `platform-api` no longer hard
  depends on `appointment-booking`; the architecture dependency declaration
  check now treats only manifest-gated app route packages as optional solution
  surfaces.
- PR #957 strict-typing review finding resolved: broad file-level pyright
  suppressions were removed from the moved appointment-booking route, service,
  tool, read-model, follow-up, and observability modules; asyncpg typing is
  narrowed at package-local SQL boundary helpers.
- PR #957 app-layer asyncpg CI failure resolved: `request_pg_pool` keeps the
  `asyncpg.Pool` type visible to Pyright through a `TYPE_CHECKING` import
  without a runtime app-layer `asyncpg` import.
- PR #957 merge conflict resolved: current `origin/main` is merged into the
  branch, and `wiki/log.md` keeps both M41.0 appointment-booking entries and
  the newer mainline NFQ/GCP and voice-load-test entries.

## Garbage-Collection Pass

- Removed all temporary top-level `appointment_booking.*` compatibility shims
  in T06 after moving callers to capability-owned imports.
- Split the large `appointment_booking.booking.tools` implementation into
  search, capture, and completion modules so the repository file-size
  architecture gate passes without changing allowlists.
- No dead compatibility module is intentionally kept for this milestone.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M41.0/PROGRESS.md` | Modify | Final task/milestone status |
| `docs/milestones/M41.0-appointment-booking-package-structure.md` | Modify | Final status and evidence if appropriate |
| `wiki/log.md` | Modify | Append completion note |
| `docs/arch/generated/api_inventory.md` | Modify | Only if route inventory changes |

## Implementation Notes

- This is the milestone's Ship-PR task. Do not open the PR until this task is
  complete or explicitly blocked.
- k3d proof is not required unless runtime behavior changes. This milestone is
  intended to be topology-only.

## Acceptance Criteria

- [x] Full M41.0 verification commands pass or blockers are documented.
- [x] GC pass is complete and summarized.
- [x] Documentation reflects the new package shape.
- [x] PR body can cite task evidence without relying on chat.

## References

- Depends on: [T06](T06-import-shims-and-test-updates.md)
- Milestone: [M41.0-appointment-booking-package-structure.md](../../milestones/M41.0-appointment-booking-package-structure.md)
