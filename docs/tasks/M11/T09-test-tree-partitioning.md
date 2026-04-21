# T09: Test Tree Partitioning by Solution Scope

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T09 - test tree partitioning by solution scope`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

Partition ALL 6 test layers so solution-specific tests only run when that solution is installed, and source exports exclude tests for non-contracted solutions.

## 2026-04-02 NFQ Slice

This task is only partially advanced for the NFQ clean-repo boundary:

- `distribution/clients/nfq.yaml` now excludes `outbound_campaigns` and keeps `telematics_ingestion`.
- `tools/scripts/artifact/export-client.sh` now strips exported test files when their path or direct imports cross the excluded NFQ surfaces (`campaign`, `public_ingress`, and excluded solution modules).
- The export also prunes `apps/web/tests/**` and `apps/web/e2e/**` files when they still hardcode excluded solution literals like `lead_capture`, instead of shipping those private fixture names into the NFQ seed.
- Pure solution-specific API tests now live under `solutions/appointment_booking/tests/api_integration/` and `solutions/outbound_campaigns/tests/api_integration/` instead of `apps/api/tests/integration/`.
- Pure solution-specific Temporal tests now live under `solutions/driver_verification/tests/temporal/` and `solutions/outbound_campaigns/tests/temporal/` instead of `apps/temporal-worker/tests/**`.
- Pure solution-specific web unit tests now live under `solutions/appointment_booking/ui/tests/` and `solutions/driver_verification/ui/tests/`, so `apps/web/tests/` no longer owns solution-local API client coverage.
- `apps/web/e2e/clinic-knowledge-base.spec.ts` now follows the existing shipped-solution skip pattern instead of assuming appointment-booking UI always ships.
- Common solution-gating tests that only exercise generic registry/filtering mechanics now use neutral or NFQ-safe fixture names instead of excluded solution names like `outbound_campaigns`, `schedule_management`, or `call_monitoring`.
- Shared web E2E observability fixtures now use NFQ-safe drift examples (`driver_verification` + `appointment_booking`) instead of `lead_capture`.
- Shared platform release, solution-catalog, lifecycle-migration, observability-enabled-plugin, and tenancy-delegation fixtures now use NFQ-safe solution names where they only prove generic behavior, instead of `lead_capture`, `call_monitoring`, or `schedule_management`.
- Shared connector catalog and solution-scoped adapter gating fixtures now use `appointment_booking` / `clinic_webhook` instead of `lead_capture` / `lead_capture_webhook` where the tests only prove generic platform connector behavior.
- Shared Layer-2 connector registry coverage now keeps the generic catalog behavior in `packages/platform-core/tests/integration/test_connector_registry_and_health.py`, while the explicit `lead_capture_webhook` catalog contract lives under `packages/platform-core/tests/integration/test_lead_capture_connector_registry.py`.
- Shared agent-definition platform tests now use neutral assistant fixture naming instead of fake `sales` agents, and the lead-capture template reuse contract now lives under `solutions/lead_capture/tests/integration/` instead of the common API test file.
- Shared Layer-2 agent-governance integration tests now use neutral `assistant` fixture naming and explicit NFQ-safe enabled-solution choices (`appointment_booking` when voice+guardrails semantics matter, `driver_verification` when they do not) instead of fake `sales` / `support` agents and `lead_capture` plugin defaults.
- Shared Layer-2 voice webhook unit tests now use NFQ-safe enabled-solution fixtures (`appointment_booking` / `notifications`) instead of excluded `outbound_campaigns` / `call_monitoring` defaults when they only prove generic webhook metadata and workflow-input behavior.
- The public-ingress tenant export/offboard contract now lives under `apps/api/tests/integration/test_public_ingress_tenant_export.py` instead of the shared `test_tenants.py` file, so the NFQ seed can drop it by path token instead of carrying mixed-capability baggage.
- The public-ingress interactive-channel and widget-runtime observability contract now lives under `apps/api/tests/integration/test_public_ingress_observability.py` instead of the shared `test_observability.py` file, so the NFQ seed can drop widget/guest-session runtime coverage by path token instead of carrying it in the shared observability surface.
- The Temporal tenant lifecycle cleanup contract for `public_ingress` now lives under `apps/temporal-worker/tests/integration/platform_core/test_public_ingress_tenant_lifecycle_workflows.py`, while the shared `test_tenant_lifecycle_workflows.py` file now stays focused on generic tenant provision/offboard behavior.
- The Layer-2 provisioning-service public-ingress cleanup unit contract now lives under `packages/platform-core/tests/unit/test_tenancy/test_public_ingress_provisioning_service.py`, while the shared `test_provisioning_service.py` file now stays focused on generic tenant-state and schema-drop behavior.
- The Layer-2 public-schema widget/guest-session model coverage plus the `public_ingress` bootstrap migration now live under `packages/platform-core/tests/unit/test_public_ingress_public_schema_models.py`, while the shared `test_public_schema_models.py` file now stays focused on generic public-schema models.
- The explicit `public_ingress` route-scope mounting case now lives under `apps/api/tests/unit/test_public_ingress_router_mounting.py` instead of staying hidden inside the shared `test_solution_router_mounting.py` parameter matrix.
- Shared Layer-2 tenancy onboarding/workflow, solution-gating, migration-runner, and release-rollout tests now use neutral or NFQ-safe solution names (`example_solution` / `notifications`) instead of excluded `lead_capture` / `outbound_campaigns` defaults when they only prove generic platform behavior.
- Shared generic rollout concurrency, tenant-solution config audit, manifest, rollout-execution, and agent-governance override/update-draft tests now use neutral or NFQ-safe fixture names (`notifications`, `example_solution`, `assistant`, `unsupported_plugin`) instead of excluded `lead_capture` / `outbound_campaigns` defaults when they only prove generic platform behavior.
- The schedule-management admin config-schema contract now lives under `solutions/schedule_management/tests/integration/` instead of the common `apps/api/tests/integration/test_solutions_api.py` file.
- The schedule-management approval audit workflow contract now lives under `solutions/schedule_management/tests/integration/` instead of `apps/temporal-worker/tests/integration/platform_core/`.
- Verified NFQ export proof keeps contracted solution code/tests while removing the obvious excluded/private test surfaces plus the leaked web/admin fixture specs.

Still missing:

- fixture cleanup for platform tests that still mention excluded solution names in non-web test data
- any deliberate relocation of Playwright specs out of `apps/web/e2e/` if we ever decide the shared app shell should stop owning those flows

## Current Test Landscape (Full Audit)

### Layer 1: Solution-owned tests (`solutions/*/tests/`)

Naturally isolated — each solution's tests live inside its package. When a solution directory is excluded from the export, its tests go with it. **No changes needed.**

9 solutions have test directories: appointment_booking, call_monitoring, driver_verification, lead_capture, notifications, operations_monitor, outbound_campaigns, schedule_management, telematics_ingestion.

### Layer 2: API integration tests (`apps/api/tests/`)

**Purely solution-specific** (import solution code or test solution endpoints):
- `test_clinic_availability.py` → appointment_booking
- `test_clinic_booking.py` → appointment_booking
- `test_clinic_booking_results.py` → appointment_booking
- `test_clinic_browser_session.py` → appointment_booking
- `test_clinic_knowledge_base.py` → appointment_booking
- `test_clinic_patient_identification.py` → appointment_booking
- `test_campaigns.py` → outbound_campaigns

**Platform tests that reference solutions as fixtures** (NOT solution-specific — test platform behavior using solution names in test data):
- `test_tenants.py` — uses solution names in onboarding fixtures
- `test_connectors.py` — uses solution names in connector fixtures
- `test_agent_definitions.py` — mixed file; generic platform cases stay shared, but real solution-template reuse contracts must move into owning solution packages
- `test_tenants.py` — shared tenancy coverage; the public-ingress/export/offboard contract now lives under `test_public_ingress_tenant_export.py`
- `test_solutions_api.py` — tests the platform's solution gating API
- `test_observability.py` — shared call/workflow observability coverage after the public-ingress interactive-channel slice moved into `test_public_ingress_observability.py`
- `test_workflows.py` — references solution names in workflow fixtures
- `test_phone_numbers_api.py` — references solution names in routing fixtures

**Rule:** Pure solution tests (first group) move into the owning solution package and are stripped from exports with that solution. Platform tests (second group) must NOT be stripped — they test platform behavior. Their solution-name references should use conftest fixtures that adapt to the installed solution set.

### Layer 3: Temporal worker tests (`apps/temporal-worker/tests/`)

**Purely solution-specific:**
- `test_driver_verification_e2e.py` → driver_verification
- `test_driver_verification_target_governance.py` → driver_verification
- `test_driver_verification_target_resolution.py` → driver_verification
- `test_campaign_workflow.py` → outbound_campaigns
- `test_campaign_persistence_activities.py` → outbound_campaigns
- `test_campaign_e2e.py` → outbound_campaigns
- `test_approval_audit_events.py` → schedule_management

**Platform tests referencing solutions as fixtures:**
- `test_solution_gating.py` — platform gating behavior
- `test_solution_gating_enforcement.py` — platform gating enforcement
- `test_solution_lifecycle_versions.py` — platform lifecycle
- `test_tenancy_enable_solution_closure.py` — platform tenancy
- `test_tenant_lifecycle_workflows.py` — platform tenancy
- `test_public_ingress_tenant_lifecycle_workflows.py` — explicit public-ingress cleanup/offboard lifecycle coverage
- `test_inbound_call_orchestrator_budget.py` — references appointment_booking as budget test context

### Layer 4: Web unit tests (`solutions/*/ui/tests/` + `apps/web/tests/`)

**Purely solution-specific (moved into solution UI packages):**
- `solutions/appointment_booking/ui/tests/clinic-bookings-api.test.ts`
- `solutions/appointment_booking/ui/tests/clinic-knowledge-base-api.test.ts`
- `solutions/driver_verification/ui/tests/driver-verification-api.test.ts`

**Platform tests referencing solution names (keep — test platform behavior):**
- `solutions.test.ts` — tests the solution registry/gating
- `solution-route-wrappers.test.ts` — tests generated route wiring
- `tenant-workbench.test.ts` — tests sidebar with solution names
- `observability-workspace.test.ts` — references solution types
- `admin-releases-api.test.ts` — references solution names in release fixtures

### Layer 5: E2E tests (`apps/web/e2e/`)

**Purely solution-specific:**
- `clinic-bookings.spec.ts` → appointment_booking
- `clinic-browser-voice.spec.ts` → appointment_booking
- `clinic-knowledge-base.spec.ts` → appointment_booking
- `driver-verification.spec.ts` → driver_verification

**Platform tests referencing solutions (keep in all exports — test platform behavior):**
- `solution-gating.spec.ts` — tests the platform gating UI
- `dashboard.spec.ts` — renders solution widgets conditionally
- `routes.spec.ts` — verifies solution route accessibility
- `a11y-smoke.spec.ts` — visits solution pages
- `integrations.spec.ts` — references solution connectors
- `admin-releases.spec.ts` — references solution names in release fixtures

### Layer 6: Architecture tests (`tests/architecture/`)

These are shared enforcement tests, not customer-facing product contracts. They stay in the source repo, but they still need the same ownership discipline:

- keep path- and topology-based literals when they enforce repo/export/runtime boundaries
- do not use excluded solution names as lazy generic fixture sludge
- if an architecture test ever proves an excluded capability contract instead of a structural invariant, split it the same way as other mixed shared files

## Subtasks

- [x] **Audit complete** — use the landscape above as the baseline
- [x] **API tests: MOVE pure solution test files** into `solutions/{name}/tests/api_integration/` — `test_clinic_*.py` now live under `solutions/appointment_booking/tests/api_integration/`, and `test_campaigns.py` now lives under `solutions/outbound_campaigns/tests/api_integration/`.
- [x] **API tests: DO NOT move shared platform fixture tests for in-scope capabilities** — `test_tenants.py`, `test_connectors.py`, `test_agent_definitions.py`, and similar files stay shared when they prove generic platform behavior. Capability-specific public-ingress files do **not** belong in the NFQ seed just because they live under shared layers.
- [x] **API tests: audit remaining references** — `test_connectors.py`, `test_reports_kpis.py`, and similar shared platform tests still need boundary cleanup where excluded capabilities leak into generic fixture data. Replace those fixture names only after classifying the whole file.
- [x] **Temporal tests: MOVE pure solution test files** into `solutions/{name}/tests/temporal/` — `test_driver_verification_*.py` now live under `solutions/driver_verification/tests/temporal/`, and `test_campaign_*.py` now live under `solutions/outbound_campaigns/tests/temporal/`.
- [x] **Temporal tests: DO NOT move platform gating tests** — `test_solution_gating*.py`, `test_solution_lifecycle_versions.py`, etc.
- [x] **Temporal tests: move schedule-management approval audit contract out of shared platform_core tree** — the approval-audit workflow coverage now lives under `solutions/schedule_management/tests/integration/`
- [x] **Platform gating/unit fixtures: neutralize dummy solution names where possible** — shared gating tests now use neutral or NFQ-safe fixture names instead of excluded solutions when they only prove generic filtering/closure behavior
- [x] **Shared platform fixtures: keep replacing excluded dummy solution names in generic tests** — release-rollout, solution-catalog visibility, lifecycle migration, observability enabled-plugin, and tenancy-delegation fixtures now use NFQ-safe solution names when they are not testing excluded-solution contracts
- [x] **API tests: keep shared connector gating fixtures boundary-safe** — catalog and solution-gating cases now use the shipped `clinic_webhook` / `appointment_booking` fixture path instead of excluded lead-capture adapter defaults
- [x] **Layer-2 integration tests: split explicit lead-capture connector catalog contract out of the shared registry file** — `lead_capture_webhook` catalog assertions now live under `packages/platform-core/tests/integration/test_lead_capture_connector_registry.py`
- [x] **API tests: keep shared agent-definition fixtures boundary-safe** — generic platform agent-definition tests now use neutral assistant fixtures, and lead-capture template reuse coverage moved under `solutions/lead_capture/tests/integration/`
- [x] **Layer-2 integration tests: keep shared agent-governance fixtures boundary-safe** — generic governance lifecycle/registry coverage now uses neutral assistant fixtures plus explicit NFQ-safe enabled solutions instead of `lead_capture` + fake sales/support defaults
- [x] **Layer-2 unit tests: keep shared voice webhook fixtures boundary-safe** — generic webhook workflow-input and metadata cases now use NFQ-safe enabled solutions instead of excluded `outbound_campaigns` / `call_monitoring` defaults
- [x] **API tests: split public-ingress export/offboard contract out of the shared tenancy file** — the public-ingress export/offboard route coverage now lives under `apps/api/tests/integration/test_public_ingress_tenant_export.py`
- [x] **API tests: split widget-analytics public-ingress KPI contract out of shared reports coverage** — the widget analytics route coverage now lives under `apps/api/tests/integration/test_public_ingress_widget_analytics.py`
- [x] **API tests: split public-ingress observability runtime contracts out of the shared observability file** — interactive-channel session and widget-runtime observability coverage now lives under `apps/api/tests/integration/test_public_ingress_observability.py`
- [x] **Temporal integration tests: split public-ingress tenant cleanup contracts out of the shared lifecycle file** — explicit widget / guest-session / public-chat cleanup coverage now lives under `apps/temporal-worker/tests/integration/platform_core/test_public_ingress_tenant_lifecycle_workflows.py`
- [x] **Layer-2 unit tests: split public-ingress tenant cleanup contracts out of the shared provisioning-service file** — explicit guest-session/widget/KPI/operator cleanup coverage now lives under `packages/platform-core/tests/unit/test_tenancy/test_public_ingress_provisioning_service.py`
- [x] **API tests: move schedule-management config-schema contract out of the common solutions API file** — the disabled-solution admin schema case now lives under `solutions/schedule_management/tests/integration/`
- [x] **API unit tests: split explicit public-ingress route-scope mounting contract out of the shared router-mounting file** — the `public_ingress` route-scope case now lives under `apps/api/tests/unit/test_public_ingress_router_mounting.py`
- [x] **Web unit tests: MOVE pure solution test files** — `clinic-bookings-api.test.ts`, `clinic-knowledge-base-api.test.ts`, and `driver-verification-api.test.ts` now live under the owning `solutions/*/ui/tests/` package and run with package-local `vitest`
- [x] **E2E tests: add solution skip** — `clinic-bookings.spec.ts`, `clinic-browser-voice.spec.ts`, `clinic-knowledge-base.spec.ts`, and `driver-verification.spec.ts` are now conditional on shipped solution presence
- [x] **Web E2E fixtures: remove lazy excluded-solution defaults where not contract-relevant** — common observability drift fixtures now use NFQ-safe solution names instead of `lead_capture`
- [x] **Compose E2E tests: split explicit lead-capture rollout schema contract out of the shared API rollout file** — the explicit `lead_capture` schema/materialization case now lives under `apps/api/tests/e2e/test_lead_capture_release_rollout_compose_e2e.py`
- [x] **Compose E2E tests: split excluded solution integrations out of the shared Layer-2 compose file** — shared compose coverage now keeps only NFQ-safe `notifications` / `telematics_ingestion` behavior, while excluded solution contracts live under `packages/platform-core/tests/e2e/test_lead_capture_excluded_solutions_integrations_compose_e2e.py`
- [x] **Compose E2E tests: split explicit lead-capture governance contract out of the shared wave7 governance file** — the template/plugin merge case now lives under `packages/platform-core/tests/e2e/test_lead_capture_agent_governance_compose.py`
- [x] **Compose E2E tests: keep shared rollout chaos fixtures boundary-safe** — the wave7 worker-restart and DB-restart rollout chaos tests now use the shipped `notifications` solution instead of excluded `lead_capture`
- [x] **Compose E2E tests: split explicit schedule-management approval contracts out of the shared wave6 hardening file** — the approval-gate reject/approve/timeout cases now live under `packages/platform-core/tests/e2e/test_schedule_management_wave6_approval_compose.py`
- [x] **Compose E2E tests: keep shared voice/runtime fixtures boundary-safe** — `test_voice_pipeline_compose.py` now uses shipped `notifications` instead of excluded `call_monitoring` when it only proves generic voice webhook, transcript, takeover, and room-metadata behavior
- [x] **Compose E2E tests: keep shared wave6 runtime fixtures boundary-safe** — the generic usage-metering and tenant provision/offboard hardening tests now use shipped `notifications` instead of excluded `call_monitoring` / `lead_capture`
- [x] **E2E tests: DO NOT skip platform gating tests** — `solution-gating.spec.ts` tests platform behavior
- [x] **Export script: strip purely solution-specific test files** for non-contracted solutions
- [x] **Export script: keep platform fixture tests** — adapt solution-name references in conftest fixtures to use installed solutions only
- [x] **Architecture tests: include `tests/architecture/` in the boundary audit** — keep structural enforcement tests, but treat excluded-capability literals as legitimate only when they enforce repo/export/runtime boundaries instead of product behavior
- [x] **Verify NFQ export** — zero `lead_capture`/`schedule_management`/`operations_monitor` test files, platform tests still pass

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/appointment_booking/tests/api_integration/test_clinic_*.py` (6 files) | Create | Own appointment-booking API integration coverage inside the solution package |
| `solutions/outbound_campaigns/tests/api_integration/test_campaigns.py` | Create | Own outbound-campaign API integration coverage inside the solution package |
| `solutions/driver_verification/tests/temporal/test_driver_verification_*.py` (3 files) | Create | Own driver-verification Temporal coverage inside the solution package |
| `solutions/outbound_campaigns/tests/temporal/test_campaign_*.py` (3 files) | Create | Own outbound-campaign Temporal coverage inside the solution package |
| `solutions/appointment_booking/ui/tests/clinic-bookings-api.test.ts` | Create | Own appointment-booking web API client coverage inside the solution UI package |
| `solutions/appointment_booking/ui/tests/clinic-knowledge-base-api.test.ts` | Create | Own appointment-booking knowledge-base client coverage inside the solution UI package |
| `solutions/driver_verification/ui/tests/driver-verification-api.test.ts` | Create | Own driver-verification web API client coverage inside the solution UI package |
| `apps/web/e2e/clinic-bookings.spec.ts` | Modify | Conditional on NEXT_PUBLIC_SOLUTIONS |
| `apps/web/e2e/clinic-browser-voice.spec.ts` | Modify | Conditional on NEXT_PUBLIC_SOLUTIONS |
| `apps/web/e2e/clinic-knowledge-base.spec.ts` | Modify | Conditional on NEXT_PUBLIC_SOLUTIONS |
| `apps/web/e2e/driver-verification.spec.ts` | Modify | Conditional on NEXT_PUBLIC_SOLUTIONS |
| `tools/scripts/artifact/export-client.sh` | Modify | Add test file filtering by solution scope |

## Implementation Notes

### Python: file-level partitioning (NOT markers)

**Why not markers:** Clinic tests like `test_clinic_booking.py` import `appointment_booking.api` at module scope. If the package isn't installed, pytest fails during *collection* before any marker/conftest skip can run. Marker-based filtering is impossible for tests that import solution code.

**Solution:** Move pure solution test files into `solutions/{name}/tests/api_integration/` or `solutions/{name}/tests/temporal/` so they're physically inside the solution package. When the solution is excluded from the export, its tests go with it.

```bash
# Example: moved clinic API tests now run from the solution package directly
uv run pytest solutions/appointment_booking/tests/api_integration/test_clinic_booking.py -q --tb=short
```

For files that can't be moved (mixed platform+solution imports), keep them in the platform test tree and clean their fixtures instead of moving them blindly.

### TypeScript: package-local solution web tests

Pure solution API-client/UI tests belong in the solution UI package:

```bash
pnpm -C solutions/appointment_booking/ui test -- tests/clinic-bookings-api.test.ts
```

### Playwright skip pattern

```typescript
test.describe("clinic bookings", () => {
  test.skip(!process.env.NEXT_PUBLIC_SOLUTIONS?.includes("appointment_booking"),
    "appointment_booking solution not enabled");
  // ... tests
});
```

### Key distinction: pure vs fixture

- **Pure solution test:** imports from `solutions/{name}/`, tests a solution endpoint, or exercises solution UI. STRIP from non-contracted exports.
- **Platform fixture test:** tests platform behavior (gating, tenancy, connectors) using solution names as example data. KEEP in all exports — adapt fixtures via conftest to use installed solutions.

## Acceptance Criteria

- [x] Pure solution API tests physically live in `solutions/{name}/tests/`, not in `apps/api/tests/`
- [x] Pure solution temporal-worker tests physically live in `solutions/{name}/tests/`, not in `apps/temporal-worker/tests/`
- [x] Platform fixture tests remain in `apps/*/tests/` (they test platform behavior, not solution logic)
- [x] Pure solution web unit tests physically live in `solutions/{name}/ui/tests/`, not in `apps/web/tests/`
- [x] E2E tests skip when `NEXT_PUBLIC_SOLUTIONS` doesn't include the solution
- [x] Platform fixture tests in `apps/api/tests/` and `apps/temporal-worker/tests/` stop naming excluded solutions in shared fixture data
- [x] Architecture tests are explicitly audited as shared enforcement tests, and their path/runtime literals are allowed only when they encode repo/export/runtime invariants
- [x] `pytest solutions/{name}/tests/**` can run clinic/driver/outbound solution tests separately
- [x] Export strips purely solution-specific test files for non-contracted solutions
- [x] Exported platform tests still pass (no broken imports from stripped solutions)
- [x] `grep -r "lead_capture\|schedule_management\|operations_monitor" /tmp/nfq-export/apps/*/tests/` returns zero matches in pure solution test files
- [x] Contracted solution tests remain intact and pass

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
- Architecture isolation tests: `tests/architecture/test_artifact_exclusion.py`
