# Platform Observability Backend Execution Plan

Date: 2026-03-06
Owner: Codex (implementation worktree)
Status: Active

## Objective

Build the backend read models and APIs required for operator-grade workflow and call observability inside the Platform UI.

This plan explicitly rejects Grafana as the primary operator experience. Grafana remains useful for infrastructure and engineering, but the product must expose tenant-safe, role-gated, human-readable observability inside the application.

## Why This Matters

The current UI can show that something is running or failed. It cannot honestly explain what happened, what step failed, what route was taken, how long STT/LLM/TTS took, or what an operator can safely do next.

That is not a frontend styling problem. It is a backend product gap.

If we keep building screens without first building the backend read model, the UI will become a pile of fake status chips and guessed explanations.

## User Outcomes We Are Building For

1. A client operator can open one active call and understand what is happening right now without using Grafana, Tempo, or raw logs.
2. A client admin can open one automation run and see which step failed, why it failed, and whether a safe retry is available.
3. A provider support user can inspect the same tenant-safe detail across tenants without direct infrastructure access.
4. A non-technical business owner can understand whether the problem is speech recognition, model delay, voice synthesis delay, routing logic, or business workflow failure.

## Repo Truth

1. Workflow monitoring is shallow: `apps/api/src/platform_api/routes/workflows.py` only exposes `GET /workflows/executions` with list-level fields.
2. LangGraph already emits node-level spans in `packages/grove/src/grove/runtime/graph.py`.
3. Workflow retry spans already exist in `packages/grove/src/grove/runtime/workflow_engine.py`.
4. Voice KPI metrics already exist in `packages/platform-core/src/platform_core/observability/metrics.py` and are emitted from `apps/temporal-worker/src/temporal_worker/activities/post_call.py`.
5. The voice workflow already carries turn latency structures in `packages/grove/src/grove/temporal/voice_call_workflow.py`.
6. Current platform wrappers in `apps/temporal-worker/src/temporal_worker/workflows/call_with_retry.py` and `apps/temporal-worker/src/temporal_worker/workflows/inbound_call_orchestrator.py` do not expose a real live debug model.
7. Current call APIs in `apps/api/src/platform_api/routes/calls.py` support active calls, transcript SSE, observe tokens, takeover, and historical review, but not a rich live operational detail model.
8. Existing Grafana dashboard JSON in `infra/k8s/packages/observability/grove-voice-kpis.json` is useful for infra trends, but it is not tenant-safe product UX. Product operators should not need Grafana for normal call operations.

## Product Principles

1. Product operators stay in Platform UI.
2. Grafana, Loki, and Tempo are engineering tools, not the primary workflow for client operators.
3. The operator surface must explain state in business language first, while still exposing technical drill-down when needed.
4. Read models beat raw tracing for product UX.
5. Build one sane event pipeline, not multiple unrelated debug endpoints.
6. Retry semantics must be safe by construction. Per-step retry before idempotency rules is garbage.

## In Scope

1. Workflow execution detail APIs.
2. Workflow step timeline APIs.
3. Whole-run retry API for failed or terminated workflow executions.
4. Live call runtime event model and snapshot model.
5. Tenant-safe live call observability APIs and SSE stream.
6. Per-turn STT, LLM, and TTS latency exposure in product APIs.
7. LangGraph route and node timing exposure through product APIs.
8. Trace and correlation identifiers on product responses.

## Out of Scope

1. Building a full in-product trace explorer.
2. Per-step retry before action idempotency rules are defined and enforced.
3. Replacing Grafana for engineering and infrastructure debugging.
4. Cross-tenant analytics warehousing beyond the minimal summary APIs needed for admin UI.

## Post-Merge Follow-Up

1. Build a full clinic handoff console in Platform UI.
2. The current tenant call-ops and call-history surfaces now explain escalation state in business language, but they are still not a real clinic handoff console.
3. That remaining slice must cover:
   - active handoff queue and ownership
   - richer live operator support workflow
   - clearer urgent-transfer join path
   - scenario-level evaluation coverage for handoff decisions
4. Do not sell copy cleanup and event relabeling as the handoff-console finish line. That would be trash.

## Implementation Matrix

Status values:

1. `Planned` = not started
2. `In Progress` = active implementation
3. `Blocked` = waiting on an earlier slice or a design decision
4. `Done` = code, tests, and evidence landed

Progress must be updated in this matrix as slices land. If a slice is partially done, split it. Do not lie with vague “mostly done” status.

| Priority | Slice | Why this priority | Depends on | Unlocks in Platform UI | Status | Done when |
| --- | --- | --- | --- | --- | --- | --- |
| P0 | Workflow execution detail endpoint | Current automation UI cannot explain failures honestly | Existing Temporal visibility and history only | Workflow detail page can show failed step, summary, trace ID, retry availability | Done | `GET /workflows/executions/{workflow_id}/{run_id}` is live with integration coverage |
| P0 | Workflow step timeline endpoint | Operators need step-by-step “what happened” history | Workflow detail response model | Workflow detail page can show ordered step list, durations, routes, and retries | Done | `GET /workflows/executions/{workflow_id}/{run_id}/steps` is live with integration coverage |
| P0 | Whole-run retry endpoint | Recovery matters more than passive visibility | Workflow detail and retry eligibility rules | Retry button can exist in UI without guessing | Done | `POST /workflows/executions/{workflow_id}/{run_id}/retry` is live, audited, and integration-tested |
| P0 | Call runtime event table | Live call UX is fake without a backend event source | Schema migration | Realtime call timeline, route events, latency markers, alerts | Done | append-only event table exists with tenant-safe reads and write path coverage |
| P0 | Tenant-scoped call runtime snapshot table | Active call detail needs fast current-state reads | Runtime event model | `/call-ops` can load a single active call instantly with latest status and latency | Done | snapshot table exists in tenant schemas and is updated idempotently from workflow/runtime writes |
| P0 | Live call ops SSE stream | Realtime operator console requires push updates | Runtime event table | live transcript-adjacent event rail for route changes, phases, metrics, alerts | Done | `GET /calls/{call_id}/ops/stream` is live with reconnect/order tests |
| P1 | Active call detail endpoint | `/calls/active` is too thin for operator use | Runtime snapshot table | one-call operational view with current route, state, operator/takeover status | Done | `GET /calls/active/{call_id}` is snapshot-backed with Temporal fallback and integration coverage |
| P1 | Call events history endpoint | Operators need replayable context after the call | Runtime event table | per-call event timeline and support drill-down | Done | `GET /calls/{call_id}/events` is live with pagination and tenant isolation |
| P1 | Per-turn latency endpoint | One-call debugging needs more than p95 Grafana charts | Runtime events plus voice latency payloads | latency tab with STT, LLM TTFT, TTS TTFB, EOT-to-speak breakdown | Done | `GET /calls/{call_id}/latency` is live with provider/model fields |
| P1 | LangGraph route and node timing events | You want route visibility and timing, not just traces | Runtime event writer | route timeline and slow-node explanations in call/workflow UI | Done | route and node events are emitted and readable from product APIs |
| P1 | Provider/model latency dimensions | TTFT without provider context is weak data | runtime latency payload updates | compare providers/models in UI and identify regressions after config changes | Done | LLM/STT/TTS provider and model data are persisted and exposed in detail APIs |
| P1 | Technical trace summary endpoint | Support needs correlation without raw Tempo exposure | workflow/call correlation IDs | “Technical details” drawer in UI with trace and span references | Done | `GET /calls/{call_id}/trace` is live with trace-context parsing plus LangGraph node/route summaries |
| P1 | Fix broken concurrency metric labeling | Current Grafana and future summaries are inconsistent | metrics and polling cleanup | trustworthy active call counts by tenant in product summaries | Done | `calls_concurrent` semantics are corrected and tests/docs updated |
| P2 | Provider observability summary APIs | Useful for admin overviews, not the first operator blocker | runtime event and latency models | recent failures, latency regressions, route hot spots in admin UI | Partial | tenant `GET /calls/observability-summary` and deployment `GET /admin/calls/observability-summary` now expose stack comparisons and route hot spots; broader failure-centric admin summaries and metric cleanup still remain |
| P2 | Workflow persisted event model if needed | Only build this if Temporal-history reads prove too slow or too ugly | evidence from Phase 1 usage | faster workflow detail and richer automation timelines | Blocked | explicit performance or usability evidence justifies persistence |

## Tracking Rules

1. Do not mark a slice `Done` until API coverage exists and the intended UI consumer can be wired against the real contract.
2. Every completed slice must name its proof commands and tests in the implementing PR or commit notes.
3. If a slice slips because of an unsafe assumption, split the slice instead of hiding the blocker.
4. If a later slice can start with a stubbed dependency, that dependency must still be tracked as `Blocked` or `Planned`, not silently ignored.

## What We Are Building

### 1. Workflow Detail API

Add workflow detail and step timeline endpoints so the existing automation UI can answer:

1. What failed?
2. Which step failed?
3. How long did each step take?
4. Was there a retry?
5. Is a safe rerun available?

Minimum endpoints:

1. `GET /workflows/executions/{workflow_id}/{run_id}`
2. `GET /workflows/executions/{workflow_id}/{run_id}/steps`
3. `POST /workflows/executions/{workflow_id}/{run_id}/retry`

Why this first:

The current UI already exists. The backend is what makes it honest.

How:

1. Derive execution detail from Temporal history first.
2. Translate Temporal events into a stable product response model.
3. Include `trace_id`, `workflow_type`, `current_step`, `failed_step`, `error_summary`, `retry_count`, `started_at`, `closed_at`, `is_retryable`.
4. Include per-step entries with `step_id`, `action`, `status`, `attempt`, `started_at`, `ended_at`, `duration_ms`, `route`, `error_detail`.

### 2. Whole-Run Retry API

Expose a safe rerun endpoint for failed runs.

Why:

Operators need recovery, not just post-mortems.

How:

1. Start with whole-run retry only.
2. Gate retry availability by workflow status and workflow type.
3. Require the API to record who triggered the retry and why.
4. Emit audit and operator events for retry attempts.

Why not step retry first:

Because step retry without explicit idempotency contracts is trash. It creates double-writes, duplicate notifications, duplicate webhook deliveries, and unbounded support debt.

### 3. Call Runtime Event Read Model

Create a product-owned runtime event store for live call monitoring.

Why:

Prometheus histograms and traces are not enough for one-call operator UX. They are aggregates and infrastructure tools, not a readable operational timeline.

Recommended model:

1. `call_runtime_events` (current implementation: tenant schema)
2. `call_runtime_snapshots`

Current implementation note:

1. Tenant-scoped event and snapshot storage is already enough to unblock tenant UI and admin-tenant reads through existing tenancy controls.
2. Moving runtime events or snapshots into `public` is optional follow-up only if cross-tenant support workflows prove painful.

Suggested `call_runtime_events` fields:

1. `id`
2. `tenant_id`
3. `call_id`
4. `conversation_id`
5. `workflow_id`
6. `run_id`
7. `trace_id`
8. `seq`
9. `source` (`workflow`, `langgraph`, `stt`, `llm`, `tts`, `operator`, `system`)
10. `event_type`
11. `severity`
12. `provider`
13. `model`
14. `occurred_at`
15. `payload jsonb`

Suggested `call_runtime_snapshots` fields:

1. `tenant_id`
2. `call_id`
3. `conversation_id`
4. `workflow_id`
5. `run_id`
6. `current_state`
7. `operator_state`
8. `current_route`
9. `current_phase`
10. `latest_transcript_seq`
11. `latest_turn_index`
12. `latest_latency_summary jsonb`
13. `active_provider_summary jsonb`
14. `updated_at`

### 4. Live Call Ops APIs

Expose product-safe APIs that the Platform UI can use directly.

Minimum endpoints:

1. `GET /calls/active/{call_id}`
2. `GET /calls/{call_id}/ops/stream`
3. `GET /calls/{call_id}/events`
4. `GET /calls/{call_id}/latency`
5. `GET /calls/{call_id}/trace`

Why:

This is the backend contract required for the live operational page you described: interactive, realtime, and usable by non-technical operators.

How:

1. `GET /calls/active/{call_id}` reads from `call_runtime_snapshots`.
2. `GET /calls/{call_id}/ops/stream` uses SSE from `call_runtime_events`.
3. `GET /calls/{call_id}/events` returns paginated historical events from the same table.
4. `GET /calls/{call_id}/latency` returns current and historical per-turn latency breakdowns.
5. `GET /calls/{call_id}/trace` returns correlation IDs and summarized node/route timing, not raw Tempo internals.

Why SSE:

SSE is the simplest thing that could possibly work for one-way server-to-UI updates. Operators are observing. They are not running a multiplayer game. If someone wants WebSockets first, that idea is weak unless they can prove a real bidirectional requirement.

### 5. Voice Latency Exposure

Persist and expose the latencies already tracked in the voice workflow.

Metrics to expose:

1. `stt_finalize_delay_ms`
2. `eot_to_llm_start_ms`
3. `llm_ttft_ms`
4. `tts_ttfb_ms`
5. `eot_to_agent_speak_ms`
6. `eou_end_of_utterance_delay_ms`
7. `eou_transcription_delay_ms`

Why:

These are exactly the metrics a support user needs when the complaint is "the agent was slow" or "the agent interrupted" or "the call felt laggy."

How:

1. Reuse `VoiceTurnLatency` as the canonical payload shape.
2. Persist turn-latency entries into `call_runtime_events`.
3. Update `call_runtime_snapshots.latest_latency_summary`.
4. Keep Prometheus histograms for aggregate fleet health; do not confuse that with product UX.

Provider dimensions to expose on every latency payload:

1. `llm_provider`
2. `llm_model`
3. `stt_provider`
4. `stt_model`
5. `tts_provider`
6. `tts_model`

Why:

TTFT without provider and model dimensions is weak data. It tells you something was slow, but not which vendor or model actually caused it. That is useless for provider evaluation and barely useful for incident response.

Minimum product use cases enabled by these fields:

1. Compare two LLM providers on TTFT for the same tenant and call type.
2. Detect that one STT provider is causing transcript finalize lag.
3. Detect that one TTS voice or provider is causing slow speech start.
4. Show provider-specific latency regressions in the Platform UI after a config change.

### 6. LangGraph Route and Node Timing Exposure

Expose route decisions and node timings as product data.

Why:

You explicitly want to monitor LangGraph routes and how long they take. The traces already exist; the product surface does not.

How:

1. On node start and end, emit product-safe runtime events with `node_name`, `graph_type`, `duration_ms`, and correlated IDs.
2. On route changes, emit route decision events including chosen route and fallback/default behavior.
3. Attach these to the same call or workflow runtime event model.

Why this matters for UX:

When an operator sees "Routing chose compliance handoff" or "Node customer_lookup took 2400 ms", they can actually explain what happened. That is operationally useful. "A trace exists somewhere" is not.

## Detailed Execution Phases

### Phase 1: Workflow Truthfulness

Deliverables:

1. Workflow detail endpoint
2. Workflow step timeline endpoint
3. Whole-run retry endpoint
4. Integration tests covering successful, failed, and retryable runs

Why first:

1. Existing workflow UI is already blocked on backend detail.
2. Temporal history is already available, so this is the fastest honest win.

Implementation approach:

1. Extend `apps/api/src/platform_api/routes/workflows.py`.
2. Add response models for detail and step timeline.
3. Query Temporal history and normalize event shapes into stable product responses.
4. Add retry endpoint that re-enqueues a new run with audit metadata.

Acceptance:

1. Failed execution shows failed step and error summary.
2. Retry button can be wired in UI without guessing.
3. No raw Temporal internals leak into non-technical copy fields.

### Phase 2: Live Call Runtime Read Model

Deliverables:

1. Migration for tenant-scoped `call_runtime_events`
2. Migration for tenant-scoped `call_runtime_snapshots`
3. Event writer activity or helper
4. Runtime event emission at voice call milestones

Why second:

Without this, the live operator page cannot become more than transcript plus room join.

Implementation approach:

1. Add public-schema migrations in `packages/platform-core/src/platform_core/alembic_public/versions/`.
2. Add a reusable runtime event writer in platform core or temporal worker, not duplicated ad hoc in each workflow.
3. Emit runtime events from platform wrappers and voice/language execution hooks.
4. Keep writes append-only for events and idempotent for snapshots.

Acceptance:

1. One active call produces a readable event timeline in real time.
2. Snapshot lookup returns current state without replaying all events.

### Phase 3: Live Call APIs

Deliverables:

1. `GET /calls/active/{call_id}`
2. `GET /calls/{call_id}/ops/stream`
3. `GET /calls/{call_id}/events`
4. `GET /calls/{call_id}/latency`
5. `GET /calls/{call_id}/trace`

Why third:

Once the runtime model exists, the APIs become straightforward and stable.

Implementation approach:

1. Extend `apps/api/src/platform_api/routes/calls.py`.
2. Keep existing transcript SSE intact; do not break current behavior.
3. Add new operator-facing detail routes backed by the runtime event store.
4. Expose technical fields, but keep API names and summaries clear enough for product UI.

Acceptance:

1. One page can show call state, transcript, route, latency, alerts, and operator actions from product APIs alone.
2. No Grafana dependency for an operator workflow.

### Phase 4: LangGraph and Voice Timing Enrichment

Deliverables:

1. Route decision events
2. Node duration events
3. Per-turn latency event emission
4. Snapshot rollups for latest route and latest latency
5. Provider and model dimensions on latency events

Why fourth:

This makes the live page actually diagnostic instead of decorative.

Implementation approach:

1. Hook runtime event emission into `packages/grove/src/grove/runtime/graph.py`.
2. Reuse the existing `VoiceTurnLatency` structure from `packages/grove/src/grove/temporal/voice_call_workflow.py`.
3. Ensure every emitted event includes `tenant_id`, `call_id`, `conversation_id`, `workflow_id`, `run_id`, and `trace_id`.

Acceptance:

1. Operators can distinguish speech delay vs model delay vs route/workflow delay.
2. Support can explain the failure without opening Grafana.

### Phase 5: Aggregate Summary APIs

Deliverables:

1. Admin summary endpoint for recent failures
2. Admin summary endpoint for top latency regressions
3. Admin summary endpoint for route hot spots
4. Admin summary endpoint for provider and model comparison

Why last:

These are useful, but the live and detail flows matter more than aggregate summaries.

Implementation approach:

1. Derive aggregates from the runtime event and snapshot tables.
2. Keep summary APIs separate from live detail APIs.

Acceptance:

1. Platform UI can show operator-friendly recent issues and latency trends without infra tooling.
2. Platform UI can compare TTFT and related latency by provider and model without opening Grafana.

## Detailed Event Emission Requirements

Emit runtime events at the following points:

1. Call created
2. Call connected
3. Transcript segment finalized
4. LLM request started
5. LLM first token received
6. TTS synthesis started
7. TTS first byte received
8. Agent speech started
9. Agent speech ended
10. LangGraph node started
11. LangGraph node finished
12. Route selected
13. Tool execution started
14. Tool execution finished
15. Escalation requested
16. Manual takeover requested
17. Manual takeover succeeded
18. Manual takeover failed
19. Call ended
20. Error raised

Each event must carry:

1. `tenant_id`
2. `call_id`
3. `conversation_id`
4. `workflow_id`
5. `run_id`
6. `trace_id`
7. `event_type`
8. `occurred_at`
9. `provider`
10. `model`
11. `payload`

## API Response Design Rules

1. Every detail response includes stable correlation identifiers.
2. Every human-facing field must have a plain-language summary.
3. Raw technical payloads may be included under a nested object, but must not be the only explanation.
4. Product APIs must not require direct Grafana, Loki, or Tempo access.
5. Support and provider users may see deeper technical fields than client operators, but the base response shape stays stable.

## Testing and Verification Plan

### Backend

1. Unit tests for event normalization and snapshot reduction.
2. Integration tests for workflow detail, step timeline, and retry endpoints.
3. Integration tests for live call event writes and snapshot updates.
4. Integration tests for SSE stream ordering and reconnect behavior.
5. Integration tests proving tenant isolation on runtime event reads.

### Web

1. E2E tests for live call ops page using mocked product APIs.
2. E2E tests for workflow detail and retry surfaces.
3. A11y checks on the new observability pages.

### Harness

Use the existing harness discipline in `wiki/ops/harness_engineering.md`:

1. assertions live in tests, not chat
2. event artifacts are required for bot-driven work
3. evidence must be runnable and reproducible

## Risks and Controls

### Risk: Product APIs become a thin wrapper over Grafana

Why this is bad:

That leaks engineering tooling into customer workflows and creates tenant-safety and RBAC problems.

Control:

Use platform-owned read models and APIs. Grafana stays secondary.

### Risk: Too much new storage design

Why this is bad:

Overbuilding a full observability warehouse is slow and unnecessary.

Control:

Start with one append-only event table and one snapshot table.

### Risk: Retry causes duplicate side effects

Why this is bad:

Duplicate notifications, duplicate webhook posts, duplicate DB writes.

Control:

Whole-run retry first. Step retry only after explicit idempotency audit.

### Risk: Payloads become too technical for operators

Why this is bad:

Then the platform just becomes a worse Grafana clone.

Control:

Keep plain-language summaries in response models and UI contracts.

## Recommended Delivery Sequence

1. Workflow detail endpoint
2. Workflow steps endpoint
3. Whole-run retry endpoint
4. Runtime event public-schema migrations
5. Runtime event writer and snapshot reducer
6. Live call detail endpoint
7. Live call SSE stream
8. Per-turn latency endpoint
9. LangGraph route and node timing events
10. Aggregate admin summary endpoints

## Explicit Non-Goal

Do not spend time polishing Grafana for operators.

Grafana is fine for engineering and infrastructure verification. It is the wrong primary UX for SME business owners, client operators, and support users working in the product.

## Post-Plan Implementation Order

1. Backend: workflow detail and retry
2. Backend: runtime event model and live call APIs
3. Web: upgrade `/workflows` and `/call-ops` against real contracts
4. Backend: aggregate summaries
