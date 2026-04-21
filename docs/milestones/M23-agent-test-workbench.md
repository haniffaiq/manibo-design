# M23: Agent Test Workbench

Status: not started
Created: 2026-03-26
Owner: Jakit
Branch: feat/M23-agent-test-workbench
Stream: platform
Depends on: M3, M1
Reference: Pain point — browser voice testing is hardcoded to appointment_booking solution

## Goal

Give deployment admins a single-screen test workbench for any voice agent definition — draft or published — with live observation of everything happening during the call. Today, browser voice testing is buried inside the `appointment_booking` solution (`POST /clinic/browser-session`). Remove that solution and voice testing disappears. This milestone extracts browser voice session creation to the platform layer and builds a composite test page that wires the voice client, live timeline, escalation state, and extracted data into one screen.

## Problem

```
Today: testing a voice agent requires 3 browser tabs

  Tab 1: /bookings                    Tab 2: /call-ops              Tab 3: /observability
  ┌──────────────────────┐            ┌──────────────────┐          ┌──────────────────┐
  │ Clinic Browser Voice │            │ Active calls     │          │ Timeline         │
  │ [Start rehearsal]    │            │ (maybe see it?)  │          │ (find the call?) │
  │                      │  manually  │ Escalation badge │  switch  │ Events           │
  │ Only works for       │──switch──► │ Urgent banner    │──tabs──► │ Tool calls       │
  │ appointment_booking  │   tabs     │ Transcript       │          │ Evidence rail    │
  │ solution             │            │                  │          │                  │
  └──────────────────────┘            └──────────────────┘          └──────────────────┘

  Problems:
  ✗ Only works when appointment_booking is installed
  ✗ Only works for tenant users, not deployment admins
  ✗ Cannot test draft agent definitions
  ✗ No way to see live observation alongside the voice call
  ✗ Three tabs, manual context switching, easy to miss events
```

```
After M23: one screen, any agent definition

  /admin/agent-definitions/[id]/test
  ┌─────────────────────────────────────────────────────────────────────┐
  │ Deployment Console > Assistants > [Agent Name] > Test              │
  │ Agent: [Clinic Registrator v2.1 (draft) ▼]  [● Start]  ○ Idle     │
  ├──────────────────────────── 60% ──────────────┬──── 40% ───────────┤
  │                                               │                    │
  │  LIVE TIMELINE                                │  BROWSER VOICE     │
  │  ─────────────────────────────────            │  ────────────────  │
  │  10:03:01  ○ Caller: "Labas..."               │  ┌──────────────┐  │
  │  10:03:03  ● Agent: "Labas! Su..."            │  │ ▁▃▅▇▅▃▁▃▅▇  │  │
  │  10:03:17  ◆ Tool: confirm_identity           │  │  microphone  │  │
  │            result: ✓ matched                  │  └──────────────┘  │
  │  10:04:03  ◆ Tool: request_human_handoff      │  [Mute]   02:41   │
  │            reason: urgent_medical_need        │                    │
  │  ┌───────────────────────────────┐            │  Room: room_7f2    │
  │  │ ⚠ ESCALATION TRIGGERED      │            │  Status: ● Live    │
  │  │ Urgent medical need          │            │                    │
  │  └───────────────────────────────┘            │  ────────────────  │
  │                                               │  CALL CONTEXT      │
  ├───────────────────────────────────────────────┤  ────────────────  │
  │  ESCALATION STATE                             │                    │
  │  ─────────────────────────────────            │  Agent: Clinic     │
  │  🔴 Urgent transfer                          │    Registrator     │
  │  Reason: Urgent medical need                  │    v2.1 (draft)    │
  │  Priority: URGENT                             │                    │
  │  ℹ Same as /call-ops red badge + banner      │  Call: call_7f2    │
  │                                               │                    │
  ├───────────────────────────────────────────────┤  [Open in obs.]    │
  │  EXTRACTED DATA                               │  [Open call-ops]   │
  │  ─────────────────────────────────            │                    │
  │  Patient: Jonas Jonaitis                      │                    │
  │  Booking: handed_off                          │                    │
  │  Follow-up: ● Open — Urgent handoff           │                    │
  │  ℹ Same as /bookings follow-up queue          │                    │
  └───────────────────────────────────────────────┴────────────────────┘
  │ ● Connected (WebRTC)   Production runtime   Not billed            │
  └─────────────────────────────────────────────────────────────────────┘

  What this proves:
  ✓ Works for ANY agent definition (clinic, logistics, VOX, custom)
  ✓ Deployment admin can test draft configs before publishing
  ✓ Live observation on the same screen — no tab switching
  ✓ Same runtime as production — not a simulation
```

## Design Decisions

1. **Platform-level browser session endpoint** — `POST /calls/browser-session` in `apps/api/` (deployment-scoped). Accepts `agent_definition_id` (required) and optional `agent_definition_version`. Creates a LiveKit room with governed agent metadata. Replaces the solution-specific `POST /clinic/browser-session`.

2. **Room metadata uses governed agent ref** — The agent worker already supports `agent_definition_id` + `agent_definition_version` + `compiled_hash` in `RoomMetadata` (`packages/grove-voice-livekit/src/grove_voice_livekit/metadata.py:31-33`). The platform endpoint resolves the agent definition, compiles the config, and sets these fields in room metadata. No voice worker changes needed.

3. **Generic `BrowserVoiceClient` component** — Extract the LiveKit WebRTC connection logic from `ClinicBrowserVoiceCard` into a solution-agnostic component at `apps/web/src/components/browser-voice-client.tsx`. Start/Mute/End controls, microphone visualizer, connection state. No clinic-specific copy or branding.

4. **Rewire `ClinicBrowserVoiceCard` as thin wrapper** — After extraction, the clinic card becomes a wrapper that passes the clinic agent definition ID to the platform endpoint and adds clinic-specific copy. Zero logic duplication.

5. **Test workbench composites existing components** — The left panel reuses M1.x observability components (live timeline via `use-live-case-stream`, evidence events, case summary). The escalation panel reuses M3 components (`EscalationBadge`, `UrgentCallBanner`). No new observation logic — just wiring to a specific call ID.

6. **Draft agent support** — The platform endpoint accepts `agent_definition_id` without requiring a published version. It uses the latest draft config. The test workbench shows a "(draft)" badge to make clear the config is unpublished.

7. **No separate test infrastructure** — Test calls go through the same LiveKit rooms, same agent workers, same Temporal workflows as production. The only difference is the room is created from the admin console instead of SIP/inbound.

## Architecture: Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT ADMIN BROWSER                        │
│                                                                     │
│  Test Workbench Page (/admin/agent-definitions/[id]/test)           │
│  ┌─────────────────────────┐  ┌──────────────────────────────────┐  │
│  │  BrowserVoiceClient     │  │  LiveTimelinePanel               │  │
│  │  ┌───────────────────┐  │  │  (use-live-case-stream.ts)       │  │
│  │  │ WebRTC connection │  │  │  ┌────────────────────────────┐  │  │
│  │  │ to LiveKit room   │──┼──┼─►│ SSE: /calls/{id}/ops/stream│  │  │
│  │  └───────────────────┘  │  │  └────────────────────────────┘  │  │
│  └────────────┬────────────┘  │  ┌────────────────────────────┐  │  │
│               │               │  │ Poll: /calls/active/{id}/  │  │  │
│               │               │  │       events               │  │  │
│               │               │  └────────────────────────────┘  │  │
│               │               └──────────────────────────────────┘  │
└───────────────┼─────────────────────────────────────────────────────┘
                │
    1. POST /calls/browser-session
       {agent_definition_id: "adef_xxx"}
                │
                ▼
┌───────────────────────────────────┐
│  PLATFORM API (apps/api)          │
│                                   │
│  1. Resolve agent definition      │
│  2. Compile config (draft OK)     │
│  3. Create LiveKit room with      │
│     governed metadata:            │
│     {agent_definition_id,         │
│      agent_definition_version,    │
│      compiled_hash,               │
│      tenant_id, enabled_plugins}  │
│  4. Mint participant token        │
│  5. Return {connect_url, token,   │
│     room_name, call_id}           │
└───────────────┬───────────────────┘
                │
                │  Room created in LiveKit
                ▼
┌───────────────────────────────────┐
│  LIVEKIT CLOUD                    │
│  Room: test-voice-{call_id}       │
│  Metadata: governed agent ref     │
└───────────────┬───────────────────┘
                │
                │  Agent worker auto-joins
                ▼
┌───────────────────────────────────┐
│  AGENT WORKER                     │
│  (grove-voice-livekit)            │
│                                   │
│  1. Parse RoomMetadata            │
│  2. Resolve governed agent ref    │
│     → load_agent_config_for_      │
│       room_metadata()             │
│  3. Start voice pipeline          │
│  4. Emit events → Temporal        │
│     → /calls/active/{id}/events   │
│                                   │
│  NO CHANGES NEEDED                │
│  Already supports governed refs   │
└───────────────────────────────────┘
```

## Architecture: Component Extraction

```
Before M23 (solution-coupled):

  appointment_booking/
  ├── api.py
  │   └── POST /clinic/browser-session    ◄── hardcoded to clinic
  │       creates room with config_path
  │       only clinic profiles
  └── ui/src/
      └── clinic-browser-voice-card.tsx   ◄── hardcoded copy, branding
          contains all WebRTC logic
          contains LiveKit room management
          contains Start/Mute/End controls


After M23 (platform + thin solution wrapper):

  apps/api/src/platform_api/routes/
  └── browser_voice.py                    ◄── NEW: platform endpoint
      POST /calls/browser-session
      accepts agent_definition_id
      resolves governed ref
      creates room with governed metadata

  apps/web/src/components/
  └── browser-voice-client.tsx            ◄── NEW: generic voice component
      WebRTC connection logic
      Start/Mute/End controls
      Microphone + agent audio visualizers
      Connection state management
      No solution-specific content

  appointment_booking/ui/src/
  └── clinic-browser-voice-card.tsx       ◄── SIMPLIFIED: thin wrapper
      imports BrowserVoiceClient
      passes clinic agent_definition_id
      adds clinic-specific copy/branding
      ~30 lines instead of ~380
```

## Tasks

### Phase 1 — Platform browser voice session (backend)

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Platform browser session endpoint | not started | none |
| T02 | Agent definition resolution for draft configs | not started | T01 |

### Phase 2 — Generic browser voice client (frontend extraction)

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T03 | Extract BrowserVoiceClient component | not started | none |
| T04 | Rewire ClinicBrowserVoiceCard as thin wrapper | not started | T03 |

### Phase 3 — Test workbench page

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T05 | Test workbench layout + voice panel | not started | T01, T03 |
| T06 | Live timeline panel (wire M1.x components) | not started | T05 |
| T07 | Escalation state panel (wire M3 components) | not started | T05 |

### Phase 4 — Tests + cleanup

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T08 | E2E tests for test workbench | not started | T05-T07 |
| T09 | Deprecate /clinic/browser-session endpoint | not started | T04 |

## Acceptance Criteria

### Platform
- [ ] `POST /calls/browser-session` accepts `agent_definition_id`, returns `{connect_url, token, room_name, call_id}`
- [ ] Draft agent definitions resolve correctly (no "must be published" requirement)
- [ ] Room metadata uses governed agent ref (`agent_definition_id` + `version` + `compiled_hash`)
- [ ] Agent worker joins and runs the correct agent config (verified by test call)

### Frontend
- [ ] `BrowserVoiceClient` component works with any agent definition — no solution imports
- [ ] `ClinicBrowserVoiceCard` is a thin wrapper (<50 lines) that delegates to `BrowserVoiceClient`
- [ ] Existing `/bookings` browser voice rehearsal still works after extraction

### Test workbench
- [ ] `/admin/agent-definitions/[id]/test` renders the composite test screen
- [ ] Voice controls: Start / Mute / End with state indicator
- [ ] Live timeline shows events as they happen during the call
- [ ] Escalation state shows badges matching /call-ops behavior
- [ ] Links to full observability and call-ops for deeper inspection
- [ ] Agent definition selector shows draft/published status

### Quality gates
- [ ] `pnpm -C apps/web lint` passes
- [ ] `pnpm -C apps/web check-types` passes
- [ ] `uv run pyright apps/api/src/` passes (0 errors)
- [ ] `uv run pytest apps/api/tests/ -v --tb=short` passes
- [ ] Playwright E2E tests pass for test workbench flow

## Verification

```bash
# Backend
uv run pyright apps/api/src/
uv run pytest apps/api/tests/unit/ -v --tb=short
uv run pytest apps/api/tests/integration/ -v --tb=short -k browser_session

# Frontend
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test
NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
```

## Non-Goals

- No chat/text testing (voice only for now)
- No automated test scripts (human talks to the agent)
- No test result persistence (use observability for post-test review)
- No multi-call comparison (one call at a time)
- No simulated phone numbers / SIP testing (browser WebRTC only)
- No new agent worker capabilities (existing governed ref path is sufficient)

## M33 Impact

**Enables new scope.** Test workbench should support both rail and autonomous agent definitions. For autonomous agents: left panel shows iteration progress, memory saves, skill creation, and compression events alongside the live transcript. Test calls verify that skills are correctly saved and can be recalled. No changes required if focusing on rail agent path only.
