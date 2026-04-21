# M41.0: Appointment Booking Package Structure Refactor — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Inventory current appointment-booking imports and establish refactor baseline tests | Done | 2026-04-20 |
| T02 | Create target solution directories and move booking state, schemas, knowledge, scheduling, and tools | Done | 2026-04-20 |
| T03 | Move reminder workflows, activities, CRM adapter, and handoff support into capability packages | Done | 2026-04-20 |
| T04 | Move voice profile, rehearsal, template, observability, and evaluation helpers into owned packages | Done | 2026-04-20 |
| T05 | Move or isolate the FastAPI router surface as a thin route package and update manifest wiring | Done | 2026-04-20 |
| T06 | Update internal imports, tests, and any temporary compatibility shims | Done | 2026-04-20 |
| T07 | Run refactor verification, GC stale top-level modules, and record Ship-PR evidence | Done | 2026-04-20 |

## Notes

- M41.0 started on 2026-04-20 after PR #953 merged the milestone plan.
- Renumbering note: the Affidea booking milestone series now uses M41 because
  PR #950 owns the previous milestone number.
- This milestone is behavior-preserving. Affidea prompt import, provider
  clients, grouped-flow runtime, production routing, and UI work are explicitly
  out of scope.
- The first implementation task establishes the import inventory and baseline
  tests before any module move.
- T01 found and corrected a stale milestone verification assumption:
  `SolutionManifest` exposes `name`, not `solution_id`.
- Baseline proof before moving files:
  - import smoke: `appointment_booking`
  - unit tests: 94 passed
  - integration tests: 12 passed
  - API integration tests: 21 passed
- T02 moved booking-owned modules under `appointment_booking.booking` and kept
  temporary top-level compatibility shims for T06 cleanup.
- T02 focused proof:
  - booking unit/config tests: 59 passed
  - plugin integration test: 1 passed
  - booking/plugin pyright: 0 errors
  - solution source ruff: passed
  - new and shim tool import smoke: passed
- T03 moved automation/reminder workflow code under
  `appointment_booking.automation`, moved the clinic webhook CRM adapter under
  `appointment_booking.crm`, and created the reserved
  `appointment_booking.handoff` package surface.
- T03 focused proof:
  - reminder workflow/post-call activity integration tests: 8 passed
  - CRM and appointment-booking unit tests: 56 passed
  - temporal-worker reminder scheduling unit tests: 8 passed
  - automation/CRM/handoff pyright: 0 errors
  - solution source and temporal-worker workflow ruff: passed
- T04 moved voice profile/template/rehearsal helpers under
  `appointment_booking.voice`, observability enrichment under
  `appointment_booking.observability.service`, and eval helpers under
  `appointment_booking.evaluation`.
- T04 focused proof:
  - voice/config/eval/unit coverage: 73 passed
  - clinic browser session API integration: 2 passed
  - runtime plugin integration: 1 passed
  - voice/observability/evaluation pyright: 0 errors
  - moved-package ruff: passed
  - moved-module old-import grep: no matches
- T05 started on 2026-04-20.
- T05 implementation decision:
  - create `apps/api/src/platform_api/routes/appointment_booking` as the
    manifest-owned FastAPI route surface;
  - keep database/domain transforms in `solutions/appointment_booking`
    capability packages so the app shell remains thin;
  - split the current top-level API god module instead of creating a second
    large compatibility module;
  - preserve existing clinic API behavior with focused API integration proof
    before committing the task.
- T05 moved the manifest route factory to
  `platform_api.routes.appointment_booking:create_router`, split the old
  `appointment_booking.api` god module into app route modules plus
  solution-owned booking/automation service modules, and left only a tiny
  top-level relocation stub.
- T05 focused proof:
  - route factory import smoke: 16 routes
  - API inventory generation/check: passed, endpoints=254
  - clinic API integration tests: 21 passed
  - observability solution enricher integration tests: 7 passed
  - app layer + solution isolation architecture tests: 9 passed
  - targeted route/solution pyright: 0 errors
  - touched route/solution ruff: passed
- Remaining blocker for later M41.0 verification:
  - `tests/architecture/test_repo_file_size.py` fails because
    `appointment_booking.booking.tools` is 1347 lines after the T02 move.
    This should be handled by T06/T07 through a real split, not by changing
    an architecture allowlist.
- T06 removed the top-level compatibility shims after moving tests and external
  callers to capability-owned imports.
- T06 split the large `appointment_booking.booking.tools` implementation into
  `search_tools.py`, `capture_tools.py`, and `completion_tools.py`, keeping
  `booking.tools` as the stable 32-line public aggregator.
- T06 focused proof:
  - old top-level import grep: no matches
  - solution unit tests: 94 passed
  - solution integration tests: 12 passed
  - solution API integration tests: 21 passed
  - temporal-worker/platform-core import-update tests: 9 passed
  - repo file-size + app-layer + solution-isolation architecture tests:
    16 passed
  - solution/app-route pyright: 0 errors
  - touched solution/app/test ruff: passed
- T07 completed the Ship-PR pass and recorded final verification evidence.
- Final M41.0 proof:
  - import smoke: `appointment_booking`
  - solution unit tests: 94 passed
  - solution integration tests: 12 passed
  - solution API integration tests: 21 passed
  - API inventory check: passed, endpoints=254
  - repo file-size + app-layer + solution-isolation architecture tests:
    16 passed
  - observability enricher + temporal-worker/platform-core regression tests:
    16 passed
  - scoped changed-surface pyright: 0 errors
  - milestone ruff command: passed
- Final M41.0 caveat:
  - the broad milestone pyright command over all of
    `apps/api/src/platform_api/routes/` remains blocked by unrelated existing
    `call_ops` and observability-report typing errors outside this PR. The
    changed appointment-booking route package and touched observability
    enricher typecheck cleanly.
- CI follow-up:
  - fixed the missed live tool-script import in
    `tools/scripts/run_clinic_booking_two_agent_monitor.py` from
    `appointment_booking.scheduling` to
    `appointment_booking.booking.scheduling`;
  - verified that script with pyright and ruff;
  - confirmed no stale top-level appointment-booking imports remain in live
    code, test, or tool paths.
- Review follow-up:
  - moved clinic follow-up queue/read/action state operations out of
    `apps/api/src/platform_api/routes/appointment_booking/follow_ups.py` and
    into `appointment_booking.booking.follow_ups`;
  - left the app route responsible for auth, request parsing, HTTP exception
    mapping, audit events, spans, and response return;
  - verified with the appointment-booking API integration suite, scoped
    pyright, scoped ruff, and repository architecture tests.
- Renumbering follow-up:
  - renamed the Affidea booking milestone series, task directory, progress
    docs, design-doc owner reference, milestone index entries, and PR-facing
    branch metadata to M41;
  - verified with a stale milestone-number grep, doc integrity/freshness tests,
    route-comment ruff, and the root architecture checks.
  - opened replacement PR #957 from
    `feat/M41.0-appointment-booking-package-structure` and closed superseded
    PR #955.
- CI architecture follow-up:
  - classified PR #957 `Run PR Product Tests` failure as branch-related stale
    architecture contracts from the approved route-package move;
  - declared the `platform-api` workspace dependency on `appointment-booking`;
  - updated route topology/import inventory, the V2 preparation path contract,
    and regenerated component/system graph artifacts;
  - verified with focused architecture checks and the full
    `uv run pytest tests/architecture -q` suite: 1277 passed.
- Review follow-up on PR #957:
  - moved clinic booking-result list/detail SQL and response mapping out of
    `apps/api/src/platform_api/routes/appointment_booking/bookings.py` and into
    public `appointment_booking.booking.records` functions;
  - replaced solution-owned FastAPI exceptions in
    `appointment_booking.automation.service` with domain exceptions and public
    service functions, leaving HTTP mapping in the app route;
  - verified with touched-file ruff, touched-file pyright,
    `solutions/appointment_booking/tests/api_integration/test_clinic_booking_results.py`,
    and the route import/topology/file-size architecture checks.
- CI artifact-exclusion follow-up on PR #957:
  - removed the hard `platform-api` package dependency on `appointment-booking`
    because the route package is manifest-gated and optional per artifact
    profile;
  - encoded that manifest-gated route optionality in the installable package
    dependency architecture test instead of changing artifact profile scope;
  - verified with the focused architecture checks and the artifact profile
    exclusion script.
- Review strict-typing follow-up on PR #957:
  - removed broad file-level pyright suppressions from the moved
    appointment-booking route, service, tool, read-model, follow-up, and
    observability modules;
  - replaced private cross-module helper imports with public package-local
    helpers and confined asyncpg weak-stub casts to typed SQL boundary helpers;
  - deleted duplicated dead tool helper code surfaced by strict pyright;
  - verified with strict pyright, ruff, solution unit/API integration tests,
    observability integration tests, and route/file-size architecture checks.
- CI app-layer asyncpg follow-up on PR #957:
  - classified the product-test failure as branch-related: the app route
    package imported `asyncpg` only for `request_pg_pool` typing;
  - moved that import under `TYPE_CHECKING` so Pyright still validates the
    typed pool boundary while runtime app-layer imports remain clean;
  - verified with scoped Pyright, scoped Ruff, the failing app-layer
    architecture test, a route-package runtime asyncpg-import grep, and
    `git diff --check`.
- Merge-conflict follow-up on PR #957:
  - merged current `origin/main` into the M41.0 branch after GitHub reported a
    `wiki/log.md` conflict;
  - resolved the conflict by preserving both the M41.0 appointment-booking log
    entries and the newer mainline NFQ/GCP and voice-load-test entries;
  - verified no conflict markers remain, no unresolved merge paths remain, and
    `git diff --check` passes.
