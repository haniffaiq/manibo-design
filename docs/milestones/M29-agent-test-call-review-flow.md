# M29: Agent Test Call Review Flow

Status: done
Created: 2026-03-27
Owner: Jakit
Branch: feat/M29-agent-test-call-review
Stream: ui
Depends on: M28 (in progress), M23 (agent test workbench — done)
Reference: M23 test workbench, `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/test/page.tsx`

## Goal

Connect the existing browser voice test workbench to the agent version review flow so reviewers can make test calls before approving or rejecting a version. The test infrastructure (LiveKit browser rooms, WebRTC voice client, live transcript, event timeline) already ships from M23. This milestone wires it into the review lifecycle and adds the missing pieces for a complete review-with-evidence flow.

## What Already Exists

| Component | Path | Status |
|-----------|------|--------|
| Browser voice session API | `apps/api/src/platform_api/routes/browser_voice.py` | Shipped |
| Browser voice client component | `packages/web-shared/src/components/browser-voice-client.tsx` | Shipped |
| LiveKit browser room wrapper | `packages/web-shared/src/lib/livekit-browser-room.ts` | Shipped |
| Test workbench page | `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/test/page.tsx` | Shipped |
| Live transcript + event streams | `apps/api/src/platform_api/routes/browser_voice.py` SSE endpoints | Shipped |
| Test button on version actions | `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/page.tsx` | Shipped (M28) |

## What Is Missing

1. **Version-pinned test calls** — The test workbench currently uses the latest published config. It should accept an explicit `version` parameter so a reviewer tests the exact draft/review version, not whatever is live.

2. **Test call results attached to review** — When a reviewer approves or rejects, the test call IDs and outcomes should be recorded as evidence on the review decision. Currently the review API accepts a `reason` string but no structured test evidence.

3. **Test call summary on version detail** — The version expansion panel should show recent test calls (call ID, duration, outcome) for that version so the reviewer can reference them.

4. **Agent worker config override for test rooms** — The browser session API creates a room with agent definition metadata. The agent worker needs to pick up the version-specific config (not just the published config) when the room is a test room. Verify this path works end-to-end.

5. **Test call recording retention** — Test calls should be flagged as test usage (not production) for billing and retention purposes. The room metadata already includes test markers but verify downstream handling.

## Design Decisions

1. **Version parameter on test page** — Add `?version=N` to the test workbench URL. The browser session API already accepts `agent_definition_version`. Wire it through.

2. **Structured test evidence on review** — Extend the review API to accept `test_call_ids: list[str]` alongside the existing `reason` field. The UI collects call IDs from completed test calls and submits them with the review decision.

3. **No mandatory test gate** — Test calls are encouraged but not required for review approval. Enforcement comes later if needed via policy packs.

4. **Reuse existing test workbench** — No new pages. The existing test page gains version awareness. The version detail page gains a test call summary section.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Wire version parameter through test workbench and browser session | done | none |
| T02 | Show test call summary on version detail panel | done | T01 |
| T03 | Attach test call IDs to review decision API | done | T01 |
| T04 | Verify agent worker picks up version-specific config for test rooms | done (already wired) | T01 |
| T05 | Verification: end-to-end test call review flow | done | T01, T02, T03, T04 |

## Acceptance Criteria

- [x] Test workbench accepts `?version=N` and creates browser sessions with that version's config.
- [x] Agent worker serves the version-specific config in test rooms, not the published config.
- [x] Version detail panel shows recent test calls for that version.
- [x] Review decision can include test call IDs as structured evidence.
- [x] Test calls are flagged as test usage in room metadata.
- [x] Existing test workbench functionality (voice, transcript, timeline) remains intact.

## Verification

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test -- tests/admin-agent-definitions-api.test.ts
uv run pyright apps/api/src/platform_api/routes/browser_voice.py
uv run ruff check apps/api/src/platform_api/routes/browser_voice.py
uv run pytest apps/api/tests/integration/test_browser_voice.py -q --tb=short
```

Manual proof: create a draft version, open the test workbench with `?version=N`, make a test call, hear agent response, then approve the version with the test call ID attached.

## Non-Goals

- No automated quality gates (eval scoring, regression detection).
- No multi-reviewer approval flow.
- No test call scheduling or batch testing.
- No changes to the voice pipeline or LiveKit integration.
