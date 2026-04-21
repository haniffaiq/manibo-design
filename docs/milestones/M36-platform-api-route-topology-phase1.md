# M36: Platform API Route Topology Phase 1

Status: done
Completed: 2026-04-12
Created: 2026-04-11
Owner: Jakit
Branch: feat/M36-platform-api-route-topology-phase1
Merged PR: #838
Stream: platform
Depends on: none
Reference: `wiki/queries/2026-04-11-design-platform-api-route-topology-refactor.md`, `wiki/design-docs/fastapi-best-practices.md`

## Goal

Regroup the flat `apps/api/src/platform_api/routes` surface into stable domain subpackages so the API structure becomes navigable and later refactors can happen one module family at a time without mixing file movement with behavior changes. Phase 1 is intentionally structural only: keep endpoint behavior, paths, tags, auth contracts, and import callers working while moving implementation files behind package re-exports and compatibility shims.

## Design Decisions

1. **Topology only** — no endpoint behavior, path, tag, response-model, auth, or dependency-contract changes in this milestone.
2. **Group by domain first** — create `agents`, `call_ops`, `telephony`, `tenancy`, `observability`, `internal`, `public_ingress`, `auth`, `connectors`, and `workflows` seams before any schema or service extraction.
3. **Preserve public imports** — package-backed singleton modules use `__init__.py` re-exports; grouped domains keep thin top-level shim modules so existing import sites keep working during phase 1.
4. **Keep wiring behavior equivalent** — `platform_api.main`, `platform_api.optional_routes`, and the current call-router aggregation must keep mounting the same factories after the regroup.
5. **No deletions in phase 1** — dead-route and dead-endpoint cleanup happens only after the topology settles and caller evidence exists.
6. **`health.py` stays flat** — it is the one explicit route-file exception allowed outside the new domain packages.
7. **Add guardrails immediately** — phase 1 ends with a topology test and API inventory proof so flat sprawl cannot quietly regrow.

## Architecture

```text
Current
+---------------------------------------------+
| routes/*.py flat directory                  |
| route factories + helpers + inline schemas  |
| mixed in one namespace                      |
+---------------------------------------------+
                    |
                    v
+---------------------------------------------+
| main.py / optional_routes.py / calls.py     |
| import scattered files directly             |
+---------------------------------------------+

Target (phase 1)
+---------------------------------------------+
| routes/{domain}/... implementations         |
| auth/, agents/, call_ops/, observability/   |
| telephony/, tenancy/, internal/, ...        |
+---------------------------------------------+
                    |
                    v
+---------------------------------------------+
| stable imports via package re-exports       |
| or thin top-level shim modules              |
+---------------------------------------------+
                    |
                    v
+---------------------------------------------+
| main.py / optional_routes.py keep behavior  |
| and mounted factories unchanged             |
+---------------------------------------------+
```

Phase 1 moves files to stable owners without claiming the deeper cleanup is done. Inline schemas, helper dedupe, and dead-surface removal are explicitly deferred.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Establish package pattern with auth, workflows, and internal routes | done | none |
| T02 | Convert connectors to a package-backed route module | done | T01 |
| T03 | Move agent-governance routes into `routes/agents` | done | T01 |
| T04 | Convert public ingress to a package-backed route module | done | T01 |
| T05 | Move telephony routes into `routes/telephony` | done | T01 |
| T06 | Move tenancy and release routes into `routes/tenancy` | done | T01 |
| T07 | Move call-ops core routes into `routes/call_ops` | done | T01 |
| T08 | Move call-ops admin and browser routes into `routes/call_ops` | done | T07 |
| T09 | Convert observability and reports into `routes/observability` | done | T01 |
| T10 | Add route topology guards and prove inventory stability | done | T02, T03, T04, T05, T06, T08, T09 |

## Acceptance Criteria

- [x] The phase-1 regroup scope moves 44 route/support files under approved domain packages while leaving `health.py` as the one explicit flat exception.
- [x] Existing route-factory import names remain available at their current import sites through package `__init__.py` re-exports or top-level shim modules.
- [x] `apps/api/src/platform_api/main.py`, `apps/api/src/platform_api/optional_routes.py`, and the call-router aggregator keep mounting the same route factories after the regroup.
- [x] No endpoint path, tag, auth, dependency, or response-model contract changes are introduced by this milestone.
- [x] No schema extraction, helper dedupe, dead-route deletion, or dead-endpoint deletion is bundled into this milestone.
- [x] A dedicated topology guard exists and `tools/scripts/check_api_inventory.py` proves the regroup did not change the published API surface accidentally.

## Verification

```bash
uv run ruff check \
  apps/api/src/platform_api \
  apps/api/tests \
  tests/architecture

uv run pyright apps/api/src/platform_api

uv run pytest \
  tests/architecture/test_admin_agents_main_wiring.py \
  tests/architecture/test_api_inventory_contract.py \
  tests/architecture/test_m8_2_refactor_guards.py \
  tests/architecture/test_platform_api_route_topology.py \
  apps/api/tests \
  -q --tb=short

uv run python tools/scripts/check_api_inventory.py

uv run python -c "from platform_api.main import create_platform_api; app = create_platform_api(); print(len(app.routes))"
```

## Non-Goals

- Extracting `schemas.py`, `dependencies.py`, `service.py`, or `queries.py` out of the moved modules
- Removing dead routes or dead endpoints
- Deduplicating span helpers, auth guards, or error mappers
- Changing endpoint tags, prefixes, response contracts, or permission behavior
- Moving logic across layer boundaries outside `apps/api/src/platform_api/routes`
