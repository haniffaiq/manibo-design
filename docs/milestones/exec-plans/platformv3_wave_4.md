# Execution Plan: Platform v3.0 — Wave 4: Voice Pipeline

> **Parent plan:** platform-v3-implementation-plan.md (archived)
> **Status:** Completed
> **Completed:** 2026-02-22

### Wave 4: Voice Pipeline

---

#### Phase 4.0: VoiceCallWorkflow (outbound) [DONE]

**Objective:** Implement the VoiceCallWorkflow pipeline: pre-call setup, LiveKit room creation with metadata, SIP participant creation, signal handling for CallCompleted, post-call activities.

**Input:**
- Architecture doc Section 8.2, 9.5

**Deliverables:**
- `packages/grove/src/grove/temporal/voice_workflow.py` — VoiceCallWorkflow
- Workflow ID: `grove.call/{call_id}` per Section 9.5
- Room metadata setting via LiveKit server API (admin tokens)
- CallCompletedSignal handling
- Timeout: workflow_execution_timeout = 2 hours
- Post-call activity orchestration

**Tests:**
- Unit: workflow happy path (mock Temporal)
- Unit: timeout fires if no CallCompleted signal
- Unit: room metadata includes all 5 required keys

**Verification gate:**
```bash
uv run pytest packages/grove/tests/ --tb=short -q
uv run pyright packages/grove/src/
```

**Context budget:** ~50K tokens
**Depends on:** Phase 1.3 (Temporal naming), Phase 3.1 (solution gating — VoiceCallWorkflow must query tenant_solutions for enabled_plugins)
**Can run in parallel with:** Phase 4.1

---

#### Phase 4.1: InboundCallWorkflow + DID mapping [DONE]

**Objective:** Implement inbound call architecture per Section 8.5: DID-to-tenant mapping, InboundCallWorkflow, room webhook handling.

**Input:**
- Architecture doc Section 8.5 (just added in P0 fix)

**Deliverables:**
- Migration: `public.phone_numbers` table
- `packages/platform-core/src/platform_core/voice/inbound.py` — DID lookup, dispatch rule management
- InboundCallWorkflow (triggered by room webhook)
- API endpoint: `POST /webhooks/livekit/room-started`
- Generate a stable `call_id` (UUID) for the inbound call and store it in LiveKit room metadata as `conversation_id`
- Workflow ID: `grove.inbound/{call_id}` (call_id is the canonical identifier; LiveKit room_name is not required to be a UUID)

**Tests:**
- Unit: DID lookup resolves tenant
- Unit: unknown DID returns 404
- Unit: InboundCallWorkflow happy path
- Unit: webhook returns `call_id` as UUID and starts workflow with `grove.inbound/{call_id}`
- Integration: webhook triggers workflow

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pyright packages/platform-core/src/
```

**Context budget:** ~45K tokens
**Depends on:** Phase 2.0 (public schema for phone_numbers + tenant_solutions), Phase 1.3 (Temporal naming), Phase 3.1 (solution gating — room.started webhook needs tenant_solutions lookup)
**Can run in parallel with:** Phase 4.0

---

#### Phase 4.2: Agent worker plugin loading from room metadata [DONE]

**Objective:** Agent worker reads enabled_plugins from room metadata and loads only listed plugins. Refuses to start if metadata is missing or malformed.

**Input:**
- Architecture doc Section 6.4 (agent worker enforcement)

**Deliverables:**
- `packages/grove-voice-livekit/src/grove_voice_livekit/metadata.py` — metadata parser + validator
- Plugin filtering in entrypoint: only load plugins from enabled_plugins allowlist
- Refuse session if enabled_plugins missing or malformed

**Tests:**
- Unit: valid metadata parsed correctly
- Unit: missing enabled_plugins refuses session
- Unit: malformed JSON refuses session
- Unit: unknown plugin names rejected

**Verification gate:**
```bash
uv run pytest packages/grove-voice-livekit/tests/ --tb=short -q
uv run pyright packages/grove-voice-livekit/src/
```

**Context budget:** ~30K tokens
**Depends on:** Phase 3.1 (solution gating)
**Can run in parallel with:** Phase 4.0, 4.1

---

#### Phase 4.3: Voice escalation + manual takeover primitives [DONE]

**Objective:** Add the architectural primitives for human escalation and manual takeover during live calls: tenant operator role, workflow signals, and LiveKit participant control.

**Input:**
- Architecture doc Section 2.3 (ClientOperator role), Section 8.6 (live monitoring + takeover), Section 15 invariant #18

**Deliverables:**
- Use the tenant-scoped role model in public schema (`public.memberships.role`: `client_admin` | `client_operator`)
- VoiceCallWorkflow:
  - `EscalateToHumanSignal` (agent → workflow) records escalation (audit + state) and emits an operator event (consumed by UI and/or `notifications` if enabled)
  - `ManualTakeoverSignal` (API → workflow) transitions the call to `human_takeover`
- LiveKit control activity invoked by workflow on takeover (mute/disconnect agent participant; update room metadata)
- Audit event emitted for escalation + takeover (actor, tenant_id, call_id, reason)
- Takeover failure policy: if takeover attempt fails, the agent continues and the operator can retry (no automatic call termination)

**Tests:**
- Integration: escalation signal handled and persisted/audited
- Integration: manual takeover signal triggers LiveKit control activity
- Integration: takeover failure does not end the call; workflow records audit event and remains in agent mode
- Unit: role checks (client_operator allowed; non-member denied)

**Verification gate:**
```bash
uv run pytest packages/platform-core/tests/ --tb=short -q
uv run pytest packages/grove/tests/integration/ -v --tb=short
```

**Context budget:** ~45K tokens
**Depends on:** Phase 2.0 (public schema, incl. audit_events table), Phase 4.0 (VoiceCallWorkflow)
**Can run in parallel with:** Phase 5.0

---

#### Phase 4.4: Incremental transcript persistence (crash-safe) [DONE]

---

## Completion Evidence (2026-02-22)

- Review tracker: platform-v3 consolidated review (archived)
- PASS evidence (representative):
  - P4.0: `packages/grove/tests/unit/temporal/test_voice_call_workflow.py:193`
  - P4.1: `packages/platform-core/src/platform_core/voice/webhook.py:1` + `packages/platform-core/tests/unit/test_voice/test_webhook.py:1`
  - P4.4: `packages/platform-core/tests/integration/test_transcript_persistence_activity.py:1`

**Objective:** Ensure call transcripts are persisted incrementally during the call so a voice worker crash does not lose the transcript. Live monitoring uses LiveKit room events; durability uses Temporal signals + activities.

**Input:**
- Architecture doc Section 8.6 (Transcript durability), Section 15 invariants #12, #18

**Deliverables:**
- A typed Temporal signal (agent worker → VoiceCallWorkflow) for finalized transcript segments (seq, speaker, timestamp, text)
- VoiceCallWorkflow persists segments via activity immediately (idempotent on `(call_id, seq)`), not only at call completion
- Workflow history bounded for long calls (buffer + `continue_as_new()` policy if needed)
- Canonical storage: transcript segments stored in a platform-owned tenant table (e.g., `tenant_*/call_transcript_segments`) and queryable for call review + call-ops UI
- FK safety: transcript persistence MUST ensure `tenant_*/calls(id=call_id)` exists before inserting `call_transcript_segments` (segments may arrive before any other call-record writes)

**Tests (integration/e2e focus):**
- Integration: sending 3 transcript segment signals results in 3 persisted rows before `call_completed`
- Integration: duplicate segment signals do not create duplicates (idempotency)
- Integration: "worker crash" simulation (no `call_completed` signal) still leaves already-sent segments persisted

**Verification gate:**
```bash
uv run pytest packages/grove/tests/integration/ -v --tb=short
```

**Context budget:** ~45K tokens
**Depends on:** Phase 4.0 (VoiceCallWorkflow)
**Can run in parallel with:** Phase 5.0
