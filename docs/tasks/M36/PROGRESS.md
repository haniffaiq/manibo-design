# M36: Platform API Route Topology Phase 1 — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Establish package pattern with auth, workflows, and internal routes | Completed | 2026-04-11 |
| T02 | Convert connectors to a package-backed route module | Completed | 2026-04-11 |
| T03 | Move agent-governance routes into `routes/agents` | Completed | 2026-04-11 |
| T04 | Convert public ingress to a package-backed route module | Completed | 2026-04-11 |
| T05 | Move telephony routes into `routes/telephony` | Completed | 2026-04-11 |
| T06 | Move tenancy and release routes into `routes/tenancy` | Completed | 2026-04-11 |
| T07 | Move call-ops core routes into `routes/call_ops` | Completed | 2026-04-11 |
| T08 | Move call-ops admin and browser routes into `routes/call_ops` | Completed | 2026-04-11 |
| T09 | Convert observability and reports into `routes/observability` | Completed | 2026-04-11 |
| T10 | Add route topology guards and prove inventory stability | Completed | 2026-04-11 |

## Notes

- M36 was explicitly activated by the human on 2026-04-11 and merged on 2026-04-12 via PR `#838`.
- T01 completed on 2026-04-11:
  - converted `auth` and `workflows` into package-backed route modules with `router.py` + `__init__.py`
  - moved `internal_agent_config.py`, `internal_llm_policy.py`, and `internal_test_call_runtime.py` under `routes/internal/`
  - preserved current top-level imports with thin compatibility shims
  - kept focused auth/workflows/internal tests green
- T02 completed on 2026-04-11:
  - converted `connectors.py` into `routes/connectors/router.py` with a package `__init__.py`
  - preserved `from platform_api.routes.connectors import create_connectors_router` and the existing `ConnectorService` monkeypatch seam
  - kept connector-focused lint, pyright, and integration/unit tests green after the move
- T03 completed on 2026-04-11:
  - moved `agent_definitions.py`, `admin_agent_definitions.py`, `admin_agents.py`, `admin_agent_starters.py`, `platform_defaults.py`, and `approvals.py` under `routes/agents/`
  - preserved the flat import surface with thin compatibility shims, including the existing admin-agent monkeypatch seam and agent-starter helper export
  - updated the main-wiring architecture test to assert the grouped implementation path while keeping `platform_api.main` imports unchanged
- T04 completed on 2026-04-11:
  - converted `public_ingress.py` into `routes/public_ingress/router.py` with a package `__init__.py`
  - preserved `create_public_ingress_router`, `create_web_chat_runtime_router`, and the existing private-helper compatibility surface used by public-ingress tests
  - kept `platform_api.optional_routes` factory strings unchanged while restoring the `datetime`, repository, and `_service_from_request` monkeypatch seams through the package root
- T05 completed on 2026-04-11:
  - moved the five live telephony route modules under `routes/telephony/` and preserved the flat import paths with thin compatibility shims
  - kept `platform_api.main` telephony imports unchanged and verified the telephony-focused API tests after the move
  - the planning note for `telephony_trunks_support.py` was stale; no such file exists in this repo, so the task regroup covered the actual live telephony surface only
- T06 completed on 2026-04-11:
  - moved `tenants.py`, `tenant_settings.py`, `team_users.py`, `releases.py`, `billing.py`, and `solutions.py` under `routes/tenancy/`
  - restored the flat import surface with thin compatibility shims and preserved monkeypatch seams for `onboard_tenant`, `TeamUsersService`, `BillingService`, and span-correlation helpers
  - kept tenancy-focused lint, pyright, and tenancy/release/billing/team-users/solutions tests green after the move
- T07 completed on 2026-04-11:
  - moved `calls.py`, `call_access.py`, `call_takeover.py`, `calls_history.py`, `calls_live.py`, `calls_observability.py`, `calls_streams.py`, and `calls_test_call.py` under `routes/call_ops/`
  - preserved the flat call-route import surface with thin compatibility shims and restored patch seams for `calls_test_call._test_call_service_from_request`, `calls_history.tenant_db_connection`, and `calls_streams` access/schema helpers
  - updated the call-ops architecture guard to assert against the grouped implementation paths while keeping the flat shims explicit
- T08 completed on 2026-04-11:
  - moved `admin_calls.py`, `browser_voice.py`, `control_plane.py`, `recordings.py`, `operator_events.py`, and `audit_events.py` under `routes/call_ops/`
  - preserved the flat import surface with thin compatibility shims and restored browser-voice/control-plane/event compatibility seams through the old module paths
  - re-exported the call observability response models needed by browser-voice routes and kept the focused browser, control-plane, operator/audit event, and recording tests green after the regroup
- T09 completed on 2026-04-11:
  - converted `observability.py` into the package-backed module `routes/observability/router.py` with a package `__init__.py` that preserves the existing `platform_api.routes.observability` import surface, including the private helpers read by observability tests
  - moved `reports.py`, `observability_enrichers.py`, and `span_correlation.py` under `routes/observability/` and restored the old flat imports with thin shims
  - preserved the `reports` monkeypatch seams by routing report fetchers and span-correlation calls back through the top-level `platform_api.routes.reports` shim
  - the planning note about `observability_channel_runtime_support.py` was stale; no such live file exists in this repo, so the regroup covered the real observability support surface only
- T10 completed on 2026-04-11:
  - added `tests/architecture/test_platform_api_route_topology.py` to enforce the allowed route packages, the explicit top-level shim list, and the `health.py` implementation exception
  - kept the existing main-wiring and refactor-hardening architecture tests green after the regroup
  - regenerated `docs/arch/generated/api_inventory.*` so the recorded `source_module` values point at the new grouped implementation modules while the published endpoint inventory remains unchanged
  - phase 1 implementation landed cleanly and merged via PR `#838`
- Design artifact: `wiki/queries/2026-04-11-design-platform-api-route-topology-refactor.md`
- Current measured scope is 45 route files total in `apps/api/src/platform_api/routes`, with 44 files in regroup scope and `health.py` as the one deliberate flat exception.
- Phase 1 is structural only. Schema extraction, helper dedupe, and dead-surface removal are explicitly deferred.
- The compatibility strategy is mixed by design: package `__init__.py` re-exports for singleton route modules, thin top-level shim modules for grouped domain packages.
