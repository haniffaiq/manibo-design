# M4: VOX Phase 1 -- Public Chat Widget

Status: not started
Created: 2026-03-20
Owner: Jakit
Branch: feat/M4-vox-public-chat-widget
Stream: v2
Depends on: none (can parallel with M3)
Reference: docs/requirements/vox.md (REQ-S01, REQ-S02, REQ-S04), docs/requirements/checklist.md rows 125, 127-128, 136

## Goal

Live chat widget on vox-sprachschule.ch with 24/7 conversational engagement in 6 languages. Anonymous visitors open the widget, have a conversation with the WSA agent, and receive streaming responses. Sessions persist across page navigations. This is the V2 Phase 3 minimal slice required for VOX launch, not the full managed web-chat runtime track.

## Design Decisions

1. **Public ingress is a separate middleware stack** -- no tenant auth required for widget visitors; guest sessions use ephemeral tokens.
2. **SSE for agent responses** -- chat messages stream via SSE, matching existing voice-channel streaming patterns.
3. **Widget is an embeddable component** -- ships as a script tag for vox-sprachschule.ch, not a full SPA.
4. **Session persistence via localStorage + server session** -- guest session ID stored client-side, server validates and resumes.
5. **Language detection from browser locale** -- initial language from `Accept-Language` header, switchable in widget.
6. **M4 is the minimal product slice, not the runtime-ops milestone** -- runtime lifecycle state, operator health, provider account/runtime governance, and restart/backoff live in M14.1-M14.2.

## Related Future Work

- [M14.1: Channel Runtime Foundations](M14.1-channel-runtime-foundations.md)
- [M14.2: Web Chat Runtime Operations](M14.2-web-chat-runtime-operations.md)

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Public ingress middleware | not started | none |
| T02 | Widget bootstrap endpoint | not started | T01 |
| T03 | Guest session management | not started | T01 |
| T04 | Chat message send/receive | not started | T02, T03 |
| T05 | SSE streaming for agent responses | not started | T04 |
| T06 | Chat history endpoint | not started | T03 |
| T07 | Widget embed component | not started | T04, T05 |
| T08 | Multilingual support (6 languages) | not started | T07 |
| T09 | E2E tests | not started | T01-T08 |
| T10 | Evaluate LiveKit AgentChatIndicator for typing/thinking state | not started | T07 |

## Acceptance Criteria

- [ ] Anonymous user can open widget on a page without authentication
- [ ] User can send a message and receive a streaming agent response
- [ ] Conversation persists across page navigations within the same browser session
- [ ] Agent responds in the user's detected/selected language (de, en, fr, it, es, ru)
- [ ] Widget loads via a single `<script>` tag embed
- [ ] `uv run pytest` passes for public ingress and session management
- [ ] `pnpm -C apps/web lint && pnpm -C apps/web check-types` passes
- [ ] Playwright E2E tests cover widget open, message send, response receive

## Verification

```bash
uv run pytest apps/api/tests/ -k "public_ingress or guest_session or chat" -v --tb=short
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
# Widget E2E spec will be created as part of M4 tasks
NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
```

## Non-Goals

- No authenticated user chat (this is public/anonymous only)
- No voice channel in the widget (chat only)
- No CRM integration from the widget (that is M6)
- No knowledge base integration (that is M5)
- No managed channel runtime lifecycle, restart/backoff, or operator-grade runtime health (that is M14.1-M14.2)

## M33 Impact

**Requires adaptation.** M33 enables running WSA as an autonomous agent (while loop + memory + skills) instead of a rail agent (LangGraph flow). The chat widget itself (SSE streaming, session persistence) is channel-agnostic and unchanged. Product decision: should WSA be rail (prescriptive flow) or autonomous (LLM-driven, self-improving)? Rail path remains default.
