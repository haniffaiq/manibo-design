# Execution Plan: Platform v3.0 — Wave 8: Hoptrans MVP (Telematics → Outbound Verification → Ops Console)

> **Parent plan:** platform-v3-implementation-plan.md (archived)
> **Status:** Draft
> **Created:** 2026-02-25
> **Track:** Epic

## 1. Feature Definition

**Goal:** Ship Hoptrans “Driver Work Time Verification” as an end-to-end, demoable, operable module (within ~2 weeks), without lying in `docs/requirements/checklist.md`.

This wave is **NFQ delivery-first**. Everything else is backlog unless it is a Hoptrans dependency.

**Note (cross-wave carryover):**
- This wave implements the previously drafted “P7.20 driver_verification” and the Hoptrans-first slice of “P7.23 historical call search”.

**Primary source of truth:**
- `docs/requirements/checklist.md` §21 (Hoptrans — Driver Work Time Verification)
- `docs/requirements/nfq.md` §5.1 (Logistics: Driver Work Time Verification)
- `docs/requirements/ui-requirements.md` (Hoptrans ops console planning view)

**Acceptance Criteria (measurable, repo-verifiable):**
- [ ] Telematics webhook event triggers a durable Temporal workflow that records the inbound event (idempotent) and schedules/starts a driver verification job.
- [ ] Outbound verification call is initiated via LiveKit SIP and **a tenant `calls` row exists** for the attempt (no more stub persistence).
- [ ] Post-call structured outcome is stored and queryable (confirmed / discrepancy / unreachable) with discrepancy details.
- [ ] `docs/requirements/checklist.md` rows for Hoptrans + its hard dependencies have `Repo` updated and have **Check/Prove** fields ready for validation evidence.

**Status update (2026-02-28):**
- ✅ Pre-call enrichment now resolves `driver_schedule`, `remaining_work_hours`, and `telematics_position` from driver data + telematics snapshot before call start.
- ✅ Outbound call record persistence now stores a `pre_call_context` object in `calls.metadata` (schedule, remaining work hours, telematics status/position, occurred-at).
- ✅ During-call extraction is now repo-verified for Hoptrans: required fields (`location`, `status`, `hours_worked_today`, `next_stop`, `expected_arrival`) are enforced as required keys with enum-bounded status; missing core verification fields (`location`/`status`/`hours_worked_today`) mark the job `unreachable`, while missing route ETA fields remain `confirmed` with explicit `missing_required_fields` flags.
- ✅ Follow-up scheduling from extracted `expected_arrival` is integration-gated and creates the next scheduled verification job.
- ✅ Driver verification audit APIs now include call timestamps (`call_started_at`, `call_ended_at`) alongside driver/outcome/discrepancy details.
- ✅ Driver status endpoint now returns latest telematics status/position per tenant (`GET /drivers/{driver_id}/status`) with tenant isolation.
- ✅ Driver registry maintenance backend is now gated: CSV import plus `GET /drivers/{driver_id}` and `PATCH /drivers/{driver_id}` are integration-tested for tenant-scoped updates.
- ✅ Operator alert queue backend is now gated: `/operator-events` supports tenant-scoped severity/status/since filtering and ack/resolve updates.
- ✅ Historical call monitoring backend is now gated: `/calls` + `/calls/{call_id}` support tenant-isolated search/filter/detail retrieval.
- ✅ Outbound campaign initiation backend is now gated: `POST /campaigns/outbound` persists tenant campaign/target rows and starts `sol.outbound_campaigns.CampaignWorkflow`; `GET /campaigns/outbound` returns tenant-scoped campaign summaries; Temporal campaign activities now persist terminal campaign counters/status plus per-target attempt/outcome state.
- Gate: `uv run pytest apps/temporal-worker/tests/integration/test_driver_verification_e2e.py -q --tb=short`
  and `uv run pytest solutions/driver_verification/tests/test_discrepancy.py -q --tb=short`
  and `uv run pytest solutions/driver_verification/tests/integration/test_driver_verification_jobs_api.py -q --tb=short`
  and `uv run pytest solutions/driver_verification/tests/integration/test_driver_registry_api.py -q --tb=short`
  and `uv run pytest apps/api/tests/integration/test_operator_events.py -q --tb=short`
  and `uv run pytest apps/api/tests/integration/test_calls_history.py -q --tb=short`
  and `uv run pytest apps/api/tests/integration/test_campaigns.py -q --tb=short`
  and `uv run pytest apps/temporal-worker/tests/unit/test_campaign_persistence_activities.py -q --tb=short`

**UI note (explicit):** The immediate goal is “✅ API/Repo” coverage. UI can be delivered after backend proof gates; do not block Hoptrans backend readiness on UI polish.

**Scope Boundaries**

Included:
- Hoptrans module data model + APIs + minimal UI surfaces (ops console)
- Telematics ingestion processing (beyond “router exists”)
- Outbound call persistence fixes required for “call log” to be real
- Operator events read API (so UI has a real queue source)

Excluded (explicitly not in Wave 8):
- VOX website chat widget + multilingual routing + lead capture
- Knowledge base ingestion + VOX approval lifecycle
- Telephony provisioning UI (SIP trunk CRUD / phone number acquisition)
- “Zero legacy surfaces” migration (removing `/agents` + `/admin/tenants/{tenant_id}/agents`)
- General-purpose workflow editor / marketplace UI

---

## 2. Phase Plan

### Phase 8.0: Hoptrans data model (tenant schema) + minimal public ops state

**Objective:** Create the minimum durable storage needed to make Hoptrans real: drivers, verification jobs/results, discrepancies.

**Input:**
- `docs/requirements/checklist.md` §21
- `docs/requirements/nfq.md` §5.1 (expected payload/output)
- Existing tenant tables: `packages/platform-core/src/platform_core/alembic/versions/20260217_120000_initial_tenant_schema.py` (`calls`, `call_transcripts`)

**Deliverables:**
- `solutions/driver_verification/` (new solution package) with:
  - Tenant migrations adding (names are flexible, but do not over-model):
    - `drivers` (driver_id, phone, name, external refs, active)
    - `driver_verification_jobs` (id, driver_id, source_event_id, status, scheduled_at, attempt_count, last_error, created_at, updated_at)
    - `driver_verification_results` (job_id, outcome, extracted fields, telematics snapshot, discrepancy flags, created_at)
  - `SolutionManifest` declaring dependencies (`outbound_campaigns`, `telematics_ingestion` if required)

**Tests:**
- `solutions/driver_verification/tests/integration/test_migrations.py` — tenant migration applies cleanly and tables exist.

**Verification gate:**
```bash
uv run pytest solutions/driver_verification/tests/ --tb=short -q
```

**Depends on:** Wave 7.1 (solution lifecycle + migration runner) OR use existing tenant migration runner path if already merged.

---

### Phase 8.1: Telematics ingestion processing (no more stub)

**Objective:** Convert telematics webhook “we started a workflow” into “we persisted an event and spawned verification”.

**Input:**
- `solutions/telematics_ingestion/src/telematics_ingestion/router.py`
- `solutions/telematics_ingestion/src/telematics_ingestion/activities.py` (stub)
- `solutions/telematics_ingestion/src/telematics_ingestion/workflows.py`
- `docs/requirements/checklist.md` §10 + §21

**Deliverables:**
- Persist inbound telematics events with idempotency (event_id + provider + tenant) and normalization into a stable internal model.
- Resolve driver identity (by external driver_id and/or phone) and start `sol.driver_verification.DriverVerificationWorkflow` for relevant status changes.
- Operator event emission on malformed/unsupported payloads (so ops can see ingestion failures).

**Tests:**
- Extend existing integration tests in `solutions/telematics_ingestion/tests/integration/` to assert:
  - duplicate webhook payload does not create duplicate events/jobs
  - a “status change” payload results in a verification job started (Temporal start asserted)

**Verification gate:**
```bash
uv run pytest solutions/telematics_ingestion/tests/ --tb=short -q
```

**Depends on:** Phase 8.0.

---

### Phase 8.2: Outbound verification call orchestration + real persistence (kill stubs)

**Objective:** Make outbound calls create/update tenant call records so Hoptrans has a real call log and post-call outcomes.

**Why this is non-negotiable:** If `tenant.calls` is not written, every downstream “call history”, “discrepancy review”, and “audit” UI is fake.

**Input:**
- Outbound wrapper: `apps/temporal-worker/src/temporal_worker/workflows/call_with_retry.py`
- SIP dial activity: `apps/temporal-worker/src/temporal_worker/voice_activities.py`
- Stub activities to replace:
  - `apps/temporal-worker/src/temporal_worker/activities/call_record.py`
  - `apps/temporal-worker/src/temporal_worker/activities/post_call.py`
  - `apps/temporal-worker/src/temporal_worker/activities/target.py`
- Existing durable storage schema:
  - `packages/platform-core/src/platform_core/alembic/versions/20260217_120000_initial_tenant_schema.py` (`calls`, `call_transcripts`, `call_recordings`)

**Deliverables:**
- `create_call_record` writes `tenant.calls` (direction, caller/callee, started_at, state transitions, temporal_run_id, metadata).
- `post_call` updates call end fields + outcome metadata and emits operator events on errors.
- `target` activity resolves driver/contact target set for Hoptrans job (single target per job).
- Ensure extraction persistence is wired only after call row exists (no more “skip because call not found”).

**Tests:**
- `apps/temporal-worker/tests/integration/test_driver_verification_e2e.py` (new):
  - telematics event → verification workflow → outbound call attempt → `tenant.calls` exists → outcome stored

**Verification gate:**
```bash
uv run pytest apps/temporal-worker/tests/integration/ --tb=short -q
```

**Depends on:** Phase 8.0.

---

### Phase 8.3: Operator events read/ack API (so UI has a queue)

**Objective:** Expose `public.operator_events` to tenant ops UI (tenant-scoped view) with ack/resolution semantics.

**Input:**
- Writer: `apps/temporal-worker/src/temporal_worker/activities/operator_events.py` (already writes)
- Public schema: `packages/platform-core/src/platform_core/alembic_public/versions/20260223_100000_operator_events.py`

**Deliverables:**
- New tenant-scoped endpoints in `apps/api`:
  - `GET /operator-events?severity=&status=&since=` (tenant filtered)
  - `POST /operator-events/{event_id}/ack`
  - `POST /operator-events/{event_id}/resolve`
- Minimal status model for operator events if missing (or reuse existing columns; do not invent a new system unless required).

**Tests:**
- Integration: list events returns only tenant’s events; ack/resolve is audited.

**Verification gate:**
```bash
uv run pytest apps/api/tests/integration/ --tb=short -q
```

**Depends on:** Phase 8.2 (for real event volume) but can be implemented earlier.

---

### Phase 8.4: Call history API (backend-first) + optional Hoptrans Ops UI

**Objective:** Unblock Hoptrans operations by providing historical call search + call detail APIs.
UI surfaces are optional and can be deferred until after backend gates are green.

**Input:**
- Existing call ops: `apps/web/src/app/call-ops/page.tsx` (live calls)
- Existing recordings APIs: `apps/api/src/platform_api/routes/recordings.py`
- Existing calls APIs (active + takeover): `apps/api/src/platform_api/routes/calls.py`
- Checklist gaps: `docs/requirements/checklist.md` §11 + §21

**Deliverables (backend-first):**
- API (required):
  - `GET /calls` (historical search; date range, outcome, driver_id, phone)
  - `GET /calls/{call_id}` (detail; transcript + extraction summary + discrepancy link)
- UI (optional, defer if needed):
  - `apps/web/src/app/hoptrans/` (new module route group):
    - Discrepancy queue page (backed by operator-events + driver_verification tables)
    - Call log search page (backed by historical calls endpoint)
    - Call detail page (recordings + transcript + extracted verification fields)

**Tests:**
- API integration: historical call search works with seeded tenant data.
- UI smoke test (optional): route renders with mocked API client (or Playwright if already used in repo).

**Verification gate:**
```bash
pnpm -C apps/web test
uv run pytest apps/api/tests/integration/ --tb=short -q
```

**Depends on:** Phase 8.2.

---

### Phase 8.5: Driver registry import/maintenance (CSV)

**Objective:** Let NFQ load drivers into the platform without manual DB poking.

**Deliverables:**
- API:
  - `POST /drivers/import` (CSV upload, validates rows, dry-run option)
  - `GET /drivers` / `GET /drivers/{driver_id}` / `PATCH /drivers/{driver_id}`
- UI:
  - Driver list + import flow (validation errors surfaced)

**Tests:**
- Integration: CSV import validates and upserts correctly; rejects invalid phone numbers.

**Verification gate:**
```bash
uv run pytest apps/api/tests/integration/ --tb=short -q
```

**Depends on:** Phase 8.0.

---

### Phase 8.6 (demo hardening, non-UI) — latency KPIs + EU routing + “fail fast” gates

This phase is not “new product scope”. It is operational hardening so the Hoptrans demo is reliable and measurable.

**Deliverables (repo-verifiable):**
- Real-provider GO/NO-GO gates (must not skip):
  - LLM gate: `MODEL_CATALOG_PATH=$PWD/config/model_catalog.yaml GEMINI_API_KEY=... uv run pytest packages/grove/tests/e2e/test_e2e_real_llm.py -q`
  - SIP gate: `GROVE_VOICE_SIP_E2E_TESTS=1 uv run pytest packages/grove-voice-livekit/tests/e2e/test_voice_sip_e2e.py -q`
- EU routing for “Gemini” via Vertex AI:
  - Agent model provider uses `vertex_ai` (LiteLLM) and respects `GOOGLE_CLOUD_PROJECT` + `GOOGLE_CLOUD_LOCATION` (e.g. `europe-west4`).
- Conversation latency visibility (no UI required):
  - Per-turn metrics persisted into `tenant.calls.metadata.voice_turn_latencies` (EOT→LLM start, LLM TTFT, STT finalize, EOU delay, TTS TTFB).
  - Quick summary: `uv run python tools/scripts/voice_latency_report.py --tenant-slug hoptrans_demo --limit 10`
  - Prometheus exports a backend KPI histogram for dashboards/alerts: `voice_turn_latency_ms{tenant_id, outcome, metric}` (observed on post-call persistence).
  - Tempo traces via OTLP (when running with compose-worktree): service names `platform-api`, `temporal-worker`, `grove-voice-agent` (see `wiki/ops/local-observability.md`).
- (Optional but recommended) Krisp noise cancellation for SIP participants:
  - Enable via `GROVE_LIVEKIT_KRISP_ENABLED=1` (default-on for SIP dialing; set `0` to disable).

**Ops runbook:** `wiki/ops/voice-call-local-demo.md` (Cloud SIP first → K8s self-host plan).

## 3. Execution Graph

```
Phase 8.0 (data model)
   ↓
Phase 8.1 (telematics processing) ─┐
   ↓                               ├─→ Phase 8.4 (Hoptrans ops UI)
Phase 8.2 (outbound persistence) ──┘
   ↓
Phase 8.3 (operator events API)
   ↓
Phase 8.5 (driver import UI/API)
```

---

## 4. Reality Check (ruthless, but accurate)

- If Phase 8.2 is not done, Hoptrans “call log” is theater. Don’t ship theater.
- If Phase 8.1 stays stubbed, Hoptrans “telematics-triggered automation” is a PowerPoint.
- If the ops UI is not backed by `operator_events` + durable tables, NFQ will not trust the platform in production.

---

## 5. Files Modified

| File | Change |
|------|--------|
| `docs/milestones/exec-plans/platformv3_wave_8.md` | New Wave 8 plan (Hoptrans MVP) |
