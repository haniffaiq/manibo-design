# Execution Plan: Platform v3.0 — Wave 5: App Shells

> **Parent plan:** platform-v3-implementation-plan.md (archived)
> **Status:** Completed
> **Completed:** 2026-02-22

### Wave 5: App Shells

---

#### Phase 5.0: apps/api bootstrap [DONE]

**Objective:** Create the Platform API app shell — composition root wiring Grove + platform-core + solution routes.

**Input:**
- Architecture doc Section 4, 5.2

**Deliverables:**
- `apps/api/` — FastAPI application
- Bootstrap: auth middleware, tenant resolution, solution route mounting
- Health endpoint: `GET /health`
- 3 request scopes enforced by middleware

**Tests:**
- Integration: health check returns 200
- Integration: unauthenticated request returns 401
- Integration: tenant-scoped request with valid JWT works
- Integration: deployment-scoped request requires super_admin

**Verification gate:**
```bash
uv run pytest apps/api/tests/ --tb=short -q
uv run pyright apps/api/
pnpm -C apps/web lint
pnpm -C apps/web check-types
```

**Context budget:** ~50K tokens
**Depends on:** Phase 2.2 (auth), Phase 3.0 (solution discovery)
**Can run in parallel with:** Phase 5.1

---

#### Phase 5.1: apps/temporal-worker bootstrap [DONE]

**Objective:** Create the composed Temporal worker — single process with Grove core + discovered solution workflows and activities.

**Input:**
- Architecture doc Section 7.5, 9.2

**Deliverables:**
- `apps/temporal-worker/` — composed worker
- Bootstrap: asyncpg pool, psycopg pool, stores, solution discovery
- Single task queue: `grove-agent`
- Passthrough modules merged from all solutions
- Namespace configuration per Section 9.4
- Custom search attributes (TenantId, SolutionName) set on all workflow starts

**Tests:**
- Integration: worker starts and registers all discovered workflows/activities
- Integration: name collision detection works
- Unit: passthrough modules merged correctly

**Verification gate:**
```bash
uv run pytest apps/temporal-worker/tests/ --tb=short -q
```

**Context budget:** ~45K tokens
**Depends on:** Phase 3.0 (solution discovery), Phase 1.3 (Temporal naming)
**Can run in parallel with:** Phase 5.0, 5.2

---

#### Phase 5.2: apps/agent-worker bootstrap [DONE]

**Objective:** Create the agent worker app shell — LiveKit voice pipeline with NO DI, plugin loading from room metadata.

**Input:**
- Architecture doc Section 8.1, 8.3

**Deliverables:**
- `apps/agent-worker/` — LiveKit agent worker
- No DI: no asyncpg, no stores
- Plugin discovery via entry points, filtered by room metadata
- proc.userdata for HTTP session reuse
- Graceful shutdown (drain active calls)

**Tests:**
- Unit: plugin loading respects enabled_plugins
- Unit: missing metadata refuses session

**Verification gate:**
```bash
uv run pytest apps/agent-worker/tests/ --tb=short -q
```

**Context budget:** ~40K tokens
**Depends on:** Phase 4.2 (metadata loading)
**Can run in parallel with:** Phase 5.0, 5.1

---

#### Phase 5.3: Call-ops console (live transcript + takeover) [DONE]

---

## Completion Evidence (2026-02-22)

- Review tracker: platform-v3 consolidated review (archived)
- PASS evidence (representative):
  - P5.2: `packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py:98`
  - P5.3: `apps/web/src/app/call-ops/page.tsx:1`

**Objective:** Provide the minimal operator experience required by NFQ/VOX: real-time call monitoring with live transcript, escalation visibility, and a manual takeover button.

**Input:**
- Architecture doc Section 5.2 (Platform UI responsibilities), Section 8.6 (live monitoring + takeover), Section 15 invariant #18

**Deliverables:**
- `apps/api/` endpoints (tenant-scoped, role-gated):
  - list active calls for the tenant
  - mint LiveKit room tokens for observation (server-minted, least privilege)
  - mint LiveKit operator tokens for takeover talk (server-minted; can_publish=true; must not allow metadata updates)
  - trigger takeover (`POST /calls/{call_id}/takeover`) → signals workflow + audits
- Transcript streaming fallback: `apps/api/` SSE endpoint that streams persisted transcript segments from tenant DB (`call_transcript_segments`) for durability / call review (does not replace LiveKit room join)
- `apps/web/` minimal call-ops UI:
  - active calls dashboard
  - live transcript view (via LiveKit room join)
  - "Take over" action (ClientOperator only)

**Tests:**
- Integration: token minting requires `client_operator` (or `client_admin`)
- Integration: takeover endpoint requires `client_operator` (or `client_admin`) and creates audit event
- Integration: minted LiveKit token has least-privilege grants (observe/subscribe only; no publish)
- Integration: minted operator LiveKit token can publish (for human talk) and cannot update metadata
- Integration: transcript SSE stream returns persisted segments for a call_id (DB-backed)
- E2E (local): join a test room using minted token and receive transcript events/data messages

**Verification gate:**
```bash
uv run pytest apps/api/tests/ --tb=short -q
uv run pyright apps/api/
pnpm -C apps/web lint
pnpm -C apps/web check-types
```

**Context budget:** ~45K tokens
**Depends on:** Phase 5.0 (API), Phase 4.3 (takeover primitives)
**Can run in parallel with:** Phase 6.x phases
