# Calls Admin Module — Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the existing design-pack UI (mock data) and wire it to a real backend — database, API endpoints, SSE streaming, WebRTC audio, and audit logging. The UI is already done; this plan is purely backend + integration.

**Architecture:** Platform API (Go or Node) behind `/api/v1/admin/calls/*`. PostgreSQL for hot data, Redis Streams for live call feeds, object storage (S3) for recordings. WebRTC via existing media bridge for listen-in/take-over. Row-level security per tenant.

**Prerequisite:** The design-pack UI at `web/src/app/(deployment)/admin/calls/` is complete and all mock interactions work. This plan replaces mock data with real data without changing the UI.

**Reference docs:**
- Design doc: `docs/wiki/call-admin-module.md` (sections §4–§9)
- UI implementation: `docs/wiki/calls-implementation-summary.md`
- Current API types: `web/src/lib/api/admin-calls.ts`

---

## Phase 1: Database Schema & Migrations

### Task 1.1: Create `call` table migration

**Files:**
- Create: `migrations/YYYYMMDD_create_calls_table.sql`

- [ ] **Step 1: Write migration**

```sql
CREATE TYPE call_state AS ENUM ('ringing','in_progress','on_hold','supervised','wrapping_up','ended','failed');
CREATE TYPE call_end_reason AS ENUM ('completed','caller_hangup','agent_hangup','supervisor_end','error','timeout');
CREATE TYPE call_direction AS ENUM ('inbound','outbound');
CREATE TYPE call_channel AS ENUM ('pstn','sip','web','test');

CREATE TABLE call (
  id          TEXT PRIMARY KEY,  -- ULID
  tenant_id   UUID NOT NULL,
  agent_id    UUID NOT NULL REFERENCES agent_definitions(id),
  agent_version TEXT NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at    TIMESTAMPTZ,
  state       call_state NOT NULL DEFAULT 'ringing',
  end_reason  call_end_reason,
  direction   call_direction NOT NULL,
  caller_number TEXT NOT NULL,
  caller_name TEXT,
  callee_number TEXT NOT NULL,
  channel     call_channel NOT NULL DEFAULT 'pstn',
  cost_cents  INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  recording_uri TEXT,
  transcript_uri TEXT,
  metadata    JSONB DEFAULT '{}',
  current_intent TEXT,
  latency_ms  INTEGER,
  supervised_by TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_tenant_started ON call(tenant_id, started_at DESC);
CREATE INDEX idx_call_tenant_state ON call(tenant_id, state) WHERE state != 'ended';
CREATE INDEX idx_call_agent_started ON call(agent_id, started_at DESC);
```

- [ ] **Step 2: Enable RLS**

```sql
ALTER TABLE call ENABLE ROW LEVEL SECURITY;
CREATE POLICY call_tenant_isolation ON call
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

- [ ] **Step 3: Run migration and verify**
- [ ] **Step 4: Commit**

### Task 1.2: Create `transcript_turn` table migration

**Files:**
- Create: `migrations/YYYYMMDD_create_transcript_turn.sql`

- [ ] **Step 1: Write migration**

```sql
CREATE TYPE transcript_role AS ENUM ('caller','agent','supervisor','system');

CREATE TABLE transcript_turn (
  id           TEXT PRIMARY KEY,
  call_id      TEXT NOT NULL REFERENCES call(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL,
  seq          INTEGER NOT NULL,
  role         transcript_role NOT NULL,
  started_at_ms INTEGER NOT NULL,
  ended_at_ms  INTEGER NOT NULL,
  text         TEXT NOT NULL,
  is_partial   BOOLEAN NOT NULL DEFAULT false,
  confidence   REAL,
  language     TEXT DEFAULT 'en-US',
  redactions   JSONB[],
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(call_id, seq)
);

ALTER TABLE transcript_turn ENABLE ROW LEVEL SECURITY;
CREATE POLICY tt_tenant_isolation ON transcript_turn
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

- [ ] **Step 2: Run migration and verify**
- [ ] **Step 3: Commit**

### Task 1.3: Create `tool_execution` table migration

**Files:**
- Create: `migrations/YYYYMMDD_create_tool_execution.sql`

- [ ] **Step 1: Write migration**

```sql
CREATE TYPE tool_status AS ENUM ('ok','error','timeout','cancelled');

CREATE TABLE tool_execution (
  id           TEXT PRIMARY KEY,
  call_id      TEXT NOT NULL REFERENCES call(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL,
  turn_id      TEXT REFERENCES transcript_turn(id),
  tool_name    TEXT NOT NULL,
  tool_version TEXT,
  started_at_ms INTEGER NOT NULL,
  ended_at_ms  INTEGER NOT NULL,
  status       tool_status NOT NULL,
  arguments    JSONB,
  result       JSONB,
  error        JSONB,
  latency_ms   INTEGER NOT NULL,
  cost_cents   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tool_exec_call ON tool_execution(call_id, started_at_ms);
ALTER TABLE tool_execution ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Commit**

### Task 1.4: Create `call_event` table migration

**Files:**
- Create: `migrations/YYYYMMDD_create_call_event.sql`

- [ ] **Step 1: Write migration**

```sql
CREATE TYPE event_kind AS ENUM ('state_change','model_invocation','asr_event','tts_event','dtmf','handoff','supervisor_action','log');
CREATE TYPE event_severity AS ENUM ('debug','info','warn','error');

CREATE TABLE call_event (
  id         TEXT PRIMARY KEY,
  call_id    TEXT NOT NULL REFERENCES call(id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL,
  at_ms      INTEGER NOT NULL,
  kind       event_kind NOT NULL,
  severity   event_severity NOT NULL DEFAULT 'info',
  payload    JSONB DEFAULT '{}',
  label      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_event_call ON call_event(call_id, at_ms);
CREATE INDEX idx_call_event_tenant_kind ON call_event(tenant_id, kind, at_ms DESC);
ALTER TABLE call_event ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Commit**

### Task 1.5: Create `recording` table migration

**Files:**
- Create: `migrations/YYYYMMDD_create_recording.sql`

- [ ] **Step 1: Write migration**

```sql
CREATE TABLE recording (
  call_id      TEXT PRIMARY KEY REFERENCES call(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL,
  uri          TEXT NOT NULL,
  codec        TEXT NOT NULL DEFAULT 'opus',
  sample_rate  INTEGER NOT NULL DEFAULT 16000,
  channels     INTEGER NOT NULL DEFAULT 1,
  duration_ms  INTEGER NOT NULL,
  bytes        BIGINT NOT NULL,
  waveform_peaks_uri TEXT,
  retention_expires_at TIMESTAMPTZ,
  encryption_key_id TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE recording ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Commit**

### Task 1.6: Create `supervisor_audit_log` table

**Files:**
- Create: `migrations/YYYYMMDD_create_supervisor_audit_log.sql`

- [ ] **Step 1: Write migration**

```sql
CREATE TYPE supervisor_action AS ENUM (
  'listen.started','listen.ended',
  'takeover.started','takeover.ended',
  'handback','end_call',
  'recording.downloaded','transcript.exported'
);

CREATE TABLE supervisor_audit_log (
  id             TEXT PRIMARY KEY,
  tenant_id      UUID NOT NULL,
  actor_user_id  UUID NOT NULL,
  actor_role     TEXT NOT NULL,
  action         supervisor_action NOT NULL,
  call_id        TEXT NOT NULL REFERENCES call(id),
  reason         TEXT,
  ip             TEXT,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_tenant ON supervisor_audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_call ON supervisor_audit_log(call_id, created_at);
```

- [ ] **Step 2: Commit**

---

## Phase 2: API Endpoints (REST)

### Task 2.1: GET `/admin/calls/live` — Live call list

- [ ] **Step 1: Create handler** — Query `call WHERE state NOT IN ('ended','failed')` ordered by `started_at DESC`. Join agent name from `agent_definitions`. Aggregate tool names from `tool_execution`.
- [ ] **Step 2: Add tenant filter** — Optional `?tenant_id=` query param. Platform admins see all; tenant admins auto-scoped by RLS.
- [ ] **Step 3: Write tests**
- [ ] **Step 4: Commit**

### Task 2.2: GET `/admin/calls/history` — Historical call list

- [ ] **Step 1: Create handler** — Query `call WHERE state IN ('ended','failed')`. Cursor-paginated by `started_at DESC`.
- [ ] **Step 2: Add filters** — `?tenant_id=`, `?agent_name=`, `?end_reason=`, `?started_after=`, `?started_before=`, `?limit=`, `?cursor=`
- [ ] **Step 3: Include `supervised_by`** — Join from `supervisor_audit_log WHERE action = 'takeover.started'`.
- [ ] **Step 4: Include `tools[]`** — Aggregate distinct `tool_name` from `tool_execution`.
- [ ] **Step 5: Write tests**
- [ ] **Step 6: Commit**

### Task 2.3: GET `/admin/calls/{callId}/replay` — Full replay data

- [ ] **Step 1: Create handler** — Returns `{ call, transcript, events, tool_executions, recording }`.
- [ ] **Step 2: Fetch transcript** — `SELECT * FROM transcript_turn WHERE call_id = $1 AND is_partial = false ORDER BY seq`.
- [ ] **Step 3: Fetch events** — `SELECT * FROM call_event WHERE call_id = $1 ORDER BY at_ms`.
- [ ] **Step 4: Fetch tool executions** — `SELECT * FROM tool_execution WHERE call_id = $1 ORDER BY started_at_ms`.
- [ ] **Step 5: Fetch recording** — `SELECT * FROM recording WHERE call_id = $1`.
- [ ] **Step 6: Write tests**
- [ ] **Step 7: Commit**

### Task 2.4: POST `/admin/calls/{callId}/supervisor/listen` — Start listen-in

- [ ] **Step 1: Create handler** — Provision receive-only WebRTC session via media bridge API. Return `{ sdp_offer, ice_servers, session_token, expires_at }`.
- [ ] **Step 2: Audit log** — Insert `supervisor_audit_log` with `action = 'listen.started'`.
- [ ] **Step 3: Idempotency** — Accept `Idempotency-Key` header, deduplicate.
- [ ] **Step 4: Write tests**
- [ ] **Step 5: Commit**

### Task 2.5: DELETE `/admin/calls/{callId}/supervisor/listen` — End listen-in

- [ ] **Step 1: Create handler** — Tear down WebRTC subscription.
- [ ] **Step 2: Audit log** — `listen.ended`.
- [ ] **Step 3: Commit**

### Task 2.6: POST `/admin/calls/{callId}/supervisor/takeover` — Take over call

- [ ] **Step 1: Create handler** — Body: `{ reason, announce }`. Compare-and-set `call.state` from `in_progress/on_hold` to `supervised`. Return 409 if already supervised.
- [ ] **Step 2: Mute agent** — Signal orchestrator to mute AI agent TTS and pause tool execution.
- [ ] **Step 3: WebRTC** — Provision bidirectional WebRTC session for supervisor.
- [ ] **Step 4: Announce** — If `announce = true`, play TTS to caller ("Connecting you to a specialist").
- [ ] **Step 5: Audit log** — `takeover.started` with `reason`.
- [ ] **Step 6: Write tests** — Test concurrent takeover (expect 409), test state precondition.
- [ ] **Step 7: Commit**

### Task 2.7: POST `/admin/calls/{callId}/supervisor/handback` — Hand back to agent

- [ ] **Step 1: Create handler** — Set `call.state = 'in_progress'`, unmute agent, tear down supervisor WebRTC.
- [ ] **Step 2: Audit log** — `handback`.
- [ ] **Step 3: Commit**

### Task 2.8: POST `/admin/calls/{callId}/supervisor/end` — Force end call

- [ ] **Step 1: Create handler** — Set `call.state = 'ended'`, `end_reason = 'supervisor_end'`, `ended_at = now()`.
- [ ] **Step 2: Cleanup** — Tear down all WebRTC sessions, finalize recording upload.
- [ ] **Step 3: Audit log** — `end_call`.
- [ ] **Step 4: Commit**

### Task 2.9: GET `/admin/calls/{callId}/recording` — Signed recording URL

- [ ] **Step 1: Create handler** — Generate short-lived signed URL (60s) from object storage. Return 307 redirect.
- [ ] **Step 2: Audit log** — `recording.downloaded`.
- [ ] **Step 3: Commit**

### Task 2.10: GET `/admin/calls/{callId}/transcript` — Export transcript

- [ ] **Step 1: Create handler** — Return full transcript as JSON. Support `?format=vtt` for WebVTT.
- [ ] **Step 2: Audit log** — `transcript.exported`.
- [ ] **Step 3: Commit**

---

## Phase 3: Real-time Streaming (SSE)

### Task 3.1: SSE endpoint — Tenant live feed

**Endpoint:** `GET /admin/calls/tenants/{tenantId}/live/stream`

- [ ] **Step 1: Create SSE handler** — Tail Redis Stream key `stream:{tenant_id}:tenant-live`.
- [ ] **Step 2: Event types** — `call.started`, `call.updated`, `call.ended`, `heartbeat` (every 15s).
- [ ] **Step 3: `Last-Event-ID` support** — On reconnect, replay from stream store (up to 24h).
- [ ] **Step 4: Auth** — Validate session token, enforce tenant scope.
- [ ] **Step 5: Write tests**
- [ ] **Step 6: Commit**

### Task 3.2: SSE endpoint — Per-call transcript + events stream

**Endpoint:** `GET /admin/calls/{callId}/stream?include=transcript,events,tool_executions`

- [ ] **Step 1: Create SSE handler** — Tail Redis Stream key `stream:{tenant_id}:{call_id}`.
- [ ] **Step 2: Event types** — `transcript.partial`, `transcript.final`, `tool.started`, `tool.finished`, `event`, `state`, `heartbeat`.
- [ ] **Step 3: `Last-Event-ID` support**
- [ ] **Step 4: Write tests**
- [ ] **Step 5: Commit**

### Task 3.3: Connect frontend to SSE

**Files:**
- Modify: `web/src/app/(deployment)/admin/calls/page.tsx`
- Create: `web/src/lib/realtime/use-admin-live-feed.ts`
- Create: `web/src/lib/realtime/use-admin-call-stream.ts`

- [ ] **Step 1: Create `useAdminLiveFeed` hook** — EventSource to `/admin/calls/tenants/{tenantId}/live/stream`. Maintain call list state from SSE events instead of SWR polling.
- [ ] **Step 2: Create `useAdminCallStream` hook** — EventSource to `/admin/calls/{callId}/stream`. Feed transcript turns and events to the Live Detail view.
- [ ] **Step 3: Replace SWR polling** — In Live tab, swap `useSWR(refreshInterval: 10_000)` with the SSE hook. Keep SWR for initial load, SSE for updates.
- [ ] **Step 4: Reconnection** — Exponential backoff (0.5s, 1s, 2s, max 30s). Show "Reconnecting..." banner when disconnected.
- [ ] **Step 5: Write tests**
- [ ] **Step 6: Commit**

---

## Phase 4: WebRTC Audio Integration

### Task 4.1: Listen-in WebRTC client

**Files:**
- Create: `web/src/lib/realtime/use-listen-in.ts`
- Modify: `web/src/app/(deployment)/admin/calls/page.tsx`

- [ ] **Step 1: Create `useListenIn` hook** — When activated, POST to `/admin/calls/{callId}/supervisor/listen`, receive SDP offer + ICE servers, complete WebRTC handshake with media bridge.
- [ ] **Step 2: Audio output** — Connect received audio track to an `<audio>` element (not visible). Respect volume/mute from Monitor Bar.
- [ ] **Step 3: Teardown** — On Leave click or navigation, DELETE `/admin/calls/{callId}/supervisor/listen` and close RTCPeerConnection.
- [ ] **Step 4: Replace dummy** — Remove `setListening(true)` dummy state; wire to real hook.
- [ ] **Step 5: Commit**

### Task 4.2: Take-over WebRTC client

**Files:**
- Create: `web/src/lib/realtime/use-takeover.ts`
- Modify: `web/src/app/(deployment)/admin/calls/page.tsx`

- [ ] **Step 1: Create `useTakeover` hook** — POST to `/admin/calls/{callId}/supervisor/takeover` with `{ reason, announce }`. Receive SDP, complete bidirectional WebRTC handshake.
- [ ] **Step 2: Microphone** — Request microphone permission, publish audio track. Show mic permission error if denied.
- [ ] **Step 3: Handback** — POST `/admin/calls/{callId}/supervisor/handback`, close publishing track, optionally keep listen-only.
- [ ] **Step 4: Replace dummy** — Wire TakeoverModal confirm to real hook.
- [ ] **Step 5: Commit**

---

## Phase 5: Frontend API Integration

### Task 5.1: Remove mock dispatcher routes

**Files:**
- Modify: `web/src/lib/mock/dispatcher.ts`

- [ ] **Step 1: Remove** the `/admin/calls/*` routes from the mock dispatcher. Live data now comes from real API.
- [ ] **Step 2: Keep fixtures** for dev/test — only remove dispatcher routing so `GROVE_USE_MOCK_API=true` falls through to real API for calls.
- [ ] **Step 3: Commit**

### Task 5.2: Wire page buttons to real API

**Files:**
- Modify: `web/src/app/(deployment)/admin/calls/page.tsx`
- Modify: `web/src/app/(deployment)/admin/calls/[callId]/page.tsx`

- [ ] **Step 1: Export CSV** — Replace `downloadDummyFile` with real CSV generated from API data (already works, just ensure data is from API).
- [ ] **Step 2: Export transcript** — Replace dummy text download with `GET /admin/calls/{callId}/transcript` → download response.
- [ ] **Step 3: Download recording** — Call `GET /admin/calls/{callId}/recording`, open signed URL in new tab.
- [ ] **Step 4: End call** — POST `/admin/calls/{callId}/supervisor/end`. On success, update local state and show toast. On error, show error toast.
- [ ] **Step 5: Remove all `dummyNotice` / `downloadDummyFile` functions** — Replace with real API calls and proper error handling via `useActionState`.
- [ ] **Step 6: Commit**

### Task 5.3: Replay page — real audio player

**Files:**
- Modify: `web/src/app/(deployment)/admin/calls/[callId]/page.tsx`

- [ ] **Step 1: Fetch recording signed URL** — On page load, call `GET /admin/calls/{callId}/recording` to get signed URL.
- [ ] **Step 2: Real `<audio>` element** — Replace simulated waveform with HTML5 audio player. Bind `currentTime` to playhead state.
- [ ] **Step 3: Waveform from peaks** — If `waveform_peaks_uri` is available, fetch pre-computed peaks and render real waveform. Fallback to simulated bars.
- [ ] **Step 4: Speed controls** — Wire 0.5x/1x/1.5x/2x buttons to `audio.playbackRate`.
- [ ] **Step 5: Sync** — Seeking in timeline/transcript/events updates `audio.currentTime`. Audio `timeupdate` updates playhead.
- [ ] **Step 6: Commit**

---

## Phase 6: Role-Based Access Control

### Task 6.1: Enforce roles on API endpoints

- [ ] **Step 1: Define permission matrix** (from design doc §7.2):

| Role | Live list | Transcript | Listen-in | Take-over | Recording | Audit |
|---|---|---|---|---|---|---|
| `platform_admin` | all tenants | yes | yes | yes | yes | yes |
| `tenant_admin` | own tenant | yes | yes | yes | conditional | own tenant |
| `tenant_operator` | own tenant | yes | yes | no | no | no |
| `compliance_reviewer` | own tenant (historical) | yes | no | no | yes | yes |

- [ ] **Step 2: Add middleware** — Check `session.role` against permission matrix before each handler.
- [ ] **Step 3: Tenant scoping** — `tenant_admin` and below always scoped by `SET LOCAL app.tenant_id`. `platform_admin` can pass `?tenant_id=` or see all.
- [ ] **Step 4: Frontend guards** — Hide Take over / End call buttons for `tenant_operator`. Hide live tab for `compliance_reviewer`.
- [ ] **Step 5: Write tests** — Test each role against each endpoint (expect 200 or 403).
- [ ] **Step 6: Commit**

---

## Phase 7: Recording Pipeline

### Task 7.1: Recording upload on call end

- [ ] **Step 1: Media bridge hook** — On call end, media bridge uploads recording chunks to object storage (S3/GCP).
- [ ] **Step 2: Finalize** — Write `recording` row with URI, codec, duration, byte size.
- [ ] **Step 3: Waveform peaks** — Post-processing job computes PCM peaks from recording and stores as `waveform_peaks_uri`.
- [ ] **Step 4: Update call** — Set `call.recording_uri`.
- [ ] **Step 5: Commit**

### Task 7.2: Recording retention

- [ ] **Step 1: Per-tenant policy** — `retention_expires_at` computed from tenant policy on insert.
- [ ] **Step 2: Cleanup job** — Daily cron deletes expired recordings from object storage and nulls URI fields.
- [ ] **Step 3: Commit**

---

## Phase 8: Voice Pipeline Integration

### Task 8.1: Call lifecycle events → database

- [ ] **Step 1: Pipeline producer** — Voice pipeline writes `call` state transitions, `transcript_turn` finalisations, `tool_execution` results, and `call_event` rows via outbox pattern.
- [ ] **Step 2: Stream store** — Pipeline also writes to Redis Streams for real-time SSE consumption.
- [ ] **Step 3: Partial turns** — `transcript.partial` events go to stream store only (not DB). `transcript.final` persists to DB and replaces partials.
- [ ] **Step 4: Commit**

### Task 8.2: End-of-call processing

- [ ] **Step 1: Finalise** — On `call.state = ended/failed`, compute `duration_ms`, write canonical transcript JSON to object storage (`transcript_uri`).
- [ ] **Step 2: Cost rollup** — Sum `tool_execution.cost_cents` + telephony cost → `call.cost_cents`.
- [ ] **Step 3: Commit**

---

## Dependency Graph

```
Phase 1 (DB) ──┬── Phase 2 (API) ──┬── Phase 5 (Frontend wire-up)
               │                   │
               │                   ├── Phase 3 (SSE)
               │                   │
               │                   └── Phase 4 (WebRTC)
               │
               └── Phase 8 (Pipeline) ── Phase 7 (Recording)

Phase 6 (RBAC) can run in parallel after Phase 2.
```

Phases 1–2 are blocking. Phases 3, 4, 6, 7 can run in parallel once Phase 2 is done. Phase 5 integrates everything into the frontend. Phase 8 connects the voice pipeline.
