# AH-2026-04-20: Application DB Query Observability

> **Status**: Completed
> **Estimate**: S (< 2h)
> **Depends on**: `AH-2026-04-20-database-slow-query-monitoring.md`

---

## Description

Add application-side completed-query timing for the voice load-test path. The
database alerts show active server-side slow queries, but the load test also
needs app context: connection acquire/setup timing, stable `query_name`,
tenant, workflow, call, synthetic `test_run_id`, synthetic `test_call_id`, and
span/log correlation.

This does not add a database table. Query timing is emitted as Prometheus
metrics, structured logs, and spans so the load test does not write extra rows
while measuring database pressure.

## Subtasks

- [x] Add shared `observe_db_query()` helper for named async DB operations.
- [x] Add Prometheus metrics for DB connection acquire/setup, DB query
      duration, and failures.
- [x] Instrument inbound/outbound call seed and call-record creation queries.
- [x] Instrument post-call completion queries.
- [x] Instrument carrier event call matching and runtime-event persistence
      queries for inbound/outbound failed-call diagnosis.
- [x] Own stable query names in `DbQueryName` instead of call-site string
      literals.
- [x] Keep carrier bound-number pool acquisition separate from lookup SQL
      duration.
- [x] Instrument manual tenant search-path setup as owned DB query timing where
      it sits outside `tenant_db_connection()`.
- [x] Document metric labels, log/span correlation fields, and synthetic ID
      propagation.
- [x] Add unit coverage for metric definitions and query observation behavior.

## Files Modified

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/observability/db_queries.py` | Create | Shared DB query timing helper |
| `packages/platform-core/src/platform_core/observability/metrics.py` | Modify | Add DB query metrics |
| `apps/temporal-worker/src/temporal_worker/voice_activities.py` | Modify | Instrument outbound call seed DB write |
| `apps/temporal-worker/src/temporal_worker/activities/call_record.py` | Modify | Instrument call-record DB write |
| `apps/temporal-worker/src/temporal_worker/activities/post_call.py` | Modify | Instrument post-call completion DB writes |
| `apps/temporal-worker/tests/unit/test_call_record_activity.py` | Create | Cover call-record tenant setup and DB write ordering |
| `packages/platform-core/src/platform_core/voice/livekit_webhook_support.py` | Modify | Instrument inbound call seed DB write and load-test headers |
| `packages/platform-core/src/platform_core/voice/telnyx_carrier_events.py` | Modify | Instrument carrier matching and persistence DB queries |
| `packages/platform-core/src/platform_core/voice/telnyx_carrier_classification.py` | Create | Keep Telnyx carrier classification below file-size gate while preserving carrier event behavior |
| `packages/platform-core/tests/unit/test_observability/test_metrics.py` | Modify | Cover DB metric types/labels/export |
| `packages/platform-core/tests/unit/test_observability/test_db_query_observation.py` | Create | Cover success/error observation behavior |
| `wiki/ops/mock-sip-load-test-performance-checklist.md` | Modify | Document completed-query timing requirements |
| `wiki/systems/observability.md` | Modify | Document DB query metrics and correlation fields |
| `wiki/ops/production-alerts.md` | Modify | Link active slow-query alerts to app-side query timing |
| `wiki/design-docs/launch-observability-alert-matrix.md` | Modify | Mark voice-path completed-query coverage |
| `wiki/log.md` | Modify | Append change note |

## Acceptance Criteria

- [x] DB metrics have bounded labels and exclude `call_id`, `test_run_id`, and
      `test_call_id`.
- [x] Structured logs and spans include high-cardinality call/test correlation.
- [x] Critical voice-path DB connection acquisition emits timing separate from
      completed query execution.
- [x] Critical voice-path DB writes have stable `query_name` values owned by
      `DbQueryName`.
- [x] Carrier matching/persistence queries have stable `query_name` values
      owned by `DbQueryName` for failed-call investigation.
- [x] `carrier.telnyx.bound_number.lookup` measures only SQL execution, not
      implicit asyncpg pool wait.
- [x] Manual `set_tenant_search_path()` calls in the voice load-test path are
      captured as named query timings.
- [x] Documentation explains that no dedicated DB table is required.

## Verification

- `uv run ruff check packages/platform-core/src/platform_core/observability/db_queries.py packages/platform-core/src/platform_core/observability/metrics.py packages/platform-core/src/platform_core/voice/livekit_webhook_support.py packages/platform-core/src/platform_core/voice/telnyx_carrier_events.py apps/temporal-worker/src/temporal_worker/voice_activities.py apps/temporal-worker/src/temporal_worker/activities/call_record.py apps/temporal-worker/src/temporal_worker/activities/post_call.py packages/platform-core/tests/unit/test_observability/test_metrics.py packages/platform-core/tests/unit/test_observability/test_db_query_observation.py`
- `uv run ruff format --check packages/platform-core/src/platform_core/observability/db_queries.py packages/platform-core/src/platform_core/observability/metrics.py packages/platform-core/src/platform_core/voice/livekit_webhook_support.py packages/platform-core/src/platform_core/voice/telnyx_carrier_events.py apps/temporal-worker/src/temporal_worker/voice_activities.py apps/temporal-worker/src/temporal_worker/activities/call_record.py apps/temporal-worker/src/temporal_worker/activities/post_call.py packages/platform-core/tests/unit/test_observability/test_metrics.py packages/platform-core/tests/unit/test_observability/test_db_query_observation.py`
- `uv run pyright -p pyrightconfig.ci.json packages/platform-core/src/platform_core/observability/db_queries.py packages/platform-core/src/platform_core/observability/metrics.py packages/platform-core/src/platform_core/voice/livekit_webhook_support.py packages/platform-core/src/platform_core/voice/telnyx_carrier_events.py apps/temporal-worker/src/temporal_worker/voice_activities.py apps/temporal-worker/src/temporal_worker/activities/call_record.py apps/temporal-worker/src/temporal_worker/activities/post_call.py packages/platform-core/tests/unit/test_observability/test_metrics.py packages/platform-core/tests/unit/test_observability/test_db_query_observation.py`
- `uv run pytest packages/platform-core/tests/unit/test_observability/test_metrics.py packages/platform-core/tests/unit/test_observability/test_db_query_observation.py -q --tb=short`
- `uv run pytest apps/temporal-worker/tests/unit/test_voice_activities_metadata.py apps/temporal-worker/tests/unit/test_voice_activities_e2e_mode.py apps/temporal-worker/tests/unit/test_voice_activities_outbound_trunk.py apps/temporal-worker/tests/unit/test_voice_activities_outbound_seed.py -q --tb=short`
- `uv run pytest apps/temporal-worker/tests/unit/test_voice_activities_outbound_seed.py apps/temporal-worker/tests/unit/test_post_call_latency_metrics.py -q --tb=short`
- `uv run pytest packages/platform-core/tests/unit/test_voice/test_telnyx_carrier_events.py packages/platform-core/tests/unit/test_voice/test_telnyx_webhook.py -q --tb=short`
- `uv run ruff check packages/platform-core/src/platform_core/voice/telnyx_carrier_events.py packages/platform-core/src/platform_core/voice/telnyx_carrier_classification.py packages/platform-core/tests/unit/test_voice/test_telnyx_carrier_events.py`
- `uv run ruff format --check packages/platform-core/src/platform_core/voice/telnyx_carrier_events.py packages/platform-core/src/platform_core/voice/telnyx_carrier_classification.py packages/platform-core/tests/unit/test_voice/test_telnyx_carrier_events.py`
- `uv run pyright -p pyrightconfig.ci.json packages/platform-core/src/platform_core/voice/telnyx_carrier_events.py packages/platform-core/src/platform_core/voice/telnyx_carrier_classification.py packages/platform-core/tests/unit/test_voice/test_telnyx_carrier_events.py`
- `uv run pytest packages/platform-core/tests/unit/test_voice/test_telnyx_carrier_events.py tests/architecture/test_repo_file_size.py::test_repo_code_and_ci_files_within_limits -q --tb=short`
- `uv run ruff check packages/platform-core/src/platform_core/observability/db_queries.py packages/platform-core/src/platform_core/voice/telnyx_carrier_events.py packages/platform-core/tests/unit/test_voice/test_telnyx_carrier_events.py packages/platform-core/tests/unit/test_observability/test_db_query_observation.py apps/temporal-worker/src/temporal_worker/voice_activities.py apps/temporal-worker/src/temporal_worker/activities/call_record.py apps/temporal-worker/src/temporal_worker/activities/post_call.py packages/platform-core/src/platform_core/voice/livekit_webhook_support.py`
- `uv run ruff format --check packages/platform-core/src/platform_core/observability/db_queries.py packages/platform-core/src/platform_core/voice/telnyx_carrier_events.py packages/platform-core/tests/unit/test_voice/test_telnyx_carrier_events.py packages/platform-core/tests/unit/test_observability/test_db_query_observation.py apps/temporal-worker/src/temporal_worker/voice_activities.py apps/temporal-worker/src/temporal_worker/activities/call_record.py apps/temporal-worker/src/temporal_worker/activities/post_call.py packages/platform-core/src/platform_core/voice/livekit_webhook_support.py`
- `uv run pyright -p pyrightconfig.ci.json packages/platform-core/src/platform_core/observability/db_queries.py packages/platform-core/src/platform_core/voice/telnyx_carrier_events.py packages/platform-core/tests/unit/test_voice/test_telnyx_carrier_events.py packages/platform-core/tests/unit/test_observability/test_db_query_observation.py apps/temporal-worker/src/temporal_worker/voice_activities.py apps/temporal-worker/src/temporal_worker/activities/call_record.py apps/temporal-worker/src/temporal_worker/activities/post_call.py packages/platform-core/src/platform_core/voice/livekit_webhook_support.py`
- `uv run pytest packages/platform-core/tests/unit/test_voice/test_telnyx_carrier_events.py packages/platform-core/tests/unit/test_observability/test_db_query_observation.py packages/platform-core/tests/unit/test_observability/test_metrics.py tests/architecture/test_repo_file_size.py::test_repo_code_and_ci_files_within_limits -q --tb=short`
- `uv run pytest apps/temporal-worker/tests/unit/test_voice_activities_metadata.py apps/temporal-worker/tests/unit/test_voice_activities_e2e_mode.py apps/temporal-worker/tests/unit/test_voice_activities_outbound_trunk.py apps/temporal-worker/tests/unit/test_voice_activities_outbound_seed.py apps/temporal-worker/tests/unit/test_post_call_latency_metrics.py -q --tb=short`
- `uv run ruff check packages/platform-core/src/platform_core/observability/db_queries.py packages/platform-core/tests/unit/test_observability/test_db_query_observation.py apps/temporal-worker/src/temporal_worker/activities/call_record.py apps/temporal-worker/src/temporal_worker/activities/post_call.py apps/temporal-worker/tests/unit/test_call_record_activity.py apps/temporal-worker/tests/unit/test_post_call_latency_metrics.py`
- `uv run ruff format --check packages/platform-core/src/platform_core/observability/db_queries.py packages/platform-core/tests/unit/test_observability/test_db_query_observation.py apps/temporal-worker/src/temporal_worker/activities/call_record.py apps/temporal-worker/src/temporal_worker/activities/post_call.py apps/temporal-worker/tests/unit/test_call_record_activity.py apps/temporal-worker/tests/unit/test_post_call_latency_metrics.py`
- `uv run pyright -p pyrightconfig.ci.json packages/platform-core/src/platform_core/observability/db_queries.py packages/platform-core/tests/unit/test_observability/test_db_query_observation.py apps/temporal-worker/src/temporal_worker/activities/call_record.py apps/temporal-worker/src/temporal_worker/activities/post_call.py apps/temporal-worker/tests/unit/test_call_record_activity.py apps/temporal-worker/tests/unit/test_post_call_latency_metrics.py`
- `uv run pytest packages/platform-core/tests/unit/test_observability/test_db_query_observation.py apps/temporal-worker/tests/unit/test_call_record_activity.py apps/temporal-worker/tests/unit/test_post_call_latency_metrics.py -q --tb=short`
- `uv run pytest apps/temporal-worker/tests/unit/test_call_record_activity.py apps/temporal-worker/tests/unit/test_voice_activities_metadata.py apps/temporal-worker/tests/unit/test_voice_activities_e2e_mode.py apps/temporal-worker/tests/unit/test_voice_activities_outbound_trunk.py apps/temporal-worker/tests/unit/test_voice_activities_outbound_seed.py apps/temporal-worker/tests/unit/test_post_call_latency_metrics.py -q --tb=short`
