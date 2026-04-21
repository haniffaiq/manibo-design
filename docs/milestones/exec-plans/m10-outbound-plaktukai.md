# M10 Outbound Call Orchestration — Orchestration Plan

**Feature:** M10 Outbound Call Orchestration (Plaktukai)
**Feature spec:** wiki/design-docs/m10-outbound-plaktukai.md (feature spec archived into design doc)
**Design doc:** [wiki/design-docs/m10-outbound-plaktukai.md](../../../wiki/design-docs/m10-outbound-plaktukai.md)
**Status:** verified
**Track:** epic
**Created:** 2026-02-17

---

## 1. Feature Definition

**Feature name:** M10 Outbound Call Orchestration — Plaktukai

**Goal:** Enable batch outbound call campaigns with retry logic, post-call data extraction, and workflow triggers — orchestrating multiple VoiceCallWorkflow executions through a Temporal campaign workflow, starting with the Plaktukai (driver verification) use case.

**Acceptance criteria:**
- Voice conversations persist messages to grove.messages (in-memory collection in voice worker, post-call bulk persistence via Temporal activity)
- Call state machine works (pending → ringing → in_progress → completed) with 4 new outcomes (busy, voicemail, cancelled, transferred)
- Retries work on no-answer/busy (3 attempts with per-outcome delays: no_answer 60min, busy 30min). Retry infrastructure supports voicemail (120min delay configured) but voicemail detection is deferred to post-MVP — see tech debt.
- Post-call workflow executes (extraction + downstream actions via M20 WorkflowEngine)
- Plaktukai agents conduct calls in RU (Simona persona) and EN (Michael persona)
- Campaign supports pause/resume/cancel via Temporal signals
- Unit + integration tests cover campaign lifecycle, retry logic, and extraction (target: 76+ tests)

**Scope boundaries (NOT included):**
- REST API for campaign management (MVP uses Temporal CLI)
- Concurrent call execution (max_concurrent_calls > 1)
- Calling window enforcement (schema fields exist, implementation deferred)
- ScheduledCallWorkflow / cron triggers
- Notification activities (Freescout/SMS)
- Campaign dashboard UI (apps/web/)
- DATA-17/DATA-18 (workflow_templates/instances)
- Parallel fan-out in M20 workflow engine

---

## 2. Identifiers & Invariants

Every ID in this system must have a single owner (creator) and clear format. Collisions or ambiguity here cause silent data corruption.

**ID convention (current reality):** Grove schema and the current tenant schema use UUID primary keys (`gen_random_uuid()`). See `packages/grove/src/grove/alembic/versions/001_initial_schema.py` and `packages/platform-core/src/platform_core/alembic/versions/20260217_120000_initial_tenant_schema.py`. M10 does **not** attempt a platform-wide ID-format migration. Prefixed text IDs (per `AGENTS.md`) remain a future epic — making it a prerequisite is a delivery-killing blast radius and the current repo does not match the Phase P assumptions (several tables listed in Phase P do not exist in the tenant schema). New M10 tables use UUID PKs for consistency with existing tables.

| Identifier | Format | Created By | Uniqueness Scope |
|-----------|--------|-----------|-----------------|
| `campaign_id` | UUIDv4 | `create_campaign_record` activity (Phase 4) | Global (PK in tenant.campaigns) |
| `campaign_target_id` | UUIDv4 | `create_campaign_record` activity (bulk insert) | Global (PK in tenant.campaign_targets) |
| `call_id` | UUIDv4 | `create_call_record activity (Phase 2)` | Global (PK in tenant.calls) |
| `conversation_id` | Raw UUIDv4, **new per attempt** | `OutboundCallWithRetryWorkflow` (Phase 3), generated before each child `VoiceCallWorkflow` | Global (used as Temporal workflow ID suffix and grove.chats external_id — NOT a PK, no prefix) |
| `chat_id` | UUIDv4 | `grove_post_call_activity` via `find_or_create_by_external_id` | Global (PK in grove.chats) |

**Retry invariant:** Each retry attempt gets a **new** `conversation_id`. Temporal workflow ID `voice-call-{conversation_id}` is unique per attempt. Previous attempts are linked via `tenant.calls.retry_of` (FK to prior call_id). The `campaign_target_id` stays the same across retries — it tracks the contact, not the call.

**call_state vs outcome semantics:** `tenant.calls.state` tracks lifecycle (pending → initiating → ringing → in_progress → completed/failed). `tenant.calls.outcome` records the reason for the terminal state (completed, no_answer, busy, voicemail, error, cancelled, transferred). A call can be `state=completed` with `outcome=no_answer`. These are orthogonal: state = "where is it now?", outcome = "what happened?". `outcome` is only written once, when the call reaches a terminal state.

### 2.1 Outcome Source of Truth

Call outcomes originate from LiveKit's `DisconnectReason` enum, exposed via `participant.disconnect_reason` in the Python SDK. The voice worker's entrypoint (`entrypoint.py`) maps these to `CallOutcome` values before including them in the `CallCompletedSignal`.

**LiveKit → CallOutcome mapping:**

| LiveKit DisconnectReason | SIP Context | CallOutcome | Retryable? |
|--------------------------|-------------|-------------|:----------:|
| `USER_UNAVAILABLE` (11) | SIP 480 — callee did not respond | `no_answer` | Yes |
| `CONNECTION_TIMEOUT` (14) | Ringing timeout — no SIP response | `no_answer` | Yes |
| `USER_REJECTED` (12) | SIP 486 — busy | `busy` | Yes |
| `CLIENT_INITIATED` (1) | Normal BYE after active call | `completed` | No |
| `CLIENT_INITIATED` (1) | BYE before agent speaks (< 5s) | `caller_hangup` | No |
| `SIP_TRUNK_FAILURE` (13) | SIP protocol error | `error` | No |
| `UNKNOWN_REASON` (0) | Catch-all | `error` | No |
| *(not SIP-detectable)* | Voicemail system answers (200 OK) | `voicemail` | Yes |
| *(campaign-initiated)* | Campaign cancel signal | `cancelled` | No |
| *(agent-initiated)* | Agent transfers call | `transferred` | No |

**Voicemail detection:** LiveKit SIP does not distinguish voicemail from a live answer (both are SIP 200 OK). For MVP, voicemail detection is deferred — calls answered by voicemail will be classified as `completed` with short `call_duration_ms`. Post-MVP, audio heuristics (silence detection, greeting pattern) or carrier-specific SIP headers can be added. Document as tech debt.

**Mapping location:** The `DisconnectReason → CallOutcome` mapping function lives in `packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py`. It is a pure function (~20 lines) that the shutdown callback calls before constructing `CallCompletedSignal`. The `caller_hangup` vs `completed` distinction for `CLIENT_INITIATED` uses call duration: < 5 seconds of active conversation → `caller_hangup`.

**`sip.callStatus` participant attribute:** LiveKit SIP participants expose a `sip.callStatus` attribute that transitions through `dialing → ringing → active → hangup`. The voice worker can observe these transitions via the `participant_attributes_changed` event to track call lifecycle (e.g., detect ringing phase for ring timeout). This is the source for `call_state` lifecycle tracking, distinct from `DisconnectReason` which determines the terminal `outcome`.

---

## 3. Prerequisite-to-Phase Mapping

The design doc identifies 6 M8/M20 prerequisites (Section 6). Each is assigned to a specific phase:

| # | Prerequisite (Design Doc) | Status | Phase | Notes |
|---|--------------------------|--------|-------|-------|
| 1 | `VoiceCallWorkflow` not registered in `worker.py` | **CLOSED (PR #44)** | — | Registered in `create_platform_worker()` at `apps/temporal-worker/src/temporal_worker/worker.py` |
| 2 | `VoiceActivities` not registered (pre_call, post_call are stubs with no DI) | **Partially closed (PR #44)** | Phase 0 | Activities registered in platform worker. `post_call_activity` still a logging stub — needs `grove_post_call_activity` implementation. |
| 3 | `signal_call_completed` exists at `apps/agent-worker/` but has zero callers from entrypoint | **OPEN** | Phase 0 | Wire into `entrypoint.py` with outcome mapping (Section 2.1) |
| 4 | `post_call_activity` is a logging stub, no persistence | **OPEN** | Phase 0 | Replace with `grove_post_call_activity` |
| 5 | `initiate_call_activity` called by VoiceCallWorkflow but not implemented as Temporal activity | **CLOSED (PR #44)** | — | Implemented in `VoicePlatformActivities` with LiveKit SIP API. Uses typed `InitiateCallInput`/`InitiateCallResult`. |
| 6 | WorkflowEngine has no Temporal activity wrapper | **OPEN** | Phase 5 | Implement `execute_post_call_workflows` |

**ConversationStore API gap:** `ConversationStore` (at `packages/grove/src/grove/core/conversations.py`) has no method to update `call_duration_ms` or `call_outcome` on an existing chat. Only `update_chat_status`, `update_chat_title`, `update_action_binding` exist. Phase 0 must add `update_call_metadata(chat_id, *, call_duration_ms, call_outcome)` to both the ABC and the Postgres implementation at `packages/grove/src/grove/backends/postgres/conversation_store.py`. This is a generic need — any voice application finishing a call needs to record these fields.

**Signal payload gap:** `CallCompletedSignal` currently has `conversation_id`, `duration_ms`, `outcome`. Phase 0 extends it with `messages` and metadata fields needed by `find_or_create_by_external_id`: the full signature requires `external_id_type`, `external_id`, `organization_id`, `user_id`, `agent_name`, `title`. The `entrypoint.py` already has access to room metadata containing `org_id`, `user_id`, `conversation_id`, and the agent config's `name` field — these must be included in the signal payload.

---

## 4. Phase Plan

### (Deferred) Prefixed Object IDs — Separate Epic

Previously "Phase P." Removed from the M10 critical path.

**Why removed:**
- Massive blast radius (11 tables, 30+ files, 2 migrations, 20+ SQL casts) that blocks all M10 delivery
- The initial tenant schema migration does not contain several tables Phase P assumed existed (`agent_configs`, `call_events`, `call_extractions`) — the plan was written against an imaginary future DB
- M10 demo does not require changing PK formats to prove outbound orchestration, retries, extraction, and workflow triggers
- Prefixed IDs are a code-style improvement, not a functional requirement

**Tracked in:** Section 12 (Known Tech Debt) as a separate epic with its own plan.

---

### Phase 0: Close M8 Gaps + Voice Message Persistence

**Objective:** Close remaining M8 runtime gaps for voice message persistence and signal wiring. PR #44 already registered VoiceCallWorkflow and implemented `initiate_call_activity` in the platform worker. This phase implements: (1) message collection in GroveVoiceAgent, (2) `CallCompletedSignal` firing from entrypoint with outcome mapping, (3) `grove_post_call_activity` for message persistence, (4) `update_call_metadata` on ConversationStore. Registration in the platform worker is already done.

**Input:**
- Design doc: Section 5.1 (Component Architecture — grove-voice-livekit changes), Section 6 (Prerequisites), Appendix C Phase 0
- Feature spec: Scope item 1 (Voice message persistence in GroveVoiceAgent)
- Source files to read:
  - `packages/grove-voice-livekit/src/grove_voice_livekit/grove_voice_agent.py` — GroveVoiceAgent, llm_node method
  - `packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py` — voice worker entrypoint (does NOT call signal_call_completed today)
  - `packages/grove/src/grove/temporal/voice_call_workflow.py` — VoiceCallWorkflow, CallCompletedSignal dataclass
  - `packages/grove/src/grove/temporal/voice_activities.py` — VoiceActivities (stub pre_call_activity, stub post_call_activity, NO GroveActivityContext DI)
  - `packages/grove/src/grove/temporal/worker.py` — create_grove_worker (registers only ConversationWorkflow, InvokeWorkflow — NOT VoiceCallWorkflow, NOT VoiceActivities)
  - `packages/grove/src/grove/core/conversations.py` — ConversationStore ABC: `add_message` (singular, NOT add_messages), `find_or_create_by_external_id(*, external_id_type, external_id, organization_id, user_id, agent_name, title, metadata=None)`, NO update_call_metadata method
  - `packages/grove/src/grove/backends/postgres/conversation_store.py` — Postgres ConversationStore implementation
  - `apps/agent-worker/src/agent_worker/temporal_signal.py` — `signal_call_completed` helper (zero callers from entrypoint)

**Deliverables:**
- `packages/grove-voice-livekit/src/grove_voice_livekit/grove_voice_agent.py` — MODIFY: add `_collected_messages: list[dict[str, str]]` field, append `{"role": role, "content": content}` per turn in `llm_node`, expose `collected_messages` property. Cap at 500 messages to stay under Temporal's 2MB signal payload limit (excess dropped from front, keeping most recent).
- `packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py` — MODIFY: after call ends, inline the signal_call_completed logic directly (~15 lines: create Temporal client, get workflow handle by `voice-call-{conversation_id}`, send `CallCompletedSignal`). Do NOT import from `apps/agent-worker/` — framework packages must never import platform app code. Use LiveKit AgentSession shutdown callback (`session.on("close")` or `ctx.add_shutdown_callback()`) to detect call end and fire the signal. Include `agent.collected_messages` in signal payload, plus room metadata fields (`org_id`, `user_id`, agent config `name`) needed downstream by `find_or_create_by_external_id`. Add `_map_disconnect_reason(reason: DisconnectReason, call_duration_ms: int) -> CallOutcome` function implementing the mapping from Section 2.1. Import `DisconnectReason` from `livekit.protocol.models`. For `CLIENT_INITIATED`, use `call_duration_ms < 5000` to distinguish `caller_hangup` from `completed`.
- `packages/grove/src/grove/temporal/voice_call_workflow.py` — MODIFY: extend `CallCompletedSignal` dataclass with `messages: list[dict[str, str]] = field(default_factory=list)`, `organization_id: str = ""`, `user_id: str = ""`, `agent_name: str = ""` (backward compatible defaults). Also fix stale inline comment at line 95 — currently says "activity registered in apps/agent-worker" but PR #44 moved registration to `apps/temporal-worker/`. Update to match reality.
- `packages/grove/src/grove/core/conversations.py` — MODIFY: add abstract method `update_call_metadata(self, chat_id: str, *, call_duration_ms: int | None = None, call_outcome: CallOutcome | None = None) -> None` to `ConversationStore` ABC. Also add abstract method `add_messages(self, chat_id: str, messages: list[AddMessageInput]) -> None` for idempotent batch message insertion. Each message gets a deterministic ID: `uuid5(NAMESPACE_URL, f"{chat_id}:{sequence_index}")` where `sequence_index` is the message's position in the list. INSERT uses `ON CONFLICT (id) DO NOTHING` — zero duplicates on any number of Temporal activity replays.
- `packages/grove/src/grove/backends/postgres/conversation_store.py` — MODIFY: implement `update_call_metadata` — raw SQL `UPDATE grove.chats SET call_duration_ms = $1, call_outcome = $2, updated_at = now() WHERE id = $3`. Also implement `add_messages` — single-transaction multi-row INSERT with idempotency: `INSERT INTO grove.messages (id, chat_id, role, content, agent_name, created_at) VALUES ($1, $2, $3, $4, $5, now()), ... ON CONFLICT (id) DO NOTHING` using multi-value INSERT within `async with conn.transaction()`. Deterministic IDs (`uuid5(NAMESPACE_URL, f"{chat_id}:{index}")`) ensure Temporal activity replays produce zero duplicates regardless of crash timing — even if the transaction committed but the ack to Temporal was lost.
- `packages/grove/src/grove/temporal/voice_activities.py` — MODIFY: inject `GroveActivityContext` (matching `GroveActivities` pattern from `activities.py`). Replace `post_call_activity` stub with `grove_post_call_activity` that:
  1. Calls `conversation_store.find_or_create_by_external_id(external_id_type="conversation", external_id=signal.conversation_id, organization_id=signal.organization_id, user_id=signal.user_id, agent_name=signal.agent_name, title=f"Voice call {signal.conversation_id[:8]}")`
  2. Calls `conversation_store.add_messages(chat_id=chat.id, messages=[AddMessageInput(role=msg["role"], content=msg["content"], agent_name=signal.agent_name) for msg in signal.messages])` — single atomic batch insert, no duplicates on activity retry
  3. Calls `conversation_store.update_call_metadata(chat.id, call_duration_ms=signal.duration_ms, call_outcome=signal.outcome)`
- `packages/grove/src/grove/temporal/voice_call_workflow.py` — MODIFY: in `VoiceCallWorkflow.run()`, replace the single `execute_activity("post_call_activity", ...)` call with `execute_activity("grove_post_call_activity", ...)`. **VoiceCallWorkflow MUST NOT call any platform-specific activities** — Grove independence rule. Platform post-call processing (`platform_post_call_activity`, `extract_call_data`) runs from `OutboundCallWithRetryWorkflow` (Phase 3) after the child `VoiceCallWorkflow` completes and returns its result. Create `GrovePostCallInput` dataclass extending the existing `PostCallInput` with additional fields: `messages: list[dict[str, str]] = field(default_factory=list)`, `organization_id: str = ""`, `user_id: str = ""`, `agent_name: str = ""`. Construct input from `CallCompletedSignal` fields. The workflow returns a `VoiceCallResult` dataclass (conversation_id, duration_ms, outcome, messages) so the parent workflow can pass data downstream without cross-schema DB reads.
- `packages/grove/src/grove/temporal/worker.py` — NO CHANGE. `VoiceCallWorkflow` and `VoiceActivities` are NOT registered in `create_grove_worker()` (per CLAUDE.md: "VoiceCallWorkflow is NOT in create_grove_worker()"). Registration already done in platform worker (`apps/temporal-worker/src/temporal_worker/worker.py` via PR #44's `create_platform_worker()`).

**Tests:**
- `packages/grove-voice-livekit/tests/test_message_collection.py` — NEW, 5 tests:
  1. Messages collected per turn with correct role/content
  2. Empty messages list when no turns executed
  3. Multiple turns accumulate correctly
  4. Messages capped at 500 (excess dropped from front)
  5. Backward compat: GroveVoiceAgent works without message collection enabled
- `packages/grove-voice-livekit/tests/test_outcome_mapping.py` — NEW, 8 tests:
  1. USER_UNAVAILABLE maps to no_answer
  2. CONNECTION_TIMEOUT maps to no_answer
  3. USER_REJECTED maps to busy
  4. CLIENT_INITIATED with call_duration_ms=6000 maps to completed
  5. CLIENT_INITIATED with call_duration_ms=4999 maps to caller_hangup
  6. CLIENT_INITIATED with call_duration_ms=5000 maps to completed (boundary: >= 5000 is completed)
  7. SIP_TRUNK_FAILURE maps to error
  8. UNKNOWN_REASON maps to error
- `packages/grove/tests/unit/temporal/test_voice_message_persistence.py` — NEW, 5 tests:
  1. grove_post_call_activity creates chat via find_or_create_by_external_id with all required params (external_id_type, organization_id, user_id, agent_name, title)
  2. grove_post_call_activity persists messages via add_messages (single batch call with all messages)
  3. Handles empty messages list gracefully (no add_message calls)
  4. Calls update_call_metadata with call_duration_ms and call_outcome
  5. Idempotent on replay: add_messages with deterministic IDs + ON CONFLICT DO NOTHING — calling twice with same chat_id and messages produces zero duplicate rows
- `packages/grove/tests/unit/core/test_conversations.py` — MODIFY (add to existing file), 4 tests:
  1. update_call_metadata updates call_duration_ms and call_outcome on existing chat
  2. update_call_metadata with None values leaves fields unchanged
  3. add_messages inserts all messages atomically in single call
  4. add_messages with empty list is a no-op (no DB call)
- `packages/grove/tests/unit/temporal/test_voice_activities.py` — MODIFY (update existing file): update all 5 existing test cases that instantiate `VoiceActivities()` with no args to pass a mock `GroveActivityContext`. Tests currently at lines 17, 28, 39 will break without this change.

**Verification gate:**
```bash
uv run pyright packages/grove-voice-livekit/src/ packages/grove/src/grove/temporal/ packages/grove/src/grove/core/ packages/grove/src/grove/backends/
uv run pytest packages/grove-voice-livekit/tests/test_message_collection.py packages/grove-voice-livekit/tests/test_outcome_mapping.py packages/grove/tests/unit/temporal/test_voice_message_persistence.py packages/grove/tests/unit/core/test_conversations.py --tb=short -q  # Expected: 22 passed
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short  # Import boundaries unchanged
```

**Context budget:** ~50K tokens (source: 25K, spec: 10K, deps: 8K, overhead: 7K)

**Depends on:** none

**Can run in parallel with:** Phase 1

**Merge ordering note:** Phase 0 and Phase 1 may merge independently, but Phase 1's CHECK constraint migration MUST run before any call produces `busy`, `voicemail`, `cancelled`, or `transferred` outcomes. Deploy Phase 1 migration first in production.

---

### Phase 1: Database Schema + CallOutcome Extension

**Objective:** Extend `CallOutcome` Literal type with 4 new values. Create campaigns, campaign_targets tables and enum lookup tables in tenant schema. Add outcome/campaign/incident columns to tenant.calls. Update grove.chats CHECK constraint.

**Input:**
- Design doc: Section 5.2 (Data Models — full SQL schema for all tables)
- Feature spec: Architecture Components table (DATA-10, DATA-NEW)
- Source files to read:
  - `packages/grove/src/grove/core/voice.py` — current CallOutcome Literal type
  - `packages/grove/src/grove/alembic/versions/` — existing Grove migrations (pattern reference)
  - `packages/platform-core/src/platform_core/alembic/versions/` — existing tenant migrations (enum-as-table convention)

**Deliverables:**
- `packages/grove/src/grove/core/voice.py` — MODIFY: `CallOutcome = Literal["completed", "no_answer", "busy", "voicemail", "error", "caller_hangup", "cancelled", "transferred"]`
- `packages/grove/src/grove/alembic/versions/20260218_update_call_outcome_check.py` — NEW: DROP + RECREATE CHECK constraint on `grove.chats.call_outcome` with expanded values
- `packages/platform-core/src/platform_core/alembic/versions/20260218_add_campaign_tables.py` — NEW: `campaign_status` enum table, `call_outcome` enum table, `campaigns` table, `campaign_targets` table
- `packages/platform-core/src/platform_core/alembic/versions/20260218_cleanup_call_state_values.py` — NEW: Remove outcome values from `call_state` enum table. DELETE `no_answer`, `cancelled`, `failed` from `call_state`. Data migration: `UPDATE calls SET state = 'completed' WHERE state IN ('no_answer', 'cancelled', 'failed')`. Downgrade re-inserts removed values. This separates lifecycle states (pending, ringing, in_progress, completed) from terminal outcomes (which move to the new `outcome` column).
- `packages/platform-core/src/platform_core/alembic/versions/20260218_add_call_columns.py` — NEW: ALTER `calls` ADD COLUMN outcome (TEXT REFERENCES call_outcome(value)), campaign_id, campaign_target_id, incident_id, retry_of, chat_id + indexes. Backfill: `UPDATE calls SET outcome = 'completed' WHERE state = 'completed' AND outcome IS NULL`.

**Tests:**
- `packages/grove/tests/unit/core/test_voice.py` — MODIFY (add to existing file), 3 tests:
  1. CallOutcome includes all 8 values
  2. Existing values (completed, no_answer, error, caller_hangup) still valid
  3. New values (busy, voicemail, cancelled, transferred) accepted
- `packages/grove/tests/unit/core/test_voice.py` — MODIFY (update existing file): update `test_literal_values` assertion from `len(values) == 4` to `len(values) == 8` to account for new CallOutcome values.
- `packages/platform-core/tests/unit/test_call_state_cleanup.py` — NEW, 3 tests:
  1. call_state table contains only lifecycle values after migration (pending, ringing, in_progress, completed)
  2. Data migration: rows with state='no_answer' migrated to state='completed'
  3. Downgrade restores removed call_state values

**Verification gate:**
```bash
uv run pyright packages/grove/src/grove/core/voice.py
uv run pytest packages/grove/tests/unit/core/test_voice.py --tb=short -q
uv run pytest packages/platform-core/tests/unit/test_call_state_cleanup.py --tb=short -q
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short
```

**Context budget:** ~25K tokens (source: 8K, spec: 10K, deps: 3K, overhead: 4K)

**Depends on:** none

**Can run in parallel with:** Phase 0

---

### Phase 2: Temporal Worker Bootstrap + Data Models + Call Initiation

**Objective:** Extend the existing `apps/temporal-worker/` package (PR #44 added `worker.py` with `create_platform_worker()`, `voice_activities.py` with `VoicePlatformActivities`, and `__main__.py`) with campaign data models and campaign workflow/activity registration. The platform worker already registers `VoiceCallWorkflow` and voice activities — this phase adds campaign-specific workflows and activities alongside them.

**Input:**
- Design doc: Section 5.1 (apps/temporal-worker/ tree), Section 5.2 (Python dataclasses), Section 6 Prerequisites (initiate_call_activity gap)
- Source files to read:
  - `packages/grove/src/grove/temporal/worker.py` — existing Grove worker pattern (create_grove_worker)
  - `packages/grove/src/grove/temporal/voice_call_workflow.py` — VoiceCallWorkflow (Phase 0 modifies it; Phase 2 registers it in platform worker)
  - `packages/grove/src/grove/core/voice.py` — CallOutcome type, CallInitiator ABC (Phase 1 output)
  - `apps/agent-worker/src/agent_worker/call_initiator.py` — existing call initiation code (reference for LiveKit CreateSIPParticipant pattern)
  - Root `pyproject.toml` — UV workspace members pattern

**Deliverables:**
- `apps/temporal-worker/pyproject.toml` — MODIFY: add dependencies (grove, temporalio, asyncpg, pydantic)
- `apps/temporal-worker/src/temporal_worker/__init__.py` — EXISTS (no change)
- `apps/temporal-worker/src/temporal_worker/worker.py` — MODIFY (exists from PR #44): extend `create_platform_worker()` to additionally register campaign workflows (`OutboundCampaignWorkflow`, `OutboundCallWithRetryWorkflow`) and campaign activities (`create_campaign_record`, `finalize_campaign`, `update_campaign_target`, `extract_call_data`, `platform_post_call_activity`). The worker already registers `VoiceCallWorkflow` and voice activities.
- `apps/temporal-worker/src/temporal_worker/models.py` — NEW: `ContactRecord`, `CallRetryConfig`, `CampaignWorkflowInput`, `CampaignStatus`, `CampaignProgress`, `CampaignResult`, `OutboundCallInput`, `CallResult`, `RETRYABLE_OUTCOMES`. All workflow I/O types are `@dataclass` (NOT Pydantic — Temporal sandbox restriction). Additionally, `CampaignWorkflowInput` includes: `start_index: int = 0` and `initial_progress: CampaignProgress = field(default_factory=CampaignProgress)` for `continue_as_new` cursor (Phase 4), `paused: bool = False` to preserve pause state across `continue_as_new`, and `continue_as_new_threshold: int = 50` (50 contacts × ~15 history events = ~750 events, well within Temporal's 50K event limit). Also define activity name constants: `ACTIVITY_EXTRACT_CALL_DATA = "extract_call_data"`, `ACTIVITY_PLATFORM_POST_CALL = "platform_post_call_activity"`, `ACTIVITY_EXECUTE_WORKFLOWS = "execute_post_call_workflows"` — imported by Phase 3 and Phase 5 to prevent string name typos. `ContactRecord` includes `metadata: dict[str, Any] = field(default_factory=dict)` for domain-specific context (driver name, route, shift hours for Plaktukai). This metadata flows through the workflow chain: `CampaignWorkflowInput.contacts[i].metadata` → `OutboundCallInput.contact_metadata` → room metadata `contact_context` key (set by `initiate_call_activity` via `create_room`) → voice entrypoint reads `ctx.room.metadata` → injected into agent system prompt via `additional_instructions`. This is the pre-call context mechanism — no separate pre-call activity needed for MVP.

**Contact context injection (verified against codebase):** The `{contact_context}` template variable approach does NOT work — Grove's prompt builder uses simple `.replace()` for specific keys only (`{taskName}`, `{outputSchema}`), not arbitrary per-call variables. The actual mechanism uses the existing `additional_instructions` field:

1. `ContactRecord.metadata` flows through: `CampaignWorkflowInput.contacts[i].metadata` → `OutboundCallInput.contact_metadata` → room metadata `contact_context` key (set by `initiate_call_activity` via `create_room`)
2. Voice entrypoint (`entrypoint.py`) reads `contact_context` from `ctx.room.metadata` and passes it to `GroveVoiceAgent` constructor
3. `GroveVoiceAgent.llm_node()` sets `ExecutorStreamInput.additional_instructions` with the rendered contact context string
4. `Executor.prepare_execution()` reads `additional_instructions` → passes to `build_system_prompt()` → appended to mission in system prompt → sent to LLM

Changes required (grove-voice-livekit only, NO Grove core changes):
- `entrypoint.py`: Extract `contact_context` from room metadata, pass to `GroveVoiceAgent` constructor as new parameter
- `grove_voice_agent.py`: Store contact context, render as string, set on `ExecutorStreamInput.additional_instructions` in `llm_node()`

The infrastructure (`ExecutorInput.additional_instructions` → `Executor.prepare_execution()` → `build_system_prompt()`) already exists and is wired end-to-end. Only the voice-layer last-mile connection is missing.
- `apps/temporal-worker/src/temporal_worker/workflows/__init__.py` — NEW
- `apps/temporal-worker/src/temporal_worker/activities/__init__.py` — NEW
- `apps/temporal-worker/src/temporal_worker/activities/call_initiation.py` — NOT NEEDED. `initiate_call_activity` already implemented in `voice_activities.py` by PR #44 as `VoicePlatformActivities.initiate_call`. Uses typed `InitiateCallInput`/`InitiateCallResult`.
- `apps/temporal-worker/src/temporal_worker/activities/call_initiation.py` — MODIFY (or in `voice_activities.py`): ensure `initiate_call_activity` creates the room with metadata BEFORE dialing. **Currently missing in PR #44** — the existing `call_initiator.py` does NOT set room metadata.

**Room metadata (CRITICAL — verified against LiveKit API):** `CreateSIPParticipantRequest` does NOT accept room-level metadata. It only supports `participant_metadata` and `participant_attributes` (participant-scoped). The voice entrypoint reads **room** metadata (`ctx.room.metadata`) for `config_path`, `organization_id`, `user_id`, and `conversation_id`. Therefore, `initiate_call_activity` MUST use a two-step pattern:

1. `await lk.room.create_room(CreateRoomRequest(name=room_name, metadata=json.dumps({...})))` — creates room with metadata BEFORE any participant joins
2. `await lk.sip.create_sip_participant(CreateSIPParticipantRequest(room_name=room_name, ...))` — dials SIP participant into the pre-created room

Required room metadata keys: `config_path`, `organization_id`, `user_id`, `conversation_id`, `campaign_id`, `contact_id`, `contact_context` (serialized contact metadata for agent prompt injection).

**Environment variable fix:** The agent-worker Dockerfile sets `GROVE_AGENT_CONFIG_PATH` (`apps/agent-worker/Dockerfile:14`) but the voice entrypoint reads `GROVE_CONFIG_PATH` (`entrypoint.py:177`). These must be aligned to `GROVE_CONFIG_PATH`.

**Call lifecycle state transitions:** Each state transition must have a clear owner. The `tenant.calls` table has a `state` column tracking lifecycle position.

| State | Written by | When |
|-------|-----------|------|
| `pending` | `create_call_record` activity | Call record created, before dialing |
| `initiating` | `initiate_call_activity` | SIP dial started (after room creation, before `create_sip_participant` returns) |
| `in_progress` | `initiate_call_activity` | `create_sip_participant` returns successfully (`wait_until_answered=True` means it blocks until answer) |
| `completed` | `platform_post_call_activity` (Phase 5) | Terminal state after VoiceCallWorkflow returns |
| `failed` | `OutboundCallWithRetryWorkflow` error handler | SIP dial failed, timeout, or activity error |

Note: `ringing` state is not trackable in MVP — `create_sip_participant` with `wait_until_answered=True` blocks until answer or failure. Intermediate SIP states (`100 Trying`, `180 Ringing`) are not surfaced by the LiveKit SDK. Deferred to post-MVP if real-time call status dashboard is needed.

- `apps/temporal-worker/tests/__init__.py` — NEW
- `apps/temporal-worker/tests/unit/__init__.py` — NEW
- `apps/temporal-worker/tests/unit/test_models.py` — NEW
- `apps/temporal-worker/tests/unit/test_call_initiation.py` — NOT NEEDED (covered by PR #44 wiring tests).

**Tests:**
- `apps/temporal-worker/tests/unit/test_models.py` — 8 tests:
  1. CampaignWorkflowInput defaults (max_concurrent_calls=1, inter_call_delay_seconds=5)
  2. CallRetryConfig defaults (no_answer=60, busy=30, voicemail=120, max_attempts=3)
  3. ContactRecord required fields validation
  4. RETRYABLE_OUTCOMES = {"no_answer", "busy", "voicemail"}
  5. CampaignStatus literal values match design doc
  6. CampaignProgress defaults to zeros
  7. CallResult optional fields (extraction=None, conversation_id=None)
  8. OutboundCallInput constructed from CampaignWorkflowInput + ContactRecord
- `apps/temporal-worker/tests/unit/test_worker_registration.py` — NEW, 2 tests:
  1. VoiceCallWorkflow is registered in platform worker
  2. VoiceActivities (grove_post_call_activity, pre_call_activity) are registered in platform worker

**Verification gate:**
```bash
uv run pyright apps/temporal-worker/src/
uv run pytest apps/temporal-worker/tests/unit/ --tb=short -q  # Expected: 10 passed
```

**Context budget:** ~35K tokens (source: 12K, spec: 10K, deps: 8K, overhead: 5K)

**Depends on:** Phase 1 (CallOutcome extension)

**Can run in parallel with:** none — sequential after Phase 1

---

### Phase 3: OutboundCallWithRetryWorkflow

**Objective:** Implement retry wrapper workflow around VoiceCallWorkflow. Per-outcome delay logic, max attempts tracking, terminal outcome handling. Generates a new `conversation_id` per retry attempt to avoid Temporal workflow ID collisions (see Section 2: Identifiers & Invariants).

**Input:**
- Design doc: Appendix C Phase 3, Section 5.5 (Error Handling — child workflow failures)
- Appendix B: Steps 3 and 7 (call with retry + retry or complete)
- Source files to read:
  - `apps/temporal-worker/src/temporal_worker/models.py` (Phase 2) — OutboundCallInput, CallResult, RETRYABLE_OUTCOMES
  - `packages/grove/src/grove/temporal/voice_call_workflow.py` — VoiceCallWorkflow interface (execute_child_workflow target)

**Deliverables:**
- `apps/temporal-worker/src/temporal_worker/workflows/call_with_retry.py` — NEW: `OutboundCallWithRetryWorkflow`
  - `run(input: OutboundCallInput) -> CallResult`
  - Per-attempt: generate new `conversation_id = str(uuid4())`, use as child workflow ID `voice-call-{conversation_id}`
  - Activity: update_campaign_target (status='calling', attempt_count++)
  - Child: VoiceCallWorkflow with per-attempt conversation_id
  - Retryable (no_answer/busy/voicemail): calculate delay from retry_config, workflow.sleep(delay), loop
  - Terminal (completed/caller_hangup/error/cancelled/transferred) or max_attempts: return CallResult
  - Links retries: `tenant.calls.retry_of` points to previous attempt's call_id
  - Workflow ID: `campaign-{campaign_id}/contact-{contact_id}`

**retry_of data flow (CRITICAL):** Each retry attempt needs the previous attempt's `call_id` to set `tenant.calls.retry_of` FK. The data flow is:

1. `OutboundCallWithRetryWorkflow` calls `create_call_record` activity -> returns `call_id` (UUIDv4)
2. Workflow stores `current_call_id` in local state
3. Workflow starts child `VoiceCallWorkflow` (does NOT need `call_id` — it works with `conversation_id`)
4. On retry: previous `current_call_id` becomes `retry_of` for the next `create_call_record` call
5. `VoiceCallResult` does NOT need a `call_id` field — the parent workflow already captured it from step 1

This means `create_call_record` (a new platform activity) must exist in Phase 2 and return the generated `call_id`. The `InitiateCallResult` from `initiate_call_activity` is separate — it confirms the SIP dial succeeded, not the DB record creation.
  - Passes `input.contact_metadata` through to `VoiceCallWorkflow` child via room metadata. The voice entrypoint reads this from `ctx.room.metadata` and injects it into the agent's system prompt, giving the agent pre-call context about who it's calling (driver name, expected location, verification purpose).
- `apps/temporal-worker/src/temporal_worker/activities/target.py` — NEW: `update_campaign_target` activity
- **Post-call activity chain:** After `VoiceCallWorkflow` child completes and returns `VoiceCallResult`, `OutboundCallWithRetryWorkflow` calls: (1) `platform_post_call_activity` (Phase 5 activity, by string name — writes to tenant.calls; fast, idempotent), (2) `extract_call_data` (Phase 5 activity, by string name — LLM extraction, skipped if outcome is not `completed`), (3) `execute_post_call_workflows` (Phase 5 activity, by string name — M20 WorkflowEngine triggers). Order rationale: DB write first ensures call is recorded even if extraction fails. These activities are referenced by string name constants from `models.py` (Phase 2). These run ONLY from the retry workflow, NOT from `VoiceCallWorkflow` (Grove independence).
- `apps/temporal-worker/tests/unit/test_call_with_retry.py` — NEW

**Tests:**
- `apps/temporal-worker/tests/unit/test_call_with_retry.py` — 10 tests:
  1. Retry on no_answer: sleeps 60min, retries
  2. Retry on busy: sleeps 30min, retries
  3. Retry on voicemail: sleeps 120min, retries
  4. No retry on completed (terminal)
  5. No retry on cancelled (terminal)
  6. No retry on transferred (terminal)
  7. No retry on error (terminal)
  8. Max attempts exhausted after 3 attempts
  9. Each attempt gets a new conversation_id (no Temporal workflow ID collision)
  10. Successful first attempt: returns CallResult with attempts=1

**Verification gate:**
```bash
uv run pyright apps/temporal-worker/src/
uv run pytest apps/temporal-worker/tests/unit/test_call_with_retry.py --tb=short -q  # Expected: 10 passed
```

**Context budget:** ~30K tokens

**Depends on:** Phase 2

**Can run in parallel with:** Phase 5 (different files), Phase 6 (different files)

---

### Phase 4: OutboundCampaignWorkflow

**Objective:** Batch orchestration: sequential fan-out over contacts, pause/resume/cancel signals, progress queries, continue_as_new for history management.

**Input:**
- Design doc: Appendix C Phase 4, Section 5.3 (API Surface), Section 5.5 (auto-pause on >50% failure)
- Appendix B: Steps 2 and 8 (campaign orchestration + completion)
- Source files to read:
  - `apps/temporal-worker/src/temporal_worker/models.py` (Phase 2) — CampaignWorkflowInput, CampaignProgress, CampaignResult
  - `apps/temporal-worker/src/temporal_worker/workflows/call_with_retry.py` (Phase 3) — OutboundCallWithRetryWorkflow

**Deliverables:**
- `apps/temporal-worker/src/temporal_worker/workflows/campaign.py` — NEW: `OutboundCampaignWorkflow`
  - `run(input: CampaignWorkflowInput) -> CampaignResult`
  - Activity: create_campaign_record at start
  - Sequential for-loop, inter_call_delay_seconds sleep between contacts
  - Pause: wait_condition(not _paused) before each contact
  - Cancel: break loop, finalize with status=cancelled
  - Child: OutboundCallWithRetryWorkflow per contact
  - Auto-pause on >50% failure rate (configurable threshold)
  - continue_as_new after N contacts: save progress to DB via activity, continue_as_new with cursor (last processed index), resume from checkpoint. Signal handlers re-register automatically in new execution.
  - **continue_as_new invariant:** MUST trigger ONLY between contacts (after `ChildWorkflowHandle.result()` returns, before next child starts). Never trigger while a child workflow is in flight — `continue_as_new` does NOT cancel children, but the parent loses its handle, making the child's result unobservable.
  - `CampaignWorkflowInput` includes `paused: bool = False` to preserve pause state across `continue_as_new`. Before calling `continue_as_new`, the workflow awaits `workflow.wait_condition(workflow.all_handlers_finished)` to prevent signal loss during the transition window.
  - Signals: pause(), resume(), cancel_campaign()
  - Queries: get_progress() -> CampaignProgress, get_status() -> CampaignStatus
  - Activity: finalize_campaign after loop
  - Workflow ID: `campaign-{campaign_id}`
- `apps/temporal-worker/src/temporal_worker/activities/campaign.py` — NEW: create_campaign_record, finalize_campaign
- `apps/temporal-worker/tests/unit/test_campaign_workflow.py` — NEW

**Tests:**
- `apps/temporal-worker/tests/unit/test_campaign_workflow.py` — 16 tests:
  1. Sequential fan-out: 3 contacts processed in order
  2. Pause signal stops dispatching new calls
  3. Resume continues after pause
  4. Cancel terminates, remaining contacts skipped
  5. Progress query: correct counts (total, completed, failed, remaining)
  6. Status query: reflects state transitions
  7. Inter-call delay: sleep between contacts
  8. create_campaign_record called at start with correct campaign data
  9. finalize_campaign called at end with correct status
  10. Auto-pause on >50% failure rate
  11. Empty contacts: completes immediately with status=completed
  12. continue_as_new triggers after N contacts
  13. continue_as_new: resume from cursor, no skip/duplicate contacts
  14. continue_as_new: progress counters survive continuation
  15. continue_as_new: signals work after continuation (pause/resume in new execution)
  16. continue_as_new: campaign completes after final continuation batch

**Verification gate:**
```bash
uv run pyright apps/temporal-worker/src/
uv run pytest apps/temporal-worker/tests/unit/test_campaign_workflow.py --tb=short -q  # Expected: 16 passed
```

**Context budget:** ~40K tokens

**Depends on:** Phase 3

**Can run in parallel with:** none — sequential after Phase 3 (campaign depends on retry wrapper)

---

### Phase 5: Post-Call Processing

**Objective:** Post-call activity chain: extract_call_data (LLM extraction from transcript), execute_post_call_workflows (M20 WorkflowEngine wiring — prerequisite #6), platform_post_call_activity (tenant DB writes).

**Input:**
- Design doc: Appendix C Phase 5, Decision D7 (direct WorkflowEngine.execute())
- Appendix B: Steps 6-7 (post-call processing + retry-or-complete)
- Source files to read:
  - `packages/grove/src/grove/temporal/voice_activities.py` (Phase 0 output — grove_post_call_activity)
  - `packages/grove/src/grove/runtime/workflow_engine.py` — WorkflowEngine class
  - `packages/grove/src/grove/actions/__init__.py` — get_builtin_actions() returns 5 built-in actions
  - `packages/grove/src/grove/config/loader.py` — load_agent_config()
  - `packages/grove/src/grove/config/schema.py` — AgentConfig, WorkflowConfig

**Deliverables:**
- `packages/grove/src/grove/temporal/workflow_activities.py` — NEW: `execute_post_call_workflows` activity
  - Calls `WorkflowEngine.create_with_builtins()` — a NEW factory classmethod added to `packages/grove/src/grove/runtime/workflow_engine.py` in this phase. The factory imports `get_builtin_actions()` from `actions/__init__.py` (allowed: `runtime/` → `actions/`), constructs `WorkflowEngine(actions=get_builtin_actions())` and returns it. This avoids `temporal/` → `actions/` import boundary violation (`temporal/` → `runtime/` is allowed).
  - Loads agent config via `load_agent_config(path=agent_config_path)`
  - Reads `config.workflows` section, finds matching triggers (source: `call.completed`)
  - Constructs `trigger_data` dict: `{"call_id": ..., "conversation_id": ..., "outcome": ..., "duration_ms": ..., "attempt_number": ..., "transcript": [...], "extraction": extraction_result_dict_or_none}`. The `extraction` field carries the JSON Schema-validated dict from `extract_call_data` (or None if extraction skipped/failed). This enables post-call workflows to use `{{ trigger.extraction.verified }}` in step params.
  - Calls `engine.execute()` for each matching workflow with trigger_data
  - Import boundary: `temporal/` → `{temporal, core, config, runtime}` — all allowed. No exception needed.
- `packages/grove/src/grove/runtime/workflow_engine.py` — MODIFY: add `@classmethod create_with_builtins(cls) -> WorkflowEngine` factory method that calls `get_builtin_actions()` from `actions/__init__.py` and returns `cls(actions=get_builtin_actions())`.
- **Config distribution:** Agent YAML configs must be accessible from the temporal-worker process for `execute_post_call_workflows` to load them via `load_agent_config(path)`. Solution: `agent_config_path` is passed through the workflow chain as a field in `OutboundCallInput` (set from `CampaignWorkflowInput.agent_config`). The temporal-worker Dockerfile COPYs agent configs from `apps/agent-worker/configs/` (same source). Alternative: embed workflow config in the activity input directly (no filesystem dependency).
- `apps/temporal-worker/pyproject.toml` — MODIFY: add `litellm` dependency (needed for extract_call_data LLM calls).
- `packages/grove/src/grove/config/schema.py` — MODIFY: add `ExtractionConfig` model to AgentConfig schema:
  ```python
  class ExtractionConfig(BaseModel):
      model: str = "gpt-4o-mini"                    # LLM model for extraction
      schema: dict[str, Any]                         # JSON Schema defining extraction fields
      prompt_template: str | None = None             # Optional custom prompt (default: "Extract the following fields from the transcript: {schema}")
  ```
  Add `extraction: ExtractionConfig | None = None` field to `AgentConfig`. Uses JSON Schema (not Pydantic) because: (1) configurable per-agent in YAML without Python code changes, (2) forward-compatible with future n8n-style visual workflow builder (UI renders form fields from JSON Schema), (3) any domain — Plaktukai, healthcare, logistics — uses the same activity with different schemas.
- `apps/temporal-worker/src/temporal_worker/activities/extraction.py` — NEW: `extract_call_data`
  - Receives transcript messages in-memory via `CallResult.messages` (passed from `VoiceCallResult` through the workflow chain — NO cross-schema DB read from grove.messages)
  - Loads agent config via `load_agent_config(agent_config_path)` and reads `config.extraction.schema` (JSON Schema)
  - If `config.extraction` is None: skip extraction, return None (agent has no extraction configured)
  - Builds LLM prompt from `config.extraction.prompt_template` (or default template) with schema field descriptions
  - LiteLLM completion with `response_format={"type": "json_schema", "json_schema": config.extraction.schema}`
  - Validates LLM output against JSON Schema (using `jsonschema.validate()`, NOT hardcoded Pydantic)
  - Retry on validation failure (2 retries within activity)
  - Null fallback on final failure
  - Returns `dict[str, Any]` — domain-agnostic, schema-validated
  - Skips extraction for non-meaningful transcripts (e.g., 3x no_answer — no conversation to extract from)
- `apps/temporal-worker/src/temporal_worker/activities/post_call.py` — NEW: `platform_post_call_activity`
  - `SET search_path TO {tenant_schema}, grove, public`
  - Updates tenant.calls (outcome, chat_id, duration, metadata)
  - Writes tenant.call_transcripts (segments from grove.messages)

**Tests:**
- `packages/grove/tests/unit/temporal/test_workflow_activities.py` — NEW, 5 tests:
  1. Loads config and finds matching triggers (source: call.completed)
  2. Constructs WorkflowEngine via create_with_builtins() factory
  3. Calls engine.execute for each matching workflow
  4. No matching triggers: no-op (no engine constructed)
  5. Engine failure: logs error, does not raise (best-effort)
- `apps/temporal-worker/tests/unit/test_extraction.py` — NEW, 10 tests:
  1. Successful extraction with valid LLM output matching JSON Schema
  2. Invalid LLM output: retry with stricter prompt
  3. Empty transcript: returns None (skips LLM call)
  4. JSON Schema validation catches invalid fields
  5. Correct extraction schema loaded from agent config
  6. Null fallback on all retries exhausted
  7. Agent config with no extraction section: returns None (skip)
  8. LiteLLM called with correct model from config.extraction.model
  9. Custom prompt_template used when provided in config
  10. Schema with enum constraints validates correctly (e.g., verification_result: confirmed|discrepancy|unreachable)
- `packages/grove/tests/unit/config/test_extraction_config.py` — NEW, 3 tests:
  1. AgentConfig with extraction section loads without validation errors
  2. AgentConfig without extraction section loads (backward compatible)
  3. ExtractionConfig validates JSON Schema format

**Verification gate:**
```bash
uv run pyright packages/grove/src/grove/temporal/ apps/temporal-worker/src/
uv run pytest packages/grove/tests/unit/temporal/test_workflow_activities.py apps/temporal-worker/tests/unit/test_extraction.py --tb=short -q  # Expected: 15 passed
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short  # Import boundary check
```

**Context budget:** ~40K tokens

**Depends on:** Phase 0 (voice persistence provides grove_post_call_activity), Phase 2 (temporal worker package)

**Can run in parallel with:** Phase 3, Phase 6 (different files, clear ownership)

---

### Phase 6: Plaktukai Agent Configs

**Objective:** Create RU and EN YAML agent configs with verification flow, Plaktukai-specific tools, extraction schema, and post-call workflow config. Tools are Python classes (GroveBaseTool subclasses), pre-built per client by NFQ developers. The agent has tools at its disposal and decides autonomously when to call them during conversation — no hardcoded call paths. This matches the provider-managed, code-first model from VISION 2.1.

**Input:**
- Feature spec: User Stories (Epic 10.B), Notes (personas, TTS config)
- Design doc: Appendix C Phase 6
- Source files to read:
  - `packages/grove/examples/` — existing YAML configs (pattern reference for flow definition, tools, workflows sections)
  - `packages/grove/src/grove/config/schema.py` — AgentConfig schema
  - `packages/grove/src/grove/config/loader.py` — load_agent_config

**Deliverables:**
- `apps/agent-worker/configs/plaktukai_ru.yaml` — NEW: Russian agent (Simona persona, ElevenLabs eleven_v3 model for Lithuanian TTS, flow: greeting → identification → verification → result, `collect_verification_data` tool, post_call_summary workflow with call.completed trigger). Includes `extraction:` section with JSON Schema for Plaktukai driver verification fields from VISION 5.1:
  ```yaml
  extraction:
    model: gpt-4o-mini
    schema:
      type: object
      properties:
        driver_name: { type: string, description: "Full name of the driver" }
        driver_id: { type: string, description: "Driver employee ID" }
        call_timestamp: { type: string, format: date-time, description: "UTC timestamp when call was initiated" }
        reported_location: { type: string, description: "Location reported by driver" }
        reported_status: { type: string, enum: [driving, resting, loading, unloading, waiting] }
        hours_worked_today: { type: number, description: "Hours worked today as reported" }
        next_stop: { type: string, description: "Driver's next destination" }
        expected_arrival: { type: string, description: "Expected arrival time at next stop" }
        notes: { type: string, description: "Any additional notes from the conversation" }
        verification_result: { type: string, enum: [confirmed, discrepancy, unreachable] }
      required: [driver_name, reported_status, verification_result]
  ```
- `apps/agent-worker/configs/plaktukai_en.yaml` — NEW: English agent (Michael persona, Google Chirp3-HD TTS, same flow structure, same extraction schema as plaktukai_ru.yaml)
- `apps/agent-worker/configs/` — Directory must be created. Configs are loaded by entrypoint.py via room metadata `config_path` field. The agent-worker Dockerfile must COPY this directory into the image.

**Manager alert workflow (VISION 5.1 requirement):** Add a conditional post-call workflow step in the Plaktukai agent YAML that fires when `extraction.verification_result == "discrepancy"`:

```yaml
workflows:
  - name: manager_discrepancy_alert
    trigger:
      type: event
      event: call.completed
    steps:
      - action: condition
        params:
          expression: "trigger.extraction.verification_result == 'discrepancy'"
      - action: http_request
        params:
          method: POST
          url: "${TMS_ALERT_WEBHOOK_URL}"
          body:
            driver_id: "{{ trigger.extraction.driver_id }}"
            driver_name: "{{ trigger.extraction.driver_name }}"
            verification_result: "{{ trigger.extraction.verification_result }}"
            call_id: "{{ trigger.call_id }}"
      - action: log
        params:
          message: "Discrepancy alert sent for driver {{ trigger.extraction.driver_id }}"

  - name: verification_success_sync
    trigger:
      type: event
      event: call.completed
    steps:
      - action: condition
        params:
          expression: "trigger.extraction.verification_result == 'confirmed'"
      - action: http_request
        params:
          method: POST
          url: "${TMS_API_URL}/drivers/{{ trigger.extraction.driver_id }}/verify"
          body:
            driver_id: "{{ trigger.extraction.driver_id }}"
            driver_name: "{{ trigger.extraction.driver_name }}"
            reported_location: "{{ trigger.extraction.reported_location }}"
            reported_status: "{{ trigger.extraction.reported_status }}"
            hours_worked_today: "{{ trigger.extraction.hours_worked_today }}"
            verification_result: "{{ trigger.extraction.verification_result }}"
            call_id: "{{ trigger.call_id }}"
      - action: log
        params:
          message: "Verification success synced for driver {{ trigger.extraction.driver_id }}"
```

This covers VISION 5.1's "Alert: Location/time mismatch for driver" requirement. The actual TMS comparison logic remains deferred (TMS owns it), but agent-extracted discrepancies trigger alerts immediately.
- `apps/agent-worker/src/agent_worker/__init__.py` — EXISTS (no change)

**Tool architecture (verified against voice worker code):** The voice worker loads tools via `_resolve_voice_plugins(agent_config)` (`entrypoint.py:73-124`), which resolves plugins declared in agent YAML — NOT via arbitrary function imports. The resolution uses a three-tier mechanism:

1. Built-in `PLUGIN_REGISTRY` (only `"outlook"` registered)
2. **Explicit `module` key in plugin config** -- platform plugins use this
3. Convention fallback: `grove.plugins.<name>.create_plugins`

**Deliverables for Plaktukai tools:**
- `apps/agent-worker/src/agent_worker/plugins/plaktukai/__init__.py` — NEW: `PlaktukaiPlugin` class implementing `GrovePlugin` protocol (`core/plugin.py`). Properties: `name="plaktukai"`, `tools=[LookupDriverInfoTool(), ...]`, `instructions="..."`. Factory function: `create_plugins(**kwargs) -> list[PlaktukaiPlugin]`.
- `apps/agent-worker/src/agent_worker/plugins/plaktukai/tools.py` — NEW: `LookupDriverInfoTool`, `ReportVerificationTool`, `GetRouteInfoTool` extending `GroveBaseTool`. Platform-specific, NOT in `packages/grove/`.
- Agent YAML declares the plugin:
  ```yaml
  plugins:
    plaktukai:
      enabled: true
      config:
        module: "agent_worker.plugins.plaktukai.create_plugins"
  ```

This replaces the previously planned `register_plaktukai_tools(registry)` approach, which contradicts how the voice worker actually discovers tools.

- `apps/agent-worker/tests/__init__.py` — NEW (if not exists)
- `apps/agent-worker/tests/unit/__init__.py` — NEW (if not exists)
- `apps/agent-worker/tests/unit/test_plaktukai_configs.py` — NEW

**Tool validation note:** `load_agent_config()` validates YAML structure only (Pydantic schema). It does NOT validate runtime tool availability — plugin resolution happens at runtime in the voice worker via `_resolve_voice_plugins()`. Config tests verify structural validity. Runtime tool availability requires the plugin module path to be importable in the agent-worker process.

**Tests:**
- `apps/agent-worker/tests/unit/test_plaktukai_configs.py` — 5 tests:
  1. plaktukai_ru.yaml loads without validation errors via load_agent_config
  2. plaktukai_en.yaml loads without validation errors
  3. Both define 4-node verification flow (greeting, identification, verification, result)
  4. Both declare collect_verification_data in their tools list
  5. Both have extraction section with all 10 Plaktukai fields (driver_name, driver_id, call_timestamp, reported_location, reported_status, hours_worked_today, next_stop, expected_arrival, notes, verification_result)
  6. Extraction schema required fields: driver_name, reported_status, verification_result
  7. Both have 2 workflows (manager_discrepancy_alert + verification_success_sync) with call.completed triggers
  8. Extraction schema includes call_timestamp field with format: date-time
- `apps/agent-worker/tests/unit/test_plaktukai_tools.py` — NEW, 5 tests:
  1. LookupDriverInfoTool returns structured dict with driver schedule and position
  2. LookupDriverInfoTool validates required params (driver_id)
  3. ReportVerificationTool makes correct API call to TMS_API_URL
  4. ReportVerificationTool handles API timeout gracefully (returns None, agent continues)
  5. PlaktukaiPlugin.tools returns all expected tool instances

**Verification gate:**
```bash
uv run pytest apps/agent-worker/tests/unit/test_plaktukai_configs.py --tb=short -q  # Expected: 5 passed
```

**Context budget:** ~20K tokens

**Depends on:** Phase 2 (schema understanding, but YAML files don't import Python)

**Can run in parallel with:** Phase 3, Phase 4, Phase 5

---

### Phase 7: Integration Tests

**Objective:** Full campaign lifecycle with real Temporal dev server. All workflows registered, activities mocked (no real phone calls).

**Input:**
- Design doc: Section 7 (Testing Strategy), Appendix B (all 8 steps)
- Source files: ALL Phase 0-6 deliverables

**Deliverables:**
- `apps/temporal-worker/tests/integration/__init__.py` — NEW
- `apps/temporal-worker/tests/integration/conftest.py` — NEW: Temporal dev server fixture, stub VoiceCallWorkflow returning configurable outcomes, mock activities (no real phone calls, no real DB)
- `apps/temporal-worker/tests/integration/test_campaign_e2e.py` — NEW

**Tests:**
- `apps/temporal-worker/tests/integration/test_campaign_e2e.py` — 8 tests:
  1. Full campaign: 3 contacts → mixed outcomes → verify CampaignResult (total, completed, failed counts)
  2. Retry: no_answer → retry → completed → verify 2 attempts, two different conversation_ids
  3. Pause/resume: pause signal → no new calls dispatched → resume → continues to completion
  4. Cancel: cancel signal → remaining contacts skipped, status='cancelled'
  5. Extraction: completed call → extract_call_data invoked → extraction result in CallResult
  6. `test_continue_as_new_during_campaign` — campaign with contacts exceeding threshold triggers `continue_as_new`, cursor preserved, campaign completes correctly
  7. `test_auto_pause_on_failure_threshold` — >50% failure rate triggers auto-pause, campaign status becomes `paused`
  8. `test_max_retry_attempts_exhausted` — 3x `no_answer` → contact marked `failed`, campaign continues to next contact

**Verification gate:**
```bash
uv run pytest apps/temporal-worker/tests/integration/ --tb=short -q  # Expected: 8 passed
uv run pytest apps/temporal-worker/tests/ --tb=short -q              # Full temporal-worker suite
uv run pyright apps/temporal-worker/src/
uv run ruff check apps/temporal-worker/
uv run ruff format --check apps/temporal-worker/
```

**Context budget:** ~45K tokens

**Depends on:** ALL previous phases (0-6)

**Can run in parallel with:** none — final integration

---

## 5. Execution Graph

```
Phase 0 (M8 gaps + voice persistence) ──────────────────────────────────────────┐
                                                                                 │
Phase 1 (DB schema + CallOutcome) ──→ Phase 2 (worker + models + init.) ────────┤
                                           │                                     │
                                           ├──→ Phase 3 (retry) ──→ Phase 4 (campaign)
                                           │                                     │
                                           ├──→ Phase 5 (post-call) ─────────────┤
                                           │                                     │
                                           └──→ Phase 6 (configs) ──────────────┤
                                                                                 │
                                                                                 ↓
                                                                        Phase 7 (integration)
```

**Sequential critical path:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 7

**Parallel opportunities:**
- Phase 0 ‖ Phase 1 (no prerequisite — different packages, zero file overlap)
- After Phase 2: Phase 3 ‖ Phase 5 ‖ Phase 6 (different files, clear ownership)
- Phase 4 depends on Phase 3 only (not on Phase 5/6)

**Recommended execution order:**
1. Phase 0 + Phase 1 (parallel, no prerequisites)
2. Phase 2
3. Phase 3 + Phase 5 + Phase 6 (parallel — different files, clear ownership)
4. Phase 4 (depends on Phase 3)
5. Phase 7 (depends on all)

**Deployment constraint:** Phase 3 (`OutboundCallWithRetryWorkflow`) calls `extract_call_data` and `platform_post_call_activity` by string name — activities registered by Phase 5. These phases MUST deploy atomically (merge to main in the same release). Deploying Phase 3 without Phase 5 causes `activity not registered` runtime errors.

---

## 6. Context Budget Summary

| Phase | Spec | Source | Deps | Overhead | Total |
|-------|------|--------|------|----------|-------|
| Phase 0: M8 Gaps + Voice Persistence | 10K | 25K | 8K | 7K | ~50K |
| Phase 1: DB Schema | 10K | 8K | 3K | 4K | ~25K |
| Phase 2: Worker + Models + Initiation | 10K | 12K | 8K | 5K | ~35K |
| Phase 3: Retry Workflow | 10K | 10K | 5K | 5K | ~30K |
| Phase 4: Campaign Workflow | 12K | 12K | 8K | 8K | ~40K |
| Phase 5: Post-Call Processing | 12K | 18K | 5K | 5K | ~40K |
| Phase 6: Agent Configs | 5K | 8K | 3K | 4K | ~20K |
| Phase 7: Integration Tests | 12K | 20K | 8K | 5K | ~45K |

All phases under 100K token budget per agent.

---

## 7. Rules

- One phase at a time for sequential dependencies (parallel only where indicated in execution graph)
- Never skip a phase — dependencies are strict
- Context budget: stay under 100K tokens per agent prompt
- Every phase has a verification gate — no exceptions
- Compromises logged in tech-debt-tracker (archived)
- All file paths are verified against actual repository structure — do not invent paths
- ConversationStore API extensions must add methods to both ABC (`core/conversations.py`) and Postgres backend (`backends/postgres/conversation_store.py`)
- Workflow I/O types must be `@dataclass` (NOT Pydantic) per Temporal sandbox restrictions

---

## 8. Progress Tracking

| Phase | Status | Tests | Files | Notes |
|-------|--------|-------|-------|-------|
| Phase 0: M8 Gaps + Voice Persistence | pending | 0/22 | 0/8 | |
| Phase 1: DB Schema + CallOutcome | pending | 0/6 | 0/5 | |
| Phase 2: Worker + Models + Initiation | pending | 0/10 | 0/8 | PR #44 closed initiate_call_activity + worker bootstrap |
| Phase 3: Retry Workflow | pending | 0/10 | 0/3 | |
| Phase 4: Campaign Workflow | pending | 0/16 | 0/3 | |
| Phase 5: Post-Call Processing | pending | 0/18 | 0/7 | |
| Phase 6: Agent Configs | pending | 0/12 | 0/8 | |
| Phase 7: Integration Tests | pending | 0/8 | 0/3 | |
| **Total** | | **0/102** | **0/45** | |

---

## 9. Risk Checkpoints

After each phase, verify these risk mitigations from the design doc:

| After Phase | Check |
|-------------|-------|
| Phase 0 | Voice worker has NO asyncpg import. Messages flow through Temporal signal only. Signal payload < 2MB (500 message cap enforced). `grove_post_call_activity` string name matches `@activity.defn` method name. `VoiceCallWorkflow.run()` calls ONLY `grove_post_call_activity` — NO platform activities (Grove independence). `VoiceCallWorkflow` returns `VoiceCallResult` with messages for downstream use. `GrovePostCallInput` includes messages, organization_id, user_id, agent_name. `find_or_create_by_external_id` called with all required params. `update_call_metadata` method exists on both ABC and Postgres backend. Outcome mapping function in entrypoint.py covers all `DisconnectReason` values from Section 2.1. 8 unit tests verify all DisconnectReason → CallOutcome mappings including CLIENT_INITIATED 5000ms boundary. `add_messages` uses single transaction — verify no partial inserts on simulated crash. Stale comment at `voice_call_workflow.py:95` updated to reference `apps/temporal-worker/` (not `apps/agent-worker/`). |
| Phase 1 | CHECK constraint migration is DROP+RECREATE. Downgrade restores original values. Platform migrations at correct path: `packages/platform-core/src/platform_core/alembic/versions/`. `call_state` table contains ONLY lifecycle values (pending, ringing, in_progress, completed) — no outcome values leaked. |
| Phase 2 | Platform worker (PR #44 base) extended with campaign workflows + activities. `initiate_call_activity` sets room metadata (config_path, org_id, user_id, conversation_id) for voice entrypoint — **gap in PR #44, must be closed**. Models are `@dataclass` not Pydantic (Temporal sandbox). Sandbox passthrough modules include `temporal_worker` package. |
| Phase 3 | Retry delays match: no_answer=60min, busy=30min, voicemail=120min. Terminal outcomes don't retry. Each attempt gets a NEW `conversation_id` (no Temporal workflow ID collision). `retry_of` links to previous call_id. |
| Phase 4 | `continue_as_new` saves progress to DB before continuing. Signals re-register after continuation. Pause doesn't kill in-flight calls. Progress counters survive continuation. All 5 dedicated `continue_as_new` tests pass. `continue_as_new` triggers ONLY between contacts, never while a child workflow is in flight. `CampaignWorkflowInput.start_index` and `initial_progress` fields carry cursor across continuations. |
| Phase 5 | `execute_post_call_workflows` uses `WorkflowEngine.create_with_builtins()` factory (no GroveActivityContext change, no `temporal/` → `actions/` boundary violation). Import boundary: `temporal/` → `runtime/` allowed. Extraction skips empty transcripts. |
| Phase 6 | Agent configs load via `load_agent_config`. Flow definition has correct 4-node structure. `apps/agent-worker/configs/` directory exists. Plaktukai plugin is NOT in `packages/grove/`. Plugin module path in YAML matches actual import path. Dockerfile COPYs configs. Manager discrepancy alert workflow configured for `call.completed` trigger. |
| Phase 7 | All 102 tests pass. pyright 0 errors across all affected packages. Architecture tests unchanged. ruff clean. |

---

## 10. Prerequisites Verification (Run Before Phase 0)

Before starting ANY phase, verify M8/M20 gaps exist as documented. Use exact paths from the actual repository:

| Gap | Expected State | Verify Command |
|-----|---------------|----------------|
| VoiceCallWorkflow not registered in grove worker | **CLOSED (PR #44):** Registered in `create_platform_worker()` | `grep -n "VoiceCallWorkflow" apps/temporal-worker/src/temporal_worker/worker.py` |
| VoiceActivities not registered in grove worker | VoiceActivities class exists but not in create_grove_worker | `grep -n "VoiceActivities\|voice_activities" packages/grove/src/grove/temporal/worker.py` |
| post_call_activity is logging stub | No DB persistence, no GroveActivityContext | `grep -A5 "post_call_activity" packages/grove/src/grove/temporal/voice_activities.py` |
| signal_call_completed has zero callers from entrypoint | Signal helper exists in agent-worker but entrypoint doesn't call it | `grep -n "signal_call_completed" packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py` (should return nothing) |
| signal_call_completed helper location | Helper at apps/agent-worker, NOT in grove-voice-livekit | `grep -rn "def signal_call_completed" apps/agent-worker/src/agent_worker/temporal_signal.py` |
| WorkflowEngine has no Temporal activity wrapper | No workflow_activities.py in temporal/ | `ls packages/grove/src/grove/temporal/workflow_activities.py 2>/dev/null && echo "EXISTS" || echo "NOT FOUND"` |
| ConversationStore has no update_call_metadata | Only update_chat_status, update_chat_title, update_action_binding, mark_chat_as_read | `grep -n "def update\|def mark" packages/grove/src/grove/core/conversations.py` |
| initiate_call_activity not a Temporal activity | **CLOSED (PR #44):** Implemented in `VoicePlatformActivities` | `grep -n "initiate_call" apps/temporal-worker/src/temporal_worker/voice_activities.py` |
| ConversationStore.add_message is singular | No add_messages (plural) batch method | `grep -n "def add_message" packages/grove/src/grove/core/conversations.py` |
| All PKs are raw UUIDs (no prefixes) | **Accepted for M10:** All tables use UUID PKs. Prefixed IDs deferred to separate epic (see Section 12 tech debt). New M10 tables use UUID PKs for consistency. | `grep -c "UUID PRIMARY KEY" packages/grove/src/grove/alembic/versions/001_initial_schema.py` (expect: 4) |

If any gap is already resolved, adjust the corresponding phase scope.

**Cross-reference verification (2026-02-18):** Full codebase verification completed across 6 parallel agents. 85+ claims verified against actual code. Results:
- Phase 0 Grove core: 31/31 match
- Phase 0 voice-livekit: 12/14 match (2 gaps already documented in plan: env var mismatch line 284, room metadata line 277)
- Phase 1 DB schema: all claims match
- Phase 2-4 temporal worker: all claims match + 1 stale comment found (added to Phase 0 deliverables)
- Phase 5 post-call: 14/14 match
- Phase 6 agent/plugin: 11/12 match (contact context last-mile explicitly covered in Phase 2 deliverables lines 267-270)

---

## 11. Cross-References

- **Design doc:** [wiki/design-docs/m10-outbound-plaktukai.md](../../../wiki/design-docs/m10-outbound-plaktukai.md) — 14 ADRs, full SQL schema, end-to-end data flow
- **Feature spec:** wiki/design-docs/m10-outbound-plaktukai.md (feature spec archived into design doc)
- **Platform architecture:** [wiki/architecture/architecture.md](../../../wiki/architecture/architecture.md) — Section 3.5 (Orchestration Layer), Section 3.6 (Data Layer)
- **Grove architecture:** [wiki/architecture/grove.md](../../../wiki/architecture/grove.md) — Import boundaries, ConversationStore protocol
- **Voice architecture:** [wiki/systems/voice.md](../../../wiki/systems/voice.md) — Voice worker isolation, signal pattern
- **M20 Workflow Engine:** [wiki/design-docs/workflow-schema.md](../../../wiki/design-docs/workflow-schema.md) — WorkflowAction protocol, graph execution
- **Lifecycle:** (lifecycle doc archived)
- **Code style:** [AGENTS.md](../../../AGENTS.md) — Naming, import conventions
- **Tech debt:** (tech-debt-tracker archived)

---

## 12. Known Tech Debt

Items deferred from M10 scope by design. Log here for future planning:

| Item | Reason Deferred | Revisit When |
|------|----------------|-------------|
| Concurrent call execution (max_concurrent_calls > 1) | MVP simplicity; hierarchy supports adding sliding window by changing iteration pattern only | Campaign size exceeds 50 contacts regularly |
| Calling window enforcement | Schema fields exist in CallRetryConfig; demo runs during business hours | Production rollout to multiple timezones |
| REST API for campaign management | MVP uses Temporal CLI/UI directly | M13 Dashboard implementation |
| Voicemail drop (pre-recorded message) | Not needed for driver verification use case | Customer requests voicemail feature |
| DATA-17/DATA-18 workflow template/instance tables | Post-call workflows run from agent YAML config directly | Platform workflow management API built |
| Event bus / pg_notify for workflow triggers | Direct `WorkflowEngine.execute()` call for now (D7) | Multiple trigger sources beyond call.completed |
| `continue_as_new` cursor edge cases | Basic cursor implemented; complex failure modes during continuation not tested | First campaign with >100 contacts in production |
| Voicemail detection and retry | LiveKit SIP cannot distinguish voicemail from live answer (both SIP 200 OK). Calls answered by voicemail are classified as `completed` with short duration. The `voicemail: 120min` retry delay is configured in `CallRetryConfig` but will never trigger until detection is implemented. The retry infrastructure is forward-compatible — adding detection only requires the outcome mapping function to emit `CallOutcome.voicemail`. | Customer requests voicemail-specific handling — add audio heuristics or carrier header detection |
| Voice tool call persistence | `convert_chat_context()` in grove-voice-livekit drops FunctionCall/FunctionCallOutput items — only `{role, content}` messages are collected and persisted. `grove.messages` schema supports `tool_calls` (JSONB) and `tool_call_id` (TEXT) columns. For Plaktukai extraction, natural language transcript is sufficient. | Audit/debugging requires full tool call records, or extraction schema needs structured tool outputs |
| Telematics comparison logic | VISION 5.1 shows "Compare self-reported vs. telematics data" as a post-call verification step. M10 delivers extracted data via `trigger_data.extraction` to post-call workflows. The actual comparison (query telematics API, compare locations, flag discrepancies) is a domain-specific workflow configured in agent YAML using `http_request` action to call TMS API: `POST /drivers/{{ trigger.extraction.driver_id }}/verify`. The TMS system owns the comparison logic. M10 provides the data pipeline, not the business rules. | TMS integration API is available and telematics comparison workflow step is configured in plaktukai YAML |
| Visual tool & workflow builder (n8n-style) | Platform tools are Python classes pre-built per client. Future: UI shows registered tools for drag-and-drop composition into workflows, connector marketplace for common integrations (CRM, EHR, TMS), and visual workflow editor replacing YAML. Tool registration already supports discovery via `ToolRegistry`. | Multiple clients onboarded, workflow patterns stabilize, M13+ dashboard |
| Prefixed object IDs (platform-wide migration) | Massive blast radius (11 tables, 30+ files, 2 migrations). Current tenant schema doesn't contain all assumed tables. Must be planned as a separate epic with production data backfill strategy. | Pre-production cleanup sprint or when ID collisions/debugging pain justifies the migration cost |
| Schedule next verification based on route (VISION 5.1) | ScheduledCallWorkflow is out-of-scope for M10. Requires route-aware scheduling logic. | ScheduledCallWorkflow implementation (post-M10) |
| LiveKit to Temporal network access documentation | Voice worker process needs network access to Temporal for `signal_call_completed`. Not documented in infrastructure requirements. | Infrastructure setup for staging/production deployment |
| Design doc drift | Design doc (`wiki/design-docs/m10-outbound-calls.md`) does not reflect exec plan additions: `ContactRecord.metadata` field, `ExtractionConfig` in AgentConfig, two-step room creation pattern, plugin-based tool loading. | Update design doc before or during Phase 7 |

---

## 13. Acceptance Criteria Evidence Matrix

Per `implementation lifecycle (archived)` Stage 8 requirement. Complete before declaring PR ready.

| AC | Phase | Test / Evidence | Status |
|----|-------|----------------|--------|
| Batch outbound calls via Temporal CLI | Phase 4 | `test_campaign_workflow_sequential_execution` | ☐ |
| Retry with configurable delays | Phase 3 | `test_retry_on_no_answer`, `test_retry_delays` | ☐ |
| Post-call data extraction via LLM | Phase 5 | `test_extraction_valid_schema`, `test_extraction_partial_fields` | ☐ |
| Post-call workflow triggers | Phase 5 | `test_execute_post_call_workflows` | ☐ |
| Campaign progress tracking | Phase 4 | `test_campaign_progress_updated_after_each_contact` | ☐ |
| continue_as_new for large campaigns | Phase 4 | `test_continue_as_new_at_threshold` | ☐ |
| Voice message persistence | Phase 0 | `test_messages_persisted_via_signal` | ☐ |
| Call outcome mapping from LiveKit | Phase 0 | `test_disconnect_reason_mapping` (8 cases) | ☐ |
| Plaktukai agent configs (RU + EN) | Phase 6 | `test_plaktukai_ru_config_valid`, `test_plaktukai_en_config_valid` | ☐ |
| Manager discrepancy alert + TMS sync | Phase 6 | `test_discrepancy_alert_workflow_config`, `test_verification_success_workflow_config` | ☐ |
| Grove independence | All | `test_import_boundaries` + manual review | ☐ |
| pyright 0 errors | All | `uv run pyright packages/grove/src/` | ☐ |

---

## 14. VISION Cross-Check (Feb 18 2026)

Cross-reference between `docs/requirements/nfq.md` Section 5.1 (Logistics: Driver Work Time Verification) and M10 implementation phases. Ensures no requirement is silently dropped.

### 14.1 VISION 5.1 Workflow Component Coverage

| VISION Component | M10 Phase | Status | Notes |
|------------------|-----------|--------|-------|
| Telematics webhook trigger | Phase 4 | **Deferred** | M10 uses Temporal CLI for campaign creation. M7 (Incident Detection) owns webhook ingestion. |
| Pre-call context fetch (driver schedule, telematics position) | Phase 2 | **Partial** | `ContactRecord.metadata` carries static context. No real-time telematics lookup. |
| Initiate outbound call with driver context | Phase 2 | **Complete** | Two-step room creation + SIP dial. Room metadata includes contact_context. |
| Agent greeting & purpose | Phase 6 | **Complete** | Agent flow node "greeting" with system prompt. |
| Collect location, status, hours, next stop | Phase 5 + 6 | **Complete** | LLM extraction with JSON Schema validation. All VISION fields present. |
| Confirm & thank | Phase 6 | **Complete** | Agent flow node "result". |
| Compare self-reported vs telematics data | — | **Client responsibility** | M10 extracts data. TMS API owns comparison logic. See tech debt #851. |
| Alert manager on discrepancy | Phase 6 | **Complete** | `manager_discrepancy_alert` workflow with conditional routing. |
| Update TMS with verified data | Phase 6 | **Complete** | `verification_success_sync` workflow sends confirmed data to TMS API. |
| Flag for review in TMS/ERP | Phase 5 | **Partial** | M10 sends HTTP alert. TMS owns flagging logic. |
| Schedule next verification based on route | — | **Deferred** | ScheduledCallWorkflow out of M10 scope. See tech debt #854. |

### 14.2 VISION Data Extraction Schema Alignment

| VISION Field | M10 Field | Match |
|-------------|-----------|-------|
| driver_id | driver_id | ✓ |
| call_timestamp | call_timestamp | ✓ (added) |
| reported_location | reported_location | ✓ |
| reported_status (enum) | reported_status (enum) | ✓ Identical values |
| hours_worked_today | hours_worked_today | ✓ |
| next_stop | next_stop | ✓ |
| expected_arrival | expected_arrival | ✓ (string, not datetime) |
| notes | notes | ✓ |
| verification_result (enum) | verification_result (enum) | ✓ Identical values |
| — | driver_name | M10 addition (needed for alert workflows) |

### 14.3 VISION User Stories NOT Addressed by M10

These are handled by other modules per SOW_MAPPING.md and ROADMAP.md:

| VISION Story | Module Owner | Roadmap Phase |
|-------------|-------------|---------------|
| T1-T3: Telephony config | M4 (Multi-Tenancy) | MVP Core |
| T4: Inbound call routing | M12 (Inbound Support) | MVP Full |
| CM1-CM4: Live monitoring, observer, takeover | M13 (Call Monitoring) | MVP Full |
| CM5-CM10: Call history, recordings, analytics | M14 (Calls UI) + M16 (Analytics) | MVP Full / Phase 2 |
| AM5-AM8: Client-editable instructions, versioning | M9 (Agent Management) | MVP Core |
| O1-O5: Operator dashboard, alerts | M13 (Call Monitoring) + M15 (Dashboard) | MVP Full |
| WF5-WF6: Workflow monitoring, error notifications | M13 + M20 | MVP Full |
| Billing (Section 8) | M22 (Billing & Usage) | Phase 2 |

### 14.4 Architecture Gaps Accepted for Demo

| Gap | Accepted Because | Revisit When |
|-----|-----------------|-------------|
| No monitoring service (CM1-CM10) | Demo uses Temporal CLI for visibility | M13 implementation (Week 15-17) |
| No integration hub (webhooks, connectors) | Post-call `http_request` action sufficient for Plaktukai | M21 implementation (Week 4-22) |
| No billing/usage tracking | Demo is pre-commercial | M22 implementation (Week 15-22) |
| Sequential execution only (max_concurrent=1) | Plaktukai campaigns are small (<50 contacts) | Campaign size exceeds 50 contacts |
| No agent versioning | Single agent per language, no rollback needed yet | M9 agent lifecycle (Week 3-12) |
| No event bus / pg_notify | Direct WorkflowEngine.execute() sufficient | Multiple trigger sources needed |
