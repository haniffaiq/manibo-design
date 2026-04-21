# Calls Admin Module — Design Document

| | |
|---|---|
| **Status** | Implemented (design pack) · v0.2 |
| **Owner** | Platform / Admin Console |
| **Last updated** | 2026-04-18 |
| **Target release** | Q2 2026 |
| **Related** | `agent-definitions`, `telephony`, `audit` |

---

## 1. Feature Overview

### 1.1 Purpose

Give operators a single surface in the Deployment Console to **observe, intervene in, and audit** voice-AI calls handled by tenant-owned agents. Today, live call visibility is spread across provider dashboards and ad-hoc logs; there is no supervised hand-off path and no consolidated post-mortem view. The Calls module closes that gap.

### 1.2 Target users

| Persona | Primary need |
|---|---|
| **Platform admin** (manibo staff) | Cross-tenant triage, incident response, abuse review |
| **Tenant admin** | Monitor their own agents in production, intervene when agents drift |
| **Tenant agent-builder** | Reproduce and debug failed calls, inspect tool traces |
| **Compliance reviewer** | Retrieve recordings and transcripts with a full audit trail |

### 1.3 In-scope

- Tenant-scoped list of **live** calls with streamed transcripts.
- **Listen-in** (read-only audio) and **Take-over** (human-in-the-loop hand-off).
- **Historical** call inspection: transcript, recording, tool-call trace, internal events.
- Role-based access control, tenant isolation, and full audit logging of supervisor actions.

### 1.4 Out-of-scope (v1)

- Outbound dialer UI; call creation flows live in `telephony`.
- Analytics dashboards (funnel, sentiment trends) — see §10.
- Transcript full-text search — see §10.
- Automatic redaction pipelines (planned, gated behind compliance review).

### 1.5 Non-goals

- We are **not** rebuilding media infrastructure. Audio and transcript streams are produced by the existing voice pipeline; this module is a consumer.
- We are **not** a call-center ACD. No queueing, routing, or skill-based assignment.

---

## 2. User Flows

### 2.1 Live call monitoring

1. Admin opens `Calls` in the sidebar.
2. Selects a tenant from the tenant picker (platform admins only; tenant admins are scoped automatically).
3. A live list auto-populates, sorted by call start time descending. Each row shows: agent name, caller ID, duration, current agent turn, and status chip (`Ringing`, `In progress`, `On hold`, `Wrapping up`).
4. The list updates in real time as calls start, change state, or end. Ended calls fade out after 10 s and move to history.
5. Clicking a row opens the **Call Detail drawer** on the right, which immediately begins streaming the transcript.

### 2.2 Listen-in

1. From the Call Detail drawer, admin clicks **Listen in**.
2. Browser requests audio-output permission (one-time per session) and opens a WebRTC receive-only subscription to the call's media bridge.
3. A persistent **Monitor bar** pins to the bottom of the viewport: waveform, mute-local, volume, and a red **Leave** button.
4. The caller and agent are **not notified**. A `supervisor.listen.started` audit event is emitted with supervisor identity, tenant, call id, and timestamp.
5. Leaving, closing the drawer, or navigating away tears down the subscription and emits `supervisor.listen.ended`.

### 2.3 Take-over

Take-over is a **destructive, auditable** action with explicit confirmation.

1. Admin clicks **Take over** in the Call Detail drawer.
2. Confirmation modal shows: caller name/number, agent being paused, estimated impact ("Agent will be muted; you will speak directly to the caller"), and a required **reason** field (free text, stored).
3. On confirm:
   - The orchestrator marks the call `state = supervised`, mutes the AI agent's TTS output, and pauses its tool execution.
   - A bi-directional WebRTC session is established between the supervisor and the caller.
   - A short system announcement is optionally played to the caller ("Connecting you to a specialist") — configurable per tenant, default **off**.
4. The supervisor speaks; their audio is transcribed into the same transcript stream, tagged `role = supervisor`.
5. **Release options:**
   - **Hand back to agent** — unmutes AI, restores `state = in_progress`.
   - **End call** — terminates the call cleanly.
6. All state transitions emit audit events (§7.3).

### 2.4 Historical call inspection

1. Admin switches to the **History** tab inside Calls (or selects an ended call).
2. Filters: tenant, agent, date range, outcome, duration, tool used, caller id.
3. Row click opens the **Call Replay view**, a dedicated full-page surface with four synced panels:
   - **Timeline scrubber** (top) — full call duration with event markers.
   - **Transcript** (left) — turn-by-turn, click a turn to jump.
   - **Audio player** (bottom) — waveform, playback controls, 0.5×–2× speed.
   - **Event inspector** (right) — tool calls, model invocations, state transitions, internal logs. Scrubbing the timeline highlights the event at that timestamp; clicking an event seeks audio + transcript.

---

## 3. UI Layout Proposal

### 3.1 Information architecture

```
Sidebar
└── PLATFORM
    └── Calls            ← new entry, below Audit
        ├── Live         (default tab)
        └── History
```

The Calls entry sits under **PLATFORM** next to `Audit`, not under **AGENTS**, because its scope is operational observation, not agent configuration.

### 3.2 Live tab — three-column layout

| Column | Width | Contents |
|---|---|---|
| **Tenant rail** | 260 px | Tenant picker (matching the existing agent list selector), live-call count badge per tenant, "All tenants" option for platform admins. |
| **Call list** | 360 px | Virtualised list of live calls. Row: status dot, agent name, caller, duration ticking, latest intent. Search + filter chips at the top. |
| **Call detail drawer** | flex | Header (agent, caller, duration, state pill). Action bar (`Listen in`, `Take over`, `End call`). Transcript stream (auto-scrolling, pinnable). Collapsible **Context** panel: agent version, tools available, current variables. |

### 3.3 History tab

- Same three-column skeleton; the middle column becomes a filterable, paginated table.
- Row click pushes the Call Replay view as a full-page route (not a drawer) because of its density.

### 3.4 Call Replay view — four-pane synced layout

```
┌────────────────────────────────────────────────────────────────┐
│ Timeline scrubber · events · speaker lanes                     │
├──────────────────────────────┬─────────────────────────────────┤
│                              │                                 │
│  Transcript                  │  Event inspector                │
│  (turn-by-turn, searchable)  │  (tool calls, logs, state)      │
│                              │                                 │
├──────────────────────────────┴─────────────────────────────────┤
│ Audio player · waveform · 0.5–2× · download (if permitted)     │
└────────────────────────────────────────────────────────────────┘
```

All four panes share a single **playhead time** in a small state store. Any pane can seek; the others follow.

### 3.5 Key components (reusable)

- `CallStatusPill` — maps 7 states to color tokens.
- `TranscriptTurn` — role-coloured bubble with timestamp, confidence bar, and copy-quote action.
- `WaveformScrubber` — SVG-rendered, receives PCM peaks from server.
- `ToolCallCard` — collapsible, shows tool name, arguments (JSON), result, latency.
- `MonitorBar` — fixed-bottom supervisor controls for listen/take-over sessions.

---

## 4. Data Model Proposal

Storage boundaries:

- **Hot store** (PostgreSQL): call, transcript-turn, tool-execution, event. Indexed for tenant+time queries.
- **Cold store** (object storage, e.g. S3): recordings (Opus/WAV), full transcript JSON exports, large payload blobs referenced from event rows.
- **Stream store** (Redis Streams or Kafka): ephemeral live channels, retained 24 h for reconnect/replay.

### 4.1 `call`

| Field | Type | Notes |
|---|---|---|
| `id` | ULID | Global, sortable. |
| `tenant_id` | UUID | **Not null**, all queries filter on this. |
| `agent_id` | UUID | FK → `agent_definitions`. |
| `agent_version` | string | Snapshot; agent may be edited post-call. |
| `started_at` | timestamptz | |
| `ended_at` | timestamptz | Nullable while live. |
| `state` | enum | `ringing` · `in_progress` · `on_hold` · `supervised` · `wrapping_up` · `ended` · `failed`. |
| `end_reason` | enum | `completed` · `caller_hangup` · `agent_hangup` · `supervisor_end` · `error` · `timeout`. |
| `direction` | enum | `inbound` · `outbound`. |
| `caller_number` | E.164 | Hashed in cold store if PII policy requires. |
| `callee_number` | E.164 | |
| `channel` | enum | `pstn` · `sip` · `web` · `test`. |
| `cost_cents` | int | Running total while live. |
| `duration_ms` | int | Derived on close. |
| `recording_uri` | string | Set post-call. |
| `transcript_uri` | string | Set post-call (canonical JSON). |
| `metadata` | jsonb | Tenant-defined tags. |

Indexes: `(tenant_id, started_at DESC)`, `(tenant_id, state) WHERE state != 'ended'`, `(agent_id, started_at DESC)`.

### 4.2 `transcript_turn`

| Field | Type | Notes |
|---|---|---|
| `id` | ULID | |
| `call_id` | ULID | FK. |
| `tenant_id` | UUID | Denormalised for row-level security. |
| `seq` | int | Monotonic within call. |
| `role` | enum | `caller` · `agent` · `supervisor` · `system`. |
| `started_at_ms` | int | Offset from call start. |
| `ended_at_ms` | int | |
| `text` | text | Finalised text. |
| `is_partial` | bool | True while streaming; replaced on finalisation. |
| `confidence` | float | ASR confidence 0–1. |
| `language` | string | BCP-47. |
| `redactions` | jsonb[] | Optional redacted spans. |

Partials are written to the stream store only; finalised turns are persisted.

### 4.3 `recording`

| Field | Type | Notes |
|---|---|---|
| `call_id` | ULID | PK. |
| `tenant_id` | UUID | |
| `uri` | string | Object-store key. |
| `codec` | enum | `opus` · `pcm16` · `mp3`. |
| `sample_rate` | int | |
| `channels` | int | 1 = mono, 2 = stereo (caller/agent split). |
| `duration_ms` | int | |
| `bytes` | bigint | |
| `waveform_peaks_uri` | string | Pre-computed peaks for scrubber. |
| `retention_expires_at` | timestamptz | Per-tenant policy. |
| `encryption_key_id` | string | KMS reference. |

### 4.4 `tool_execution`

| Field | Type | Notes |
|---|---|---|
| `id` | ULID | |
| `call_id` | ULID | |
| `tenant_id` | UUID | |
| `turn_id` | ULID | Optional FK — turn that triggered it. |
| `tool_name` | string | |
| `tool_version` | string | |
| `started_at_ms` | int | |
| `ended_at_ms` | int | |
| `status` | enum | `ok` · `error` · `timeout` · `cancelled`. |
| `arguments` | jsonb | Truncated at 32 KB; overflow in cold store. |
| `result` | jsonb | Same. |
| `error` | jsonb | `{code, message, stack}` on failure. |
| `latency_ms` | int | |
| `cost_cents` | int | If tool is billable. |

### 4.5 `call_event`

Narrow, append-only table for the event inspector. Everything the call does that is neither a transcript turn nor a tool call.

| Field | Type | Notes |
|---|---|---|
| `id` | ULID | |
| `call_id` | ULID | |
| `tenant_id` | UUID | |
| `at_ms` | int | Offset from call start. |
| `kind` | enum | `state_change` · `model_invocation` · `asr_event` · `tts_event` · `dtmf` · `handoff` · `supervisor_action` · `log`. |
| `severity` | enum | `debug` · `info` · `warn` · `error`. |
| `payload` | jsonb | Kind-specific. |

Indexes: `(call_id, at_ms)`, `(tenant_id, kind, at_ms DESC)`.

### 4.6 Relationships

```
tenant ─┬─< agent ─< call ─┬─< transcript_turn
        │                  ├─< tool_execution ─< (turn)
        │                  ├─< call_event
        │                  └── recording (1:1)
        └─< user (supervisor) ─< audit_log
```

---

## 5. API Design Proposal

All endpoints are under `/api/v1/admin/calls`. Every request carries `X-Tenant-Id` (required for platform admins; implicit for tenant-scoped tokens). Row-level security enforces this server-side regardless.

### 5.1 REST

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/tenants/{tenant_id}/live` | Live call list. Cursor-paginated. |
| `GET` | `/tenants/{tenant_id}/history` | Historical list. Filters via query params. |
| `GET` | `/{call_id}` | Full call detail. |
| `GET` | `/{call_id}/transcript` | Full transcript JSON. `?format=vtt` returns WebVTT. |
| `GET` | `/{call_id}/recording` | Redirect (307) to a **short-lived signed URL** from object storage. |
| `GET` | `/{call_id}/events` | Paginated event log. Filter by `kind`, `severity`, `at_ms` range. |
| `GET` | `/{call_id}/tool-executions` | Paginated tool calls. |
| `POST` | `/{call_id}/supervisor/listen` | Provision listen-in session. Returns WebRTC SDP offer + ICE servers. |
| `DELETE` | `/{call_id}/supervisor/listen` | End listen-in. |
| `POST` | `/{call_id}/supervisor/takeover` | Body `{reason, announce: bool}`. Returns WebRTC credentials. |
| `POST` | `/{call_id}/supervisor/handback` | Return control to AI agent. |
| `POST` | `/{call_id}/supervisor/end` | Force-end the call. |

All mutating endpoints are **idempotent by `Idempotency-Key` header** and emit audit events.

### 5.2 Streaming channels

We use **Server-Sent Events (SSE)** for transcript and event streams (unidirectional, trivial to scale, survives proxies). We use **WebRTC** only for audio. WebSockets are avoided unless bidirectional non-audio signalling is required.

#### 5.2.1 SSE: tenant live feed

`GET /tenants/{tenant_id}/live/stream`

Event types:

| Event | Payload |
|---|---|
| `call.started` | `{call, agent, caller}` |
| `call.updated` | `{call_id, state, duration_ms, ...patch}` |
| `call.ended` | `{call_id, end_reason, duration_ms}` |
| `heartbeat` | every 15 s, empty. |

#### 5.2.2 SSE: call transcript + events

`GET /{call_id}/stream?include=transcript,events,tool_executions`

| Event | Payload |
|---|---|
| `transcript.partial` | `{turn_id, seq, role, text, at_ms}` |
| `transcript.final` | finalised `transcript_turn` row |
| `tool.started` | `tool_execution` (no result yet) |
| `tool.finished` | patched `tool_execution` |
| `event` | `call_event` |
| `state` | current call state |
| `heartbeat` | every 10 s. Last-Event-ID supported for resume. |

Clients must honour `Last-Event-ID` on reconnect. Server replays from the stream store (≤ 24 h).

#### 5.2.3 WebRTC: audio

Initiated via the `POST .../listen` or `.../takeover` REST calls. The server returns:

```
{ sdp_offer, ice_servers, session_token, expires_at }
```

The browser completes the handshake against the media bridge directly. Tokens are single-use and short-lived (60 s to complete handshake).

### 5.3 Error model

All errors share the schema `{code, message, request_id, retryable}`. The console respects `retryable` for automatic SSE reconnection with exponential backoff.

---

## 6. Real-time Architecture

```
┌───────────────┐   REST    ┌──────────────────┐
│ Admin Console │◀─────────▶│  Admin API       │
│  (browser)    │           │  (stateless)     │
│               │   SSE     │                  │
│               │◀──────────┤                  │
└───────┬───────┘           └─────────┬────────┘
        │ WebRTC                      │
        │ (audio only)                │ reads/writes
        ▼                             ▼
┌───────────────┐           ┌──────────────────┐
│ Media Bridge  │           │ Stream Store     │
│ (SFU/mixer)   │◀──────────│ (Redis/Kafka)    │
└───────┬───────┘   audio   └─────────┬────────┘
        │ fanout                      │ fanin
        ▼                             │
┌───────────────┐                     │
│ Voice Pipeline│─────────────────────┘
│ (ASR, LLM,    │  transcript, events
│  TTS, tools)  │
└───────────────┘
```

### 6.1 Live updates

- The **Voice Pipeline** is the single producer of transcript turns, events, tool executions, and state transitions. It writes to the **Stream Store** and (for finalised rows) to Postgres in the same transaction boundary where possible; otherwise via an outbox pattern.
- The **Admin API** is a pure consumer. For an SSE subscriber, it tails the relevant stream keys (by `tenant_id` or `call_id`) and relays events.
- **Fan-out** is handled at the stream store, not the API. API instances are stateless and horizontally scalable.

### 6.2 Transcription stream handling

- Partial turns (`is_partial = true`) flow only through SSE — never written to Postgres. This keeps the hot DB small.
- Finalisation emits a `transcript.final` event and persists one row. The client reconciles by `turn_id`: a final replaces all prior partials for that id.
- The stream store keeps a **24 h replay window** keyed by `call_id`. On SSE reconnect with `Last-Event-ID`, the API replays missed events, then tails live.

### 6.3 State propagation

Call state is the authoritative field driving the UI. State changes are published as `call.updated` events on both the tenant live feed and the per-call stream. Conflicting views (e.g. list says `in_progress`, drawer says `supervised`) are resolved by taking the highest event sequence number.

### 6.4 Audio path

- **Listen-in** subscribes to a receive-only track on the media bridge. The bridge already has mixed caller+agent audio.
- **Take-over** promotes the supervisor to a publisher. The pipeline subscribes to the supervisor's track in place of the agent's TTS output, and pauses the LLM loop.
- The media bridge is the enforcement point for mute, handback, and end. The Admin API is never in the audio hot path.

### 6.5 Scaling targets (v1)

- 10 k concurrent live calls per region.
- 2 k concurrent supervisor SSE subscribers per region.
- < 250 ms end-to-end latency for transcript partials (ASR emit → browser render).
- < 400 ms for listen-in join.

---

## 7. Security & Multi-Tenant Design

### 7.1 Tenant isolation

- **Row-level security** in Postgres. Every table with tenant data has `tenant_id` as part of its RLS policy. The application connects as a role whose `SET LOCAL app.tenant_id` is pinned per request.
- **Stream keys** are namespaced: `stream:{tenant_id}:tenant-live`, `stream:{tenant_id}:{call_id}`. Consumers present a scoped token; the API rejects cross-tenant subscription attempts at the edge before touching the stream store.
- **Object storage** uses per-tenant prefixes and KMS keys scoped by tenant. Signed URLs embed tenant id and are validated server-side on re-access.

### 7.2 Roles

| Role | Live list | Transcript | Listen-in | Take-over | Recording download | Audit read |
|---|---|---|---|---|---|---|
| `platform_admin` | all tenants | ✅ | ✅ | ✅ | ✅ | ✅ |
| `tenant_admin` | own tenant | ✅ | ✅ | ✅ | ✅ (if policy allows) | own tenant |
| `tenant_operator` | own tenant | ✅ | ✅ | ❌ | ❌ | ❌ |
| `tenant_builder` | own tenant | ✅ (for debug) | ❌ | ❌ | ❌ | ❌ |
| `compliance_reviewer` | own tenant, historical only | ✅ | ❌ | ❌ | ✅ | ✅ |

Per-tenant **policy flags** can further restrict: `allow_recording_download`, `allow_takeover`, `require_takeover_reason`, `announce_on_takeover`.

### 7.3 Audit

Every supervisor action writes an immutable audit row:

```
audit_log {
  id, tenant_id, actor_user_id, actor_role,
  action ∈ {listen.started, listen.ended, takeover.started,
           takeover.ended, handback, end_call,
           recording.downloaded, transcript.exported},
  call_id, reason, ip, user_agent, created_at
}
```

Audit is surfaced in the existing **Platform → Audit** screen and is append-only. Deletions are impossible; retention is legally bounded and separate from call retention.

### 7.4 Data classification

- **Recordings and transcripts contain PII and often PCI / PHI.** They are encrypted at rest (KMS, tenant-scoped keys), encrypted in transit (TLS 1.3, DTLS-SRTP for audio), and access is always audited.
- Tenant policy may require **automatic redaction** of numeric sequences before persistence — out of scope for v1 but the schema supports a `redactions` array per turn.

---

## 8. Historical Storage Design

### 8.1 Transcripts

- Finalised turns live in Postgres (`transcript_turn`) for fast paginated reads and filtering.
- On call end, a consolidated **canonical transcript JSON** is written to object storage (`transcript_uri` on `call`). This is the source of truth for exports and archival.
- Retention: per-tenant config, default 90 days in Postgres, indefinite in object storage until policy expires them.

### 8.2 Recordings

- Written by the media bridge as the call progresses (chunked upload) so an interrupted call still has audio up to the break.
- Stored Opus 16 kHz mono by default; stereo with speaker separation when the tenant enables it (larger, enables better UI).
- **Waveform peaks** are pre-computed on ingest and stored alongside the recording — the browser never downloads raw audio to render the scrubber.
- Access is always via short-lived signed URLs issued through the Admin API, never direct.

### 8.3 Events & tool executions

- `call_event` and `tool_execution` are partitioned by month. Hot partitions stay in Postgres; cold partitions are moved to a columnar store (e.g. ClickHouse or Parquet on object storage) for analytical queries.
- Large payloads (tool arguments/results > 32 KB) are offloaded to object storage and referenced by URI to keep row sizes sane.

### 8.4 Query patterns

| Pattern | Index / approach |
|---|---|
| "All calls for tenant X last 24 h" | `(tenant_id, started_at DESC)` partial index. |
| "Replay events for call Y" | `(call_id, at_ms)` — scan is always bounded by one call. |
| "Calls where tool `book_appointment` failed" | Materialised view keyed on `(tenant_id, tool_name, status)`. |
| "Transcript search" | Deferred to v2; will use a dedicated search index (OpenSearch) fed from the event stream. |

### 8.5 Retention & deletion

- Per-tenant retention policy covers each data class independently (call metadata, transcripts, recordings, events).
- **Right-to-erasure** requests trigger a tombstone record and background deletion across Postgres, object storage, and search indexes; audit rows persist referencing the tombstone, not the PII.

---

## 9. Edge Cases

### 9.1 Lost connection (client)

- SSE client reconnects with exponential backoff (0.5 s, 1 s, 2 s, max 30 s) and `Last-Event-ID`.
- While disconnected, the UI shows a muted **"Reconnecting…"** banner and stops the duration ticker. It does **not** drop rendered transcript.
- On resume, missed events are replayed from the stream store (≤ 24 h). Anything older degrades to "refresh to see full history".

### 9.2 Partial transcript never finalises

- Each partial has a server-side finalisation deadline. If breached, the pipeline emits a synthetic `transcript.final` with `confidence = null` and a `finalisation: "timeout"` flag; the UI renders these turns in a muted style.
- Avoids ghost partials that look like the agent is "still speaking" forever.

### 9.3 Interrupted calls

- If the media path drops, the call moves to `state = failed` with `end_reason = error`. Any audio already uploaded is preserved. The transcript is finalised up to the last committed turn.
- Recovery is not attempted at this layer — the voice pipeline owns retry semantics.

### 9.4 Concurrent take-over attempts

- Take-over is a **compare-and-set** on `call.state`:
  - Precondition: `state IN (in_progress, on_hold)`.
  - Transition: set `state = supervised`, stamp `supervisor_user_id`, bump `state_version`.
- If two supervisors click simultaneously, exactly one succeeds. The loser gets `409 Conflict` with the winner's identity and can choose to **observe** (listen-in) instead.
- A supervisor already controlling cannot be displaced by another without first releasing or being forcibly kicked by a platform admin (explicit endpoint, separately audited).

### 9.5 Supervisor disconnects mid-takeover

- Media bridge detects DTLS timeout. If the supervisor does not reconnect within `takeover_grace_period` (default 15 s, tenant-configurable):
  - The call auto-transitions to `state = supervised_abandoned`.
  - Caller hears the announcement "One moment please." and the agent is automatically handed back (if policy allows) or the call is ended.
  - An audit event records the abandonment.

### 9.6 Agent ends the call during take-over

- Prevented at the orchestrator: while `state = supervised`, agent-initiated hangup actions are no-ops and logged as suppressed.

### 9.7 Recording larger than expected / disk pressure

- Media bridge chunks and uploads continuously; the hot buffer is bounded. If object storage is unreachable, the call still completes; a reconciliation job retries upload from a local spool for up to 24 h before alerting.

### 9.8 Clock skew between components

- All `at_ms` offsets are relative to `call.started_at` as stamped by the media bridge (single authority). UI never subtracts wall-clock timestamps from different services.

---

## 10. Future Extensions

### 10.1 Call analytics

- Aggregations over `call_event` and `tool_execution` powering per-tenant dashboards: call volume, resolution rate, containment (no-handoff) rate, tool success rates, average handle time.
- Implementation: ClickHouse projections fed from the same event stream.

### 10.2 Full-text transcript search

- OpenSearch index per tenant, written from the `transcript.final` stream.
- Query UI: cross-call search with filters (agent, date, outcome), snippet preview, jump-to-timestamp.

### 10.3 AI summarisation

- On call end, a summarisation job produces: TL;DR, caller intent, resolution, action items, sentiment, compliance flags. Stored on `call.summary` (jsonb).
- Shown as a collapsed panel in the Replay view.
- Opt-in per tenant; uses the tenant's own model credentials where applicable.

### 10.4 Coaching / QA workflows

- Mark calls for review, assign to reviewers, scorecard rubrics, reviewer comments anchored to timestamp ranges.

### 10.5 Realtime intervention prompts

- Surface "suggested supervisor interventions" during live calls (e.g. caller appears frustrated, agent looping). Gated behind explicit opt-in and separate design review — intervention UX is its own project.

---

## Appendix A — Open questions

1. **Who can listen in without notification?** Some jurisdictions require caller consent. Propose: default **announce on listen-in** for new tenants; legacy tenants grandfathered; per-tenant override with legal attestation.
2. **Recording retention default.** Finance/healthcare customers push for 7 years; startups push for 30 days. Propose 90 days default with per-tenant override.
3. **Takeover grace window for disconnects.** 15 s feels tight on poor networks. Validate against real supervisor network traces.
4. **Do we expose the Admin API as a tenant-facing API?** Same endpoints, same RLS — but SLO expectations are different. Deferred.

## Appendix B — Rejected alternatives

- **WebSocket for everything.** Rejected: SSE is simpler, survives more proxies, and transcript/events are unidirectional. WebRTC is already the right tool for audio. No endpoint needs bidirectional non-audio messaging in v1.
- **Single monolithic `call_event` table with transcript and tool calls embedded.** Rejected: query patterns differ; transcript needs language/confidence columns; tool calls have latency and status; event is everything else. Splitting keeps indexes small and intents clear.
- **Client-side recording stitching.** Rejected: bandwidth and complexity. Media bridge produces a single canonical recording.

## Appendix C — Glossary

- **ASR** — automatic speech recognition.
- **TTS** — text-to-speech.
- **SFU** — selective forwarding unit; the media bridge topology.
- **Turn** — a contiguous span of one speaker in the transcript.
- **Handback** — returning control from supervisor to AI agent.
