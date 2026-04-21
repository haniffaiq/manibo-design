# M11: Solution Package Isolation + Source Distribution — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Create solution UI package template and conventions | Done | 2026-03-23 |
| T01b | Create packages/web-shared for solution dependencies | Done | 2026-03-23 |
| T02 | Move appointment-booking UI to solutions/appointment_booking/ui/ | Done | 2026-03-23 |
| T03 | Expand driver-verification UI package with real code | Done | 2026-03-23 |
| T04 | Build solution registry generator script | Done | 2026-03-23 |
| T05 | Wire generated registry into apps/web | Done | 2026-03-23 |
| T06 | Add profile-specific pnpm-workspace.yaml | Done | 2026-03-23 |
| T07 | Profile build proof | Done | 2026-03-24 |
| T08 | API route filtering in export script | Done | 2026-03-24 |
| T09 | Test tree partitioning by solution scope | Done (partial) | 2026-03-24 |
| T10 | Export proof: build + lint + typecheck on filtered source | Done | 2026-03-24 |
| T11 | Export proof: run contracted tests only | Done | 2026-03-24 |
| T12 | CI gate: export check on relevant PRs | Done | 2026-03-24 |
| T13 | Document source distribution procedure | Done | 2026-03-24 |
| T14 | Playwright regression after solution move | Done | 2026-03-24 |

## Notes

Scope: isolate solution UI code into standalone packages under solutions/*/ui/, build a registry generator so apps/web discovers solutions dynamically, and harden the source distribution export pipeline for profile-filtered builds.

2026-04-02 NFQ clean-repo prep adjustment:
- NFQ manifest now ships `telematics_ingestion` instead of `outbound_campaigns`.
- Export proof now prunes exported test files by explicit excluded-path keywords plus direct imports into excluded NFQ surfaces (`campaign`, `public_ingress`, `lead_capture`, `schedule_management`, `operations_monitor`, `outbound_campaigns`, etc.) instead of deleting contracted tests on blind content matches.
- `docs/requirements/nfq.md` now states the scope boundary explicitly: NFQ covers voice-call operations and workflow reporting, not public website chat, widget runtime, or public-ingress funnel analytics, even though those capabilities live in shared platform layers.
- API and Temporal worker shell boundaries now support disabling public-ingress/outbound cleanup surfaces for the exported NFQ boot path without rewriting the full private repo runtime.
- Verified export proof at `/tmp/nfq-export-check.rpoB6b/export` with:
  - `tools/scripts/artifact/export-client.sh nfq /tmp/nfq-export-check.rpoB6b/export`
  - `uv sync`
  - `pnpm install`
  - `uv run ruff check .`
  - `uv run pyright -p pyrightconfig.ci.json`
  - `pnpm lint`
  - `pnpm check-types`
  - `pnpm -C apps/web build`

2026-04-02 NFQ export boundary follow-up:
- `distribution/clients/nfq.yaml` now strips private control-plane workflows, Hetzner-only docs/infra, internal task tracking, root CI-agent scripts, and architecture tests from the NFQ seed.
- `tools/scripts/artifact/export-client.sh` now prunes `apps/web/tests/**` and `apps/web/e2e/**` when they still hardcode excluded NFQ solution literals, which removed the leaked `lead_capture` observability/admin fixture specs without reverting to the old blind content grep.
- Shared web/admin defaults and tests now use NFQ-safe examples (`appointment_booking`, `driver_verification`, `telematics_ingestion`) instead of `lead_capture` / `call_monitoring` / `operations_monitor`.
- Verified refreshed export proof at `/tmp/nfq-export-check.8bg9bg/export` with:
  - `tools/scripts/artifact/export-client.sh nfq /tmp/nfq-export-check.8bg9bg/export`
  - `uv sync`
  - `pnpm install`
  - `uv run ruff check .`
  - `uv run pyright -p pyrightconfig.ci.json`
  - `pnpm lint`
  - `pnpm check-types`
  - `pnpm -C apps/web build`
  - `pnpm -C apps/web test -- tests/admin-releases-api.test.ts tests/admin-tenants-api.test.ts tests/solutions.test.ts tests/admin-solutions-page.test.tsx tests/admin-solutions-states.test.ts tests/solution-route-wrappers.test.ts`
- Playwright proof for `apps/web/e2e/admin-releases.spec.ts` and `apps/web/e2e/integrations.spec.ts` did not complete in the export sandbox because the dev server failed to load the native `lightningcss.darwin-arm64.node` module. That is an environment/runtime issue, not a typecheck/build failure in the exported code.

2026-04-02 NFQ CI lane definition follow-up:
- `wiki/distribution/nfq/clean-repo-migration-prep-2026-04-01.md` phase 5 now defines concrete workflow names, triggers, responsibilities, and guardrails instead of the old one-line stub.
- Added a staged clean-repo workflow template set under `distribution/clients/nfq/repo-template/.github/workflows/`:
  - `nfq-boundary-proof.yml`
- Added `distribution/clients/nfq/repo-template/README.md` so phase 6 has a clear source of truth for which workflows belong in the new NFQ repo and which private-repo workflows must stay out.
- Explicitly deferred PR checks, image-build, and GCP deploy automation; pretending the current GCP subtree is a production-closed deploy story would be trash.
- `tools/scripts/artifact/export-client.sh` now overlays `distribution/clients/nfq/repo-template/.github/**` into the exported seed after stripping the private repo's live workflow directory, so the NFQ export finally contains the staged workflow set instead of ending with no CI at all.
- Verified refreshed export proof at `/tmp/nfq-export-nobuild.8sCypa/export`; the exported seed now contains exactly:
  - `.github/workflows/nfq-boundary-proof.yml`

2026-04-02 NFQ seed artifact cleanup follow-up:
- `distribution/clients/nfq.yaml` now strips root agent-instruction files (`AGENTS.md`, `CLAUDE.md`) and private GitHub issue/PR templates from the clean NFQ seed.
- `distribution/clients/nfq/repo-template/.github/workflows/nfq-boundary-proof.yml` now treats those paths as banned, so the staged NFQ repo cannot quietly grow private repo process baggage back.

2026-04-02 NFQ local-stack and cluster cleanup follow-up:
- `distribution/clients/nfq.yaml` now strips `clusters/`, root compose/livekit files, local Docker support directories, and non-GCP infra support trees (`infra/ci-runner`, `infra/k8s`, `infra/terraform`) from the clean NFQ seed.
- `distribution/clients/nfq/repo-template/.github/workflows/nfq-boundary-proof.yml` now treats those paths as banned, so the initial NFQ repo cannot quietly regrow local stack baggage while the plan still says “GCP infra only.”

2026-04-02 NFQ docs-surface cleanup follow-up:
- `distribution/clients/nfq.yaml` now strips obviously private or historical docs from the clean seed: milestone/history docs, review/research/tender/tracker directories, radiology-specific docs, solution-internal docs, and root doc artifacts like the source-repo roadmap and vision files.
- `distribution/clients/nfq/repo-template/.github/workflows/nfq-boundary-proof.yml` now treats those doc paths as banned, so the clean NFQ repo cannot quietly regrow private planning/history baggage after seeding.

2026-04-02 NFQ demo/agent docs cleanup follow-up:
- `distribution/clients/nfq.yaml` now strips the next obvious non-NFQ doc surfaces from the seed: review packs, agent-control-plane docs, and demo/local-stack runbooks that only make sense in the source repo.
- The manifest now also strips obviously private or off-scope feature specs covering internal agent scaffolding, autonomous dev tooling, demo priorities, GitHub review automation, outbound-campaign planning, nightly regression planning, and software-engineer-agent experiments.
- `distribution/clients/nfq/repo-template/.github/workflows/nfq-boundary-proof.yml` now treats those docs as banned, so the initial NFQ repo cannot quietly regrow agent/demo/review baggage after seeding.

2026-04-02 NFQ export-map cleanup follow-up:
- `tools/scripts/artifact/export-client.sh` now overlays all staged NFQ repo-template assets, not just `.github/**`, so export-only doc-map cleanup can live in `distribution/clients/nfq/repo-template/` instead of mutating the private source repo's own doc indexes.
- `distribution/clients/nfq/repo-template/wiki/index.md`, `wiki/design-wiki/index.md`, and `wiki/ops/README.md` now provide NFQ-safe map pages that stop advertising stripped milestone, review, agent, and demo docs in the seeded repo.
- `distribution/clients/nfq.yaml` now strips the clearly wrong survivors that were still broad source-repo artifacts in the export: source-wide generated API inventory files, implementation notes, regression-coverage docs, GCP OIDC setup notes, and the outbound-only design doc.

2026-04-02 NFQ docs-with-missing-tooling cleanup:
- `distribution/clients/nfq.yaml` now also strips docs that still depended on scripts or demo assets intentionally removed from the seed: build-profile artifact exclusion guidance, phone-number onboarding runbooks, and the source-repo voice runtime feature spec.
- The staged NFQ map pages under `distribution/clients/nfq/repo-template/docs/**` were updated to stop advertising those dropped docs, so the exported repo no longer points at source-repo-only tooling guidance by default.

2026-04-02 NFQ source-repo voice-spec cleanup:
- `distribution/clients/nfq.yaml` now also strips `wiki/design-docs/m8-voice-runtime.md`, because it still pointed straight back to a source-repo-only feature spec and added more noise than value in the seeded NFQ repo.
- `distribution/clients/nfq/repo-template/wiki/design-wiki/index.md` now stops advertising that stripped voice-runtime design doc in the clean NFQ seed.

2026-04-02 NFQ checklist removal follow-up:
- `distribution/clients/nfq.yaml` now strips `docs/requirements/checklist.md` from the clean NFQ seed, matching the decision that the checklist is internal execution tracking and not partner-facing repo content.
- `distribution/clients/nfq/repo-template/.github/workflows/nfq-boundary-proof.yml` now treats that checklist as banned and no longer uses it as a literal-scan target.
- `distribution/clients/nfq/repo-template/wiki/index.md` and `wiki/distribution/nfq/platform-architecture-status-2026-03-09.md` now stop presenting the checklist as part of the seeded NFQ repo contract.

2026-04-02 NFQ phase-4 pure test relocation:
- Moved pure appointment-booking API integration tests out of `apps/api/tests/integration/` into `solutions/appointment_booking/tests/api_integration/`.
- Moved pure outbound-campaign API integration tests out of `apps/api/tests/integration/` into `solutions/outbound_campaigns/tests/api_integration/`.
- Moved pure driver-verification and outbound-campaign Temporal tests out of `apps/temporal-worker/tests/**` into `solutions/driver_verification/tests/temporal/` and `solutions/outbound_campaigns/tests/temporal/`.
- Moved pure solution web API-client tests out of `apps/web/tests/` into `solutions/appointment_booking/ui/tests/` and `solutions/driver_verification/ui/tests/`, added package-local `vitest` scripts, and expanded the solution UI `tsconfig.json` files to include `tests/`.
- Removed the temporary `apps/web/tests/solution-test-helpers.ts` indirection because physical ownership is cleaner than lazy-loading around the wrong directory boundary.
- `apps/web/e2e/clinic-bookings.spec.ts` and `apps/web/e2e/clinic-knowledge-base.spec.ts` still keep shared-shell Playwright coverage in `apps/web/e2e/`, but they no longer assume the solution package is always installed at module load time.
- Verified the moved non-Docker slices with:
  - `pnpm -C solutions/appointment_booking/ui test -- tests/clinic-bookings-api.test.ts tests/clinic-knowledge-base-api.test.ts`
  - `pnpm -C solutions/driver_verification/ui test -- tests/driver-verification-api.test.ts`
  - `uv run pytest solutions/appointment_booking/tests/api_integration/test_clinic_availability.py solutions/appointment_booking/tests/api_integration/test_clinic_booking.py solutions/appointment_booking/tests/api_integration/test_clinic_knowledge_base.py solutions/appointment_booking/tests/api_integration/test_clinic_patient_identification.py -q --tb=short`
  - `uv run pytest solutions/appointment_booking/tests/api_integration/test_clinic_browser_session.py -q --tb=short`
  - `uv run pytest solutions/outbound_campaigns/tests/temporal/test_campaign_persistence_activities.py solutions/outbound_campaigns/tests/temporal/test_campaign_workflow.py solutions/driver_verification/tests/temporal/test_driver_verification_target_resolution.py -q --tb=short`
- Remaining gap: container-backed moved tests (`solutions/outbound_campaigns/tests/api_integration/test_campaigns.py`, `solutions/outbound_campaigns/tests/temporal/test_campaign_e2e.py`, and the driver-verification e2e/governance Temporal tests) still need a Docker-capable proof run.

2026-04-02 NFQ phase-4 platform fixture cleanup:
- Common solution-gating tests no longer use excluded solution names as throwaway fixture data when they are only proving generic gating mechanics.
- `apps/temporal-worker/tests/unit/test_solution_gating.py` now uses `example_solution` instead of `outbound_campaigns`.
- `apps/temporal-worker/tests/unit/test_tenancy_enable_solution_closure.py` now uses neutral synthetic manifests (`dependent_solution`, `optional_solution`) for generic requires/optional closure behavior, while keeping the real Hoptrans closure proof on `driver_verification` + `telematics_ingestion`.
- `apps/temporal-worker/tests/integration/platform_core/test_solution_gating_enforcement.py` now uses neutral example solution names for the pure registry-filtering assertions.
- `apps/api/tests/integration/test_solutions_api.py` now uses NFQ-safe disabled fixture data (`driver_verification`) in the tenant visibility case instead of `call_monitoring`.
- Verified with:
  - `uv run pytest apps/temporal-worker/tests/unit/test_solution_gating.py apps/temporal-worker/tests/unit/test_tenancy_enable_solution_closure.py -q --tb=short`
  - `uv run pytest apps/temporal-worker/tests/integration/platform_core/test_solution_gating_enforcement.py -k "test_tool_registry_" -q --tb=short`
  - `uv run ruff check apps/temporal-worker/tests/unit/test_solution_gating.py apps/temporal-worker/tests/unit/test_tenancy_enable_solution_closure.py apps/temporal-worker/tests/integration/platform_core/test_solution_gating_enforcement.py apps/api/tests/integration/test_solutions_api.py`
- Remaining gap: the container-backed solution visibility/API lifecycle tests still need Docker-backed proof, and real solution-contract tests that intentionally exercise `schedule_management` or `lead_capture` are still open for a later pass rather than being renamed blindly.

2026-04-02 NFQ phase-4 shared web fixture cleanup:
- `apps/web/e2e/observability.spec.ts` no longer uses `lead_capture` as fake tenant-composition drift data in the shared observability flow.
- The shared E2E drift scenario now uses `driver_verification` plus `appointment_booking`, which is still meaningful for rollout-drift behavior without leaking excluded solution names into common NFQ-facing browser tests.
- Verified with:
  - `pnpm -C apps/web playwright:test --list e2e/observability.spec.ts`

2026-04-02 NFQ phase-4 shared platform fixture cleanup:
- Generic shared-platform tests now use NFQ-safe solution names instead of excluded solutions when they are not proving excluded-solution contracts:
  - `apps/api/tests/integration/test_release_rollout.py`
  - `apps/api/tests/integration/test_observability_solution_enrichers.py`
  - `apps/api/tests/integration/test_solutions_api.py`
  - `apps/temporal-worker/tests/integration/test_solution_lifecycle_versions.py`
  - `apps/temporal-worker/tests/unit/test_tenancy_activity_delegation.py`
  - `apps/api/tests/integration/test_connectors.py` now uses shipped `appointment_booking` / `clinic_webhook` fixtures for shared connector catalog and solution-scoped adapter gating behavior instead of excluded lead-capture adapter defaults
  - `apps/api/tests/integration/test_agent_definitions.py` and `apps/api/tests/integration/test_agent_definitions_update_draft.py` now use neutral `assistant` fixture naming in the shared platform cases instead of fake `sales` agents, and no longer seed `lead_capture` in generic YAML
  - `solutions/lead_capture/tests/integration/test_agent_template_reuse_api.py` now owns the lead-capture template reuse contract instead of leaving it inside the common `apps/api/tests/integration/test_agent_definitions.py` file
  - `packages/platform-core/tests/integration/test_agent_governance_lifecycle.py` and `packages/platform-core/tests/integration/test_agent_governance_registry.py` now use neutral `assistant` fixtures plus explicit NFQ-safe enabled solutions (`appointment_booking` for voice+guardrails semantics, `driver_verification` for no-guardrails lifecycle/override semantics) instead of fake `sales` / `support` agents and `lead_capture` plugin defaults
  - `packages/platform-core/tests/integration/governance_test_support.py` now seeds shared governance tenants with an explicit enabled solution instead of hiding `lead_capture` as a fixture default
  - `packages/platform-core/tests/unit/test_voice/test_webhook.py` now uses NFQ-safe enabled-solution fixtures (`appointment_booking` / `notifications`) in the generic webhook workflow-input and metadata cases instead of excluded `outbound_campaigns` / `call_monitoring` defaults
  - `apps/api/tests/integration/test_public_ingress_tenant_export.py` now owns the public-ingress tenant export/offboard contract instead of leaving that capability-specific case inside the shared `apps/api/tests/integration/test_tenants.py` file
  - `apps/api/tests/integration/test_public_ingress_widget_analytics.py` now owns the widget-analytics public-ingress KPI contract instead of leaving `lead_capture_rate` assertions inside `apps/api/tests/integration/test_reports_kpis.py`
  - `apps/api/tests/integration/test_public_ingress_observability.py` now owns the public-ingress interactive-channel and widget-runtime observability contract instead of leaving widget/guest-session runtime coverage inside the shared `apps/api/tests/integration/test_observability.py` file
  - `apps/api/tests/unit/test_public_ingress_router_mounting.py` now owns the explicit `public_ingress` route-scope mounting contract instead of leaving that excluded capability case inside the shared `apps/api/tests/unit/test_solution_router_mounting.py` parameter matrix
  - `packages/platform-core/tests/integration/test_lead_capture_connector_registry.py` now owns the explicit `lead_capture_webhook` catalog contract instead of leaving that excluded solution contract inside the shared Layer-2 connector registry file
  - `apps/temporal-worker/tests/integration/platform_core/test_public_ingress_tenant_lifecycle_workflows.py` now owns explicit widget / guest-session / public-chat cleanup and offboard contracts instead of leaving them inside the shared `test_tenant_lifecycle_workflows.py` file
  - `apps/temporal-worker/tests/integration/platform_core/tenant_lifecycle_test_support.py` now holds the reusable Postgres/alembic/Temporal harness plus public-ingress seed helpers needed by both shared and excluded-capability lifecycle tests
  - `packages/platform-core/tests/unit/test_tenancy/test_public_ingress_provisioning_service.py` now owns the explicit guest-session/widget/KPI/operator cleanup unit contract instead of leaving that capability-specific behavior inside the shared `packages/platform-core/tests/unit/test_tenancy/test_provisioning_service.py` file
  - `packages/platform-core/tests/unit/test_tenancy/provisioning_service_test_support.py` now holds the reusable fake pool/connection harness shared by the generic and public-ingress provisioning-service unit files
  - `packages/platform-core/tests/unit/test_public_ingress_public_schema_models.py` now owns the explicit `WidgetConfig` / `GuestSessionControl` model coverage plus the `public_ingress` bootstrap migration instead of leaving those excluded-capability checks inside the shared `packages/platform-core/tests/unit/test_public_schema_models.py` file
  - `packages/platform-core/tests/unit/test_public_schema_models.py` now uses the shipped `notifications` solution instead of excluded `outbound_campaigns` defaults in the generic `TenantSolution` / `SolutionMigrationState` model cases
  - `packages/platform-core/tests/unit/test_tenancy/test_onboarding.py` and `packages/platform-core/tests/unit/test_tenancy/test_workflows.py` now use the shipped `notifications` solution instead of excluded `lead_capture` defaults when they only prove generic tenant onboarding/workflow orchestration
  - `packages/platform-core/tests/unit/test_solutions/test_gating.py` now uses `example_solution` instead of excluded `outbound_campaigns` when it only proves solution-name passthrough and FastAPI dependency behavior
  - `packages/platform-core/tests/integration/test_solution_migration_runner.py` and `packages/platform-core/tests/integration/test_release_units_and_rollout.py` now use the shipped `notifications` solution instead of excluded `lead_capture` defaults when they only prove generic migration-runner and rollout mechanics
  - `apps/api/tests/e2e/test_release_rollout_compose_e2e.py` now keeps only generic rollout mechanics, and the explicit `lead_capture` schema/materialization contract moved into `apps/api/tests/e2e/test_lead_capture_release_rollout_compose_e2e.py`
  - `packages/platform-core/tests/e2e/test_solutions_integrations_compose_e2e.py` now keeps only NFQ-safe `notifications` / `telematics_ingestion` compose coverage, and excluded solution contracts moved into `packages/platform-core/tests/e2e/test_lead_capture_excluded_solutions_integrations_compose_e2e.py`
  - `packages/platform-core/tests/e2e/test_agent_governance_compose.py` now keeps only generic governed-agent lifecycle/override behavior, and the explicit `lead_capture` template/plugin contract moved into `packages/platform-core/tests/e2e/test_lead_capture_agent_governance_compose.py`
  - `packages/platform-core/tests/e2e/test_release_rollout_chaos_worker_restart_compose.py` and `packages/platform-core/tests/e2e/test_release_rollout_chaos_db_restart_compose.py` now use the shipped `notifications` solution instead of excluded `lead_capture` when they only prove generic rollout recovery under chaos
  - `packages/platform-core/tests/e2e/test_schedule_management_wave6_approval_compose.py` now owns the explicit `schedule_management` approval-gate reject/approve/timeout contract instead of leaving that excluded solution behavior inside the shared `test_operator_audit_retention_compose.py`
  - `packages/platform-core/tests/e2e/test_operator_audit_retention_compose.py` now keeps only generic hardening/runtime proof and uses shipped `notifications` instead of excluded `call_monitoring` / `lead_capture` when it only proves usage metering and tenant provision/offboard behavior
  - `packages/platform-core/tests/e2e/test_voice_pipeline_compose.py` now uses shipped `notifications` instead of excluded `call_monitoring` when it only proves generic voice webhook, transcript persistence, takeover, escalation, and outbound-room metadata behavior
  - `packages/platform-core/tests/e2e/test_release_rollout_concurrency_compose.py` now uses shipped `notifications` instead of excluded `lead_capture` when it only proves generic rollout-lock concurrency behavior
  - `packages/platform-core/tests/integration/test_tenant_solution_config_audit.py` now uses shipped `notifications` instead of excluded `lead_capture` when it only proves generic tenant-solution config audit behavior
  - `packages/platform-core/tests/unit/test_releases/test_rollout_execution.py`, `packages/platform-core/tests/unit/test_solutions/test_manifest.py`, `packages/platform-core/tests/unit/test_agents/test_governance_update_draft_version.py`, and `packages/platform-core/tests/unit/test_agents/test_tenant_overrides.py` now use neutral or NFQ-safe fixture names (`example_solution`, `assistant`, `unsupported_plugin`, `notifications`) instead of excluded `lead_capture` / `outbound_campaigns` defaults when they only prove generic platform behavior
  - `solutions/schedule_management/tests/integration/test_admin_config_schema_api.py` now owns the disabled-solution admin config-schema contract instead of leaving it inside the common `apps/api/tests/integration/test_solutions_api.py` file
  - `solutions/schedule_management/tests/integration/test_approval_audit_events.py` now owns the approval-audit workflow contract instead of leaving it inside `apps/temporal-worker/tests/integration/platform_core/`
- Verified with:
  - `uv run pytest apps/api/tests/integration/test_release_rollout.py apps/temporal-worker/tests/unit/test_tenancy_activity_delegation.py -q --tb=short`
  - `uv run ruff check apps/api/tests/integration/test_release_rollout.py apps/api/tests/integration/test_observability_solution_enrichers.py apps/api/tests/integration/test_solutions_api.py apps/temporal-worker/tests/integration/test_solution_lifecycle_versions.py apps/temporal-worker/tests/unit/test_tenancy_activity_delegation.py`
  - `uv run ruff check apps/api/tests/integration/agent_definitions_support.py apps/api/tests/integration/test_agent_definitions.py apps/api/tests/integration/test_agent_definitions_update_draft.py solutions/lead_capture/tests/integration/test_agent_template_reuse_api.py`
  - `uv run pytest apps/api/tests/integration/test_agent_definitions.py apps/api/tests/integration/test_agent_definitions_update_draft.py solutions/lead_capture/tests/integration/test_agent_template_reuse_api.py -q --tb=short`
  - `uv run ruff check packages/platform-core/tests/integration/governance_test_support.py packages/platform-core/tests/integration/test_agent_governance_lifecycle.py packages/platform-core/tests/integration/test_agent_governance_registry.py`
  - `uv run pytest packages/platform-core/tests/integration/test_agent_governance_lifecycle.py packages/platform-core/tests/integration/test_agent_governance_registry.py -q --tb=short`
  - `uv run ruff check packages/platform-core/tests/unit/test_voice/test_webhook.py`
  - `uv run pytest packages/platform-core/tests/unit/test_voice/test_webhook.py -k "test_valid_jwt_signed_payload_returns_202 or test_valid_payload_returns_202 or test_metadata_includes_non_empty_user_id or test_enabled_plugins_passed_to_workflow or test_call_row_omits_solution_name_without_explicit_agent_plugin or test_call_row_uses_explicit_agent_plugin_solution_name or test_call_row_omits_solution_name_when_compiled_plugin_is_not_tenant_enabled" -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_public_ingress_observability.py -q --tb=short`
  - `uv run pytest apps/api/tests/integration/test_observability.py -k "test_tenant_observability_call_detail_and_timeline_include_availability_and_tool_markers" -q --tb=short`
  - `uv run pytest apps/api/tests/unit/test_solution_router_mounting.py apps/api/tests/unit/test_public_ingress_router_mounting.py -q --tb=short`
  - `uv run pytest apps/temporal-worker/tests/integration/platform_core/test_tenant_lifecycle_workflows.py apps/temporal-worker/tests/integration/platform_core/test_public_ingress_tenant_lifecycle_workflows.py -q --tb=short`
  - `uv run pytest packages/platform-core/tests/unit/test_tenancy/test_provisioning_service.py packages/platform-core/tests/unit/test_tenancy/test_public_ingress_provisioning_service.py -q --tb=short`
  - `uv run pytest packages/platform-core/tests/unit/test_tenancy/test_onboarding.py packages/platform-core/tests/unit/test_tenancy/test_workflows.py packages/platform-core/tests/unit/test_solutions/test_gating.py -q --tb=short`
  - `uv run pytest packages/platform-core/tests/unit/test_public_schema_models.py packages/platform-core/tests/unit/test_public_ingress_public_schema_models.py -q --tb=short`
  - `uv run pytest packages/platform-core/tests/integration/test_solution_migration_runner.py packages/platform-core/tests/integration/test_release_units_and_rollout.py -q --tb=short`
  - `uv run pytest packages/platform-core/tests/integration/test_connector_registry_and_health.py packages/platform-core/tests/integration/test_lead_capture_connector_registry.py -k "test_connector_catalog_excludes_internal_only_adapters or test_lead_capture_webhook_catalog_contract" -q --tb=short`
  - `uv run pytest --collect-only apps/api/tests/e2e/test_release_rollout_compose_e2e.py apps/api/tests/e2e/test_lead_capture_release_rollout_compose_e2e.py packages/platform-core/tests/e2e/test_solutions_integrations_compose_e2e.py packages/platform-core/tests/e2e/test_lead_capture_excluded_solutions_integrations_compose_e2e.py packages/platform-core/tests/e2e/test_agent_governance_compose.py packages/platform-core/tests/e2e/test_lead_capture_agent_governance_compose.py -q`
  - `uv run pytest packages/platform-core/tests/e2e/test_release_rollout_chaos_worker_restart_compose.py packages/platform-core/tests/e2e/test_release_rollout_chaos_db_restart_compose.py packages/platform-core/tests/e2e/test_solutions_integrations_compose_e2e.py packages/platform-core/tests/e2e/test_lead_capture_excluded_solutions_integrations_compose_e2e.py packages/platform-core/tests/e2e/test_agent_governance_compose.py packages/platform-core/tests/e2e/test_lead_capture_agent_governance_compose.py apps/api/tests/e2e/test_release_rollout_compose_e2e.py apps/api/tests/e2e/test_lead_capture_release_rollout_compose_e2e.py -q --tb=short`
  - `uv run pytest --collect-only packages/platform-core/tests/e2e/test_voice_pipeline_compose.py packages/platform-core/tests/e2e/test_operator_audit_retention_compose.py packages/platform-core/tests/e2e/test_schedule_management_wave6_approval_compose.py -q`
  - `uv run pytest packages/platform-core/tests/e2e/test_voice_pipeline_compose.py packages/platform-core/tests/e2e/test_operator_audit_retention_compose.py packages/platform-core/tests/e2e/test_schedule_management_wave6_approval_compose.py -q --tb=short`
  - `uv run pytest tests/architecture/test_artifact_exclusion.py tests/architecture/test_local_observability_wiring.py -q --tb=short`
- Remaining gap: the explicit `apps/api/tests/integration/test_public_ingress*.py` API files are now correctly isolated and excluded by path token, but shared non-public-ingress observability coverage still deserves a separate audit for future excluded-capability drift.
- `tests/architecture/` is now explicitly part of the phase-4 audit contract: these files stay as shared enforcement tests, but excluded-capability literals are only acceptable there when they encode repo/export/runtime invariants like artifact exclusion, file-size guards, or local observability wiring.

Depends on: solutions/ directory structure already exists for Python packages. UI packages are new.
Export script exists: `tools/scripts/artifact/export-client.sh`
Client manifest exists: `distribution/clients/nfq.yaml`
Architecture isolation tests exist: `tests/architecture/test_artifact_exclusion.py`
