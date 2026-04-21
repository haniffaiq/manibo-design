# M23 Session Prompt: Agent Test Workbench

Start implementing M23 (Agent Test Workbench) on branch feat/M23-agent-test-workbench (create worktree from main).

## Context
- Voice agent testing is currently hardcoded to the `appointment_booking` solution via `POST /clinic/browser-session`. Remove that solution and browser voice testing disappears.
- The agent worker already supports governed agent refs in room metadata (`agent_definition_id` + `agent_definition_version` + `compiled_hash` in `RoomMetadata`). No voice worker changes needed.
- M1.x (observability), M3 (escalation UX), and M12 (workbench composition) are all done — their components are ready to composite into the test workbench.
- This milestone extracts browser voice to the platform layer and builds a single-screen test console for any agent definition.

## Key files to read first
- docs/milestones/M23-agent-test-workbench.md (milestone doc with architecture diagrams and all 9 tasks)
- docs/tasks/M23/PROGRESS.md (task status tracker)
- AGENTS.md (repository guidelines)
- wiki/design-docs/react-best-practices.md (React/Next.js rules)

### Backend (what exists)
- `solutions/appointment_booking/src/appointment_booking/api.py:1542` — current `POST /clinic/browser-session` (to be replaced)
- `solutions/appointment_booking/src/appointment_booking/voice_rehearsal.py` — room naming, metadata building, profile resolution
- `packages/grove-voice-livekit/src/grove_voice_livekit/metadata.py` — `RoomMetadata` dataclass with `agent_definition_id` support (already done)
- `packages/grove-voice-livekit/src/grove_voice_livekit/agent_config_resolver.py:67` — `load_agent_config_for_room_metadata()` resolves governed refs (already done)
- `apps/api/src/platform_api/routes/calls.py` — LiveKit token minting patterns (reuse for new endpoint)
- `apps/api/src/platform_api/routes/admin_agent_definitions.py` — agent definition CRUD (resolve definition + version)

### Frontend (what exists)
- `solutions/appointment_booking/ui/src/components/clinic-browser-voice-card.tsx` — 380-line WebRTC voice client (to be extracted)
- `solutions/appointment_booking/ui/src/livekit-browser-room.ts` — LiveKit Room wrapper (to be extracted)
- `apps/web/src/components/observability/use-live-case-stream.ts` — live SSE timeline (wire into test workbench)
- `apps/web/src/components/call-ops/escalation-badge.tsx` — escalation status badge (wire into test workbench)
- `apps/web/src/components/call-ops/urgent-banner.tsx` — urgent transfer banner (wire into test workbench)
- `apps/web/src/lib/call-ops-escalation.ts` — escalation enrichment logic (reuse for test call)
- `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/page.tsx` — agent definition detail page (test route lives next to this)

## Task execution order

Phase 1 (backend + frontend extraction — independent, can parallel):
  T01 (platform browser session endpoint) — `POST /calls/browser-session` accepting `agent_definition_id`
  T02 (draft agent resolution) — resolve draft configs, not just published
  T03 (extract BrowserVoiceClient) — generic component from clinic-browser-voice-card
  T04 (rewire ClinicBrowserVoiceCard) — thin wrapper delegating to BrowserVoiceClient

Phase 2 (test workbench — depends on Phase 1):
  T05 (workbench layout + voice panel) — `/admin/agent-definitions/[id]/test` page
  T06 (live timeline panel) — wire M1.x components to test call ID
  T07 (escalation state panel) — wire M3 components to test call ID

Phase 3 (tests + cleanup — depends on Phase 2):
  T08 (E2E tests) — Playwright tests for test workbench flow
  T09 (deprecate /clinic/browser-session) — remove after ClinicBrowserVoiceCard rewired

## Critical implementation notes
1. The platform endpoint goes in `apps/api/src/platform_api/routes/browser_voice.py` — deployment-scoped (requireSuperAdmin or requireSession with admin role)
2. Room metadata MUST use governed agent ref (`agent_definition_id` + `version` + `compiled_hash`), NOT `config_path`. The worker resolves it via `load_agent_config_for_room_metadata()`.
3. `BrowserVoiceClient` goes in `apps/web/src/components/browser-voice-client.tsx` — NO solution imports, NO clinic-specific copy
4. The LiveKit browser room wrapper (`livekit-browser-room.ts`) should move to `apps/web/src/lib/livekit-browser-room.ts` or `@grove/web-shared/lib/`
5. Test workbench route: `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/test/page.tsx`
6. All live observation panels scope their data fetching to the single test call ID — no cross-call pollution
7. Preserve existing `/bookings` browser voice rehearsal functionality after extraction — ClinicBrowserVoiceCard must still work
8. OTLP evidence is required in PR body even for frontend-only changes (see CLAUDE.md)
9. File size gate: new files OK, but don't regrow existing files past their baseline ceiling
10. Run `tools/scripts/artifact/artifacts.sh refresh` if API routes change
