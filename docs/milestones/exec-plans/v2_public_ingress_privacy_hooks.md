Status: completed
Owner: Codex
Date: 2026-03-15

# V2 Public Ingress Privacy Hooks

## Objective

Close the remaining Phase 3 privacy/export/erasure hole for public ingress so guest-session control data and public-ingress analytics are included in tenant export, public guest access fails closed when a tenant is suspended/offboarded, and residual public-ingress data is erased during tenant offboarding.

## Checklist rows advanced

- `docs/requirements/checklist.md:268`
- `docs/requirements/checklist.md:269`

## Scope

- add an explicit offboarding activity for public-ingress public-schema data
- fail closed in public-ingress auth when the owning tenant is suspended or offboarded
- delete `public.guest_session_controls`, `public.widget_configs`, and public-ingress-owned rows in `public.kpi_events` / `public.operator_events` during tenant offboarding
- keep public-ingress cleanup rollout-safe during mixed-version deploys by skipping missing shared-schema tables and cleaning only the ones that exist
- keep mixed-version offboards rollout-safe by reusing the existing `drop_tenant_schema` / `set_tenant_status` activity names, patch-gating the `drop_tenant_schema` payload so new histories can atomically scrub public-ingress residue in the same transaction as the schema drop, and backing the final status flip with a public-schema trigger so old and new workers converge on the same shared-schema cleanup behavior
- emit route metrics, structured logs, and span attributes for auth-rejected public-ingress requests so the deleted-session failure path is observable in the worktree harness
- fail closed for guest-session traffic during the grace window by suspending the tenant immediately instead of deleting exportable public data early
- preserve the public-ingress auth contract after shared-schema cleanup by deriving suspended/offboarded tenant state from claims when guest-session controls are already gone, and by treating suspended tenants with no remaining tenant schema as effectively deleted
- make tenant suspension/offboard state authoritative over per-session token flags so revoked/expired rows cannot mask tenant lifecycle shutdown
- preserve deleted-session fallback even when the guest JWT itself is expired by decoding signed claims without `exp` enforcement for tenant-state resolution
- extend tenant export proof to cover public-ingress public-schema records and tenant-schema guest-session/transcript/lead tables
- extend tenant lifecycle integration proof so seeded public-ingress data is gone after offboard completes

## Notes

- This slice closes the V2 public-ingress lifecycle gap only. It does not pretend archive-style export bundles or broader cross-product erasure reporting are solved.
- Tenant-schema public-ingress records are erased by the existing tenant-schema drop. The missing piece was the public-schema control-plane/runtime residue.

## Verification

- `uv run pytest packages/platform-core/tests/unit/test_tenancy/test_workflows.py -q --tb=short`
- `uv run pytest packages/platform-core/tests/unit/test_tenancy/test_provisioning_service.py -q --tb=short`
- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run pytest tests/architecture/test_temporal_workflow_versioning.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_tenants.py -q --tb=short`
- `uv run pytest apps/temporal-worker/tests/integration/platform_core/test_tenant_lifecycle_workflows.py -q --tb=short`
- `uv run pyright -p pyrightconfig.ci.json packages/grove/src/grove/temporal/versioning.py packages/platform-core/src/platform_core/public_ingress/models.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/src/platform_core/public_ingress/middleware.py packages/platform-core/src/platform_core/tenancy/activity_types.py packages/platform-core/src/platform_core/tenancy/admin_service.py packages/platform-core/src/platform_core/tenancy/provisioning_service.py packages/platform-core/src/platform_core/tenancy/workflows.py apps/temporal-worker/src/temporal_worker/activities/tenancy.py apps/temporal-worker/src/temporal_worker/worker.py packages/platform-core/tests/unit/test_public_ingress/test_service.py packages/platform-core/tests/unit/test_tenancy/test_workflows.py apps/api/tests/integration/test_public_ingress.py apps/api/tests/integration/test_tenants.py apps/temporal-worker/tests/integration/platform_core/test_tenant_lifecycle_workflows.py`
- `uv run ruff check packages/grove/src/grove/temporal/versioning.py packages/platform-core/src/platform_core/public_ingress/models.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/src/platform_core/public_ingress/middleware.py packages/platform-core/src/platform_core/tenancy/activity_types.py packages/platform-core/src/platform_core/tenancy/admin_service.py packages/platform-core/src/platform_core/tenancy/provisioning_service.py packages/platform-core/src/platform_core/tenancy/workflows.py apps/temporal-worker/src/temporal_worker/activities/tenancy.py apps/temporal-worker/src/temporal_worker/worker.py packages/platform-core/tests/unit/test_public_ingress/test_service.py packages/platform-core/tests/unit/test_tenancy/test_workflows.py apps/api/tests/integration/test_public_ingress.py apps/api/tests/integration/test_tenants.py apps/temporal-worker/tests/integration/platform_core/test_tenant_lifecycle_workflows.py docs/requirements/checklist.md`
- `uv run python tools/scripts/check_requirements_checklist.py --only-evidence --fail-on-evidence-issues`
- `tools/scripts/run_local_pre_pr_ci.sh --base-ref feat/v2-public-response-time`
- `tools/scripts/compose-worktree.sh up`
- `tools/scripts/obs_traceql.sh 'trace_id:30838a81571df1ae03ed0a5a80aadd8c'`
- `tools/scripts/obs_logql.sh '{compose_project="grove-jakit-75670373",service="platform-api"} | json | correlation_id="privacy-schema-drop-liveb-410-seq"' 30m 50`
- `tools/scripts/obs_promql.sh 'platform_api_route_events_total{route="public_chat_message_submit",outcome="deleted"}'`
- `git diff --check`

## Observability Evidence (OTLP)

- OTLP spans emitted:
  - [x] Yes
  - [ ] N/A

- TraceQL query + output
```bash
tools/scripts/obs_traceql.sh 'trace_id:30838a81571df1ae03ed0a5a80aadd8c'
trace_id=30838a81571df1ae03ed0a5a80aadd8c
span=http POST /public/chat/sessions/{guest_session_id}/messages
public_ingress.auth_outcome="deleted"
```

- LogQL query + output
```bash
tools/scripts/obs_logql.sh '{compose_project="grove-jakit-75670373",service="platform-api"} | json | correlation_id="privacy-schema-drop-liveb-410-seq"' 30m 50
public_ingress_auth_rejected route=public_chat_message_submit outcome=deleted correlation_id=privacy-schema-drop-liveb-410-seq
```

- PromQL query + output
```bash
tools/scripts/obs_promql.sh 'platform_api_route_events_total{route="public_chat_message_submit",outcome="deleted"}'
platform_api_route_events_total{route="public_chat_message_submit",outcome="deleted"} 1
```

## 2026-03-17 Rebase Repair

- Rebasing this branch onto current `main` exposed contract drift in tenancy/public-ingress tests: `set_tenant_status("offboarded")` now takes an advisory lock before the tenant row update, and shared-schema bootstrap/control tables now require `bootstrap_grant_hash`, `correlation_id`, and tenant-session `correlation_id` in manual test inserts. The branch tests were updated to match the current schema and offboard transaction shape instead of pinning stale expectations.
- The new public-ingress auth fallback now treats tenant-state storage failures as canonical `503` service-unavailable responses instead of leaking raw storage errors during bearer-token auth. `PostgresPublicIngressRepository.get_tenant_status()` and `.tenant_schema_exists()` now translate operational asyncpg failures to `PublicIngressServiceUnavailableError`, middleware maps that to `HTTPException(503, ...)`, and route metrics record `outcome="unavailable"` for the auth-rejected path.
- Follow-up integration coverage now proves the observability wrapper on more than `POST /messages`: bearer-token `GET /history` auth failures emit `public_ingress_auth_rejected` with `outcome="unavailable"`, and optional-auth widget analytics rejects guest-session/widget mismatches with the same structured log and denied metric outcome.
- The trigger backstop now mirrors the mixed-version-safe cleanup behavior already present in `TenantProvisioningService`: every public-ingress shared-schema delete is guarded by `to_regclass(...) IS NOT NULL`, so older databases missing one or more shared tables still complete `status='offboarded'` updates instead of crashing the trigger.
- Public-ingress operator events now use the platform-owned `public_ingress.*` namespace via a typed enum instead of ad-hoc raw literals. Cleanup paths still delete the legacy `public_lead_capture.*` / `public_chat.*` rows so mixed-version offboards and exports remain compatible while old data drains out.

### 2026-03-17 Verification

- `uv run pytest packages/platform-core/tests/unit/test_tenancy/test_provisioning_service.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_tenants.py -q --tb=short`
- `uv run pytest apps/temporal-worker/tests/integration/platform_core/test_tenant_lifecycle_workflows.py -q --tb=short`
- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_store.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run ruff check apps/api/src/platform_api/routes/public_ingress.py apps/api/tests/integration/test_public_ingress.py apps/api/tests/integration/test_tenants.py apps/temporal-worker/tests/integration/platform_core/test_tenant_lifecycle_workflows.py packages/platform-core/src/platform_core/public_ingress/middleware.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/tests/unit/test_public_ingress/test_store.py packages/platform-core/tests/unit/test_tenancy/test_provisioning_service.py`
- `uv run pyright -p pyrightconfig.ci.json apps/api/src/platform_api/routes/public_ingress.py apps/api/tests/integration/test_public_ingress.py apps/api/tests/integration/test_tenants.py apps/temporal-worker/tests/integration/platform_core/test_tenant_lifecycle_workflows.py packages/platform-core/src/platform_core/public_ingress/middleware.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/tests/unit/test_public_ingress/test_store.py packages/platform-core/tests/unit/test_tenancy/test_provisioning_service.py`
- `LOCAL_PR_REVIEW_TIMEOUT_SECONDS=480 CODEX_REVIEW_REASONING_EFFORT=low tools/scripts/run_local_pr_review.sh origin/main post_ci`

## Outcome

V2 public ingress now fails closed when the owning tenant is suspended or offboarded and no longer leaves its public-schema control-plane residue behind during tenant deletion. Tenant export now proves that the guest-session control records, widget configs, public-ingress-owned KPI/operator events, guest transcripts, and lead captures are part of the supported export surface, while the offboarding workflow preserves those exportable rows through the grace window and then uses a patch-gated `drop_tenant_schema` payload to atomically drop the tenant schema and scrub public-ingress shared-schema residue in the same DB transaction for new histories. The final `set_tenant_status(..., "offboarded")` step stays on the existing activity name, but its shared-schema cleanup backstop is enforced by a public-schema trigger on `public.tenants.status`, so old and new workers converge on the same offboard cleanup behavior during mixed-version deploys and older histories still erase public-ingress residue even when they never scheduled the patched drop payload. Public-ingress auth still preserves the canonical `tenant deleted` response for stale guest tokens because the fallback path treats `suspended` plus a missing tenant schema as effectively deleted instead of a generic invalid session, tenant lifecycle shutdown now wins over stale per-session `expired` / `revoked` flags so the public API keeps emitting the correct suspension/deletion contract instead of old token-specific errors, and JWT-expired guest tokens still recover signed claims for tenant-state fallback so the deleted-session path keeps its `deleted` observability outcome. The shared-schema cleanup path is also rollout-safe and atomic now: mixed-version databases no longer fail the compatibility cleanup backstop when some public-ingress tables are not migrated yet, any already-present public-ingress tables are still scrubbed, new-history schema drops cannot commit without their matching public-ingress cleanup, and the final offboard status update continues to enforce shared-schema erasure through the database trigger even if an older worker executes the activity.

The deleted-session path is also observable now instead of vanishing in middleware. A live worktree canary left the tenant in `suspended`, kept the `public.guest_session_controls` row in place, dropped the tenant schema, and then received `410 {"detail":"tenant deleted"}` from `POST /public/chat/sessions/{guest_session_id}/messages`; Tempo captured the HTTP span with `public_ingress.auth_outcome="deleted"` on trace `30838a81571df1ae03ed0a5a80aadd8c`, Loki captured `public_ingress_auth_rejected` under correlation id `privacy-schema-drop-liveb-410-seq`, and Prometheus recorded `platform_api_route_events_total{route="public_chat_message_submit",outcome="deleted"} = 1`.
