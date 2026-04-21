# M23: Agent Test Workbench — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Platform browser session endpoint | Done | 2026-03-26 |
| T02 | Agent definition resolution for draft configs | Done | 2026-03-26 |
| T03 | Extract BrowserVoiceClient component | Done | 2026-03-26 |
| T04 | Rewire ClinicBrowserVoiceCard as thin wrapper | Done | 2026-03-26 |
| T05 | Test workbench layout + voice panel | Done | 2026-03-26 |
| T06 | Live timeline panel (wire M1.x components) | Done | 2026-03-26 |
| T07 | Escalation state panel (wire M3 components) | Done | 2026-03-26 |
| T08 | E2E tests for test workbench | Done | 2026-03-26 |
| T09 | Deprecate /clinic/browser-session endpoint | Done | 2026-03-26 |

## Notes

Key discovery: agent worker already supports governed agent refs in room metadata
(`agent_definition_id` + `agent_definition_version` + `compiled_hash`).
No voice worker changes needed. The gap is purely API creation + frontend composition.

2026-03-30 hardening:
- The test workbench now keeps the latest completed session visible instead of blanking the screen on call end.
- The live timeline panel now composes existing M1/M8.1 observability pieces instead of a stripped custom event list:
  - latency summary cards from `SupportLatencyMetrics`
  - unified transcript + latency rows from `ConversationTurnRow`
  - non-transcript runtime evidence kept in a separate system-events section
- The right rail now shows persisted recent test runs for the selected version via the existing `/admin/tenants/{tenant_id}/calls/test-history` API, with the current run highlighted and direct observability links.
- Verification for the workbench flow passed in targeted Playwright (`e2e/agent-test-workbench.spec.ts`), including live latency visibility and finalized post-call summary retention.
- Repo-wide UI proof is still blocked by an unrelated hook-order lint failure in `apps/web/src/components/agent-editor/voice-panel.tsx`.

2026-03-31 hardening:
- The latency banner failure on the admin workbench was not a frontend rendering bug. The page was calling the tenant latency route, which rejected the admin session with `403`, so the workbench now uses an admin tenant-scoped latency route for browser test calls.
- Browser test sessions now persist live and final turn-latency metadata through the internal test-runtime path, so the workbench can show actual STT/LLM/TTS timing instead of an empty shell.
- The unrelated hook-order bug in `apps/web/src/components/agent-editor/voice-panel.tsx` is resolved, so the previous harness blocker is gone.
- Targeted verification is green for:
  - backend latency persistence + admin latency retrieval
  - workbench latency route selection
  - retained latest-session timeline after end
  - recent test runs panel
- Repo-wide UI proof is still not fully green. The broader Playwright suite has unrelated existing failures, and `tools/scripts/e2e/run-web-e2e.sh` now fails later in Next.js page-data collection with `PageNotFoundError: Cannot find module for page: /_document`.
