# Agent Builder Rebuild — Design

**Date:** 2026-04-16
**Scope:** `/admin/agent-definitions/*` area in `web/`
**Reference:** Vapi dashboard (https://dashboard.vapi.ai/assistants/...)

## Goal

Replace the existing `/admin/agent-definitions` area with a Vapi-inspired
3-column workbench: existing app sidebar + tenant-scoped assistants list +
compact detail panel with tabs. Add an integrated, slide-down live test panel
triggered from the detail header. Optimised for super admin browsing /
configuring agents in a multi-tenant environment.

## Non-Goals

- No backend rewrite — runs against the mock dispatcher
  (`web/src/lib/mock/dispatcher.ts`) and existing platform API contracts.
- No mobile / tablet support (desktop-first, ≥1280px).
- No real LiveKit calls — live test is a simulated stream behind a
  `useTestStream()` interface, so a future swap to real LiveKit is one line.
- No removal of the existing admin shell (left sidebar, breadcrumbs).

## Layout

### Outer shell

- Existing `AdminPageShell` left sidebar (unchanged).
- New 2-column inner layout inside the page:
  - Assistants list — fixed `320px` wide.
  - Detail panel — `flex-1`.

### Middle column — Assistants list

- Header:
  - Tenant selector dropdown ("Tenant: Northstar Mobility ▾").
    Switching tenant refreshes the list and clears the current selection.
  - Search box (filters list by agent name).
  - "+ Create" button (opens the create modal).
- List rows:
  - Agent name (primary).
  - Secondary line: `<provider> · <voice> · v<published_version>`.
  - Status dot (Draft / In Review / Published / Retired).
- Empty states:
  - No tenant selected → "Select a tenant" placeholder.
  - Tenant selected, no agents → "No assistants yet" + prominent
    "+ Create Assistant" CTA.
- Footer: count "N assistants".

### Right pane — Detail panel

**Header strip:**

- Agent name + copyable ID (small).
- Status pill (Draft / In Review / Published / Retired).
- Version selector (dropdown of versions, e.g. "v8 published ▾").
- Cost/min strip + Latency strip (two small badge cards, like Vapi).
- "Talk" button (green, opens live test panel).
- More menu: Publish / Archive / Duplicate / Delete.

**Tabs (5):**

1. **Model**
   - Provider dropdown (OpenAI / Anthropic / Google).
   - Model dropdown — filtered by provider:
     - OpenAI: GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4-turbo
     - Anthropic: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
     - Google: Gemini 1.5 Pro, Gemini 1.5 Flash
   - First Message Mode dropdown (Assistant speaks first / User speaks first /
     Wait for greeting).
   - First Message (textarea).
   - System Prompt (textarea + "Generate" button — mock returns a canned prompt).

2. **Voice**
   - TTS provider dropdown (Azure / ElevenLabs / OpenAI TTS).
   - Voice dropdown — filtered by provider:
     - Azure: id-ID-ArdiNeural, id-ID-GadisNeural, en-US-JennyNeural,
       en-US-GuyNeural
     - ElevenLabs: Rachel, Antoni, Bella, Adam
     - OpenAI TTS: alloy, echo, fable, onyx, nova, shimmer
   - Language dropdown (id-ID / en-US).
   - "Preview" button (plays a short cached sample line).

3. **Tools**
   - Table of currently-active tools: name, description, on/off toggle.
   - "+ Add tool" button → drawer with the catalog (lookup_slots,
     create_booking, send_sms, transfer_to_human, lookup_customer).
   - Click row → expand inline config (parameters, JSON schema preview).

4. **Analysis**
   - Summary prompt (textarea).
   - Success criteria (textarea).
   - Structured data extraction table: field name, JSON path, type
     (string / number / boolean / enum). "+ Add field" appends a row.

5. **Advanced**
   - Transcriber: STT provider/model (Deepgram nova-2 / OpenAI Whisper / Azure)
     + language detection toggle.
   - Recording retention (slider, 1–365 days).
   - PII redaction toggle.
   - Raw YAML view (collapsible at bottom, read-only by default with an
     "Edit raw" toggle).

**Save behavior:**

- Explicit "Save" button (creates a new draft version).
- Sticky bottom bar appears when there are unsaved changes:
  "Unsaved changes" pill on the left, "Discard" + "Save" buttons on the right.

### Live Test Panel (slide-down from header)

Triggered by the "Talk" button. Sticky below the header strip, with a close
(×) button. Layout:

```
┌────────────────────────────────────────────────────────────────────┐
│ [🎤 mic] [📞 end] 🔴 02:14   provider: openai · voice: ardi   [×] │
├──────────────────┬───────────────────┬─────────────────────────────┤
│ MIC waveform     │ Transcript        │ Event log                   │
│ ▁▂▃▅▆▅▃▂▁       │ User: "halo..."   │ 02:14 stt.start             │
│                  │ Agent: "selamat   │ 02:13 llm.start             │
│ AGENT waveform   │ pagi, ada yang.." │ 02:12 call.up               │
│ ▁▃▅▇▆▅▃▁        │ User: "saya mau.."│ 02:11 session.created       │
└──────────────────┴───────────────────┴─────────────────────────────┘
[ ▶ ━━━━━━━━━━━━ 03:45 / 04:12 ]   recordings: ▾ call_01JCALL0099
```

- Top bar: mic toggle, end-call, elapsed timer, current provider/voice, close.
- Left col (~25%): mic + agent waveforms (canvas).
- Mid col (flex): live transcript chat bubbles (user / agent alternating).
- Right col (~30%): event log feed (timestamp + event type + summary).
- Bottom: recording playback strip (wavesurfer scrubber + dropdown of past
  recordings).

In mock mode the panel uses `useMockTestStream()` which emits a scripted
sequence of transcript turns + log events over ~30s; the recording playback
loads a sample audio asset bundled in `public/mock-recordings/`.

### Create Assistant Modal (3-step wizard)

- Step 1 — pick template (grid of 4 cards):
  Booking Assistant, Driver Verification, Lead Capture, Blank.
- Step 2 — name + bahasa (id-ID / en-US) + tenant
  (pre-filled from current selection).
- Step 3 — review & create.
- On submit: new agent inserted at top of list, detail switches to it,
  status "Draft v1".

## Data / API

All data flows through the existing `platformApiRequest` pipeline → mock
dispatcher. New mock fixtures live in `src/lib/mock/agent-builder-fixtures.ts`
and are wired into `src/lib/mock/dispatcher.ts`.

**New mock fixtures:**

- `modelProviderCatalog` — OpenAI / Anthropic / Google with per-provider
  model lists.
- `voiceProviderCatalog` — Azure / ElevenLabs / OpenAI TTS with per-provider
  voice lists.
- `transcriberProviderCatalog` — Deepgram / OpenAI Whisper / Azure.
- `toolCatalog` — lookup_slots, create_booking, send_sms, transfer_to_human,
  lookup_customer (each with description, parameters JSON schema).
- `agentTemplates` — Booking Assistant, Driver Verification, Lead Capture,
  Blank. Each template defines default model, voice, prompt, tools.
- `liveTestStream` — scripted array of `{ delayMs, kind, payload }` frames
  for the simulated test session.
- `mockRecordings` — list of `{ id, callId, durationMs, signedUrl }` pointing
  at sample audio files in `public/mock-recordings/`.

**New dispatcher routes:**

- `GET /admin/model-providers` → `modelProviderCatalog`
- `GET /admin/voice-providers` → `voiceProviderCatalog`
- `GET /admin/transcriber-providers` → `transcriberProviderCatalog`
- `GET /admin/tool-catalog` → `toolCatalog` (replaces the empty
  `/admin/agent-starters` stub)
- `GET /admin/agent-templates` → `agentTemplates`

**New API client module:** `src/lib/api/agent-builder-catalogs.ts` exporting
`getModelProviders`, `getVoiceProviders`, `getTranscriberProviders`,
`getToolCatalog`, `getAgentTemplates`.

## Component breakdown

```
web/src/app/(deployment)/admin/agent-definitions/
  page.tsx                       (rewrite — 2-column shell)
  components/
    assistant-list.tsx
    tenant-selector.tsx
    create-assistant-modal.tsx
    detail-panel.tsx
    detail-header.tsx
    cost-latency-strip.tsx
    unsaved-bar.tsx
    tabs/
      model-tab.tsx
      voice-tab.tsx
      tools-tab.tsx
      tool-picker-drawer.tsx
      analysis-tab.tsx
      advanced-tab.tsx
    live-test/
      live-test-panel.tsx
      voice-controls.tsx
      waveform-pair.tsx
      live-transcript.tsx
      event-log.tsx
      recording-playback.tsx
      use-mock-test-stream.ts
web/src/lib/api/
  agent-builder-catalogs.ts       (new)
web/src/lib/mock/
  agent-builder-fixtures.ts       (new)
web/public/mock-recordings/
  sample-call-01.mp3              (new — short pre-recorded sample)
```

## Existing files repurposed / removed

- `[id]/test/page.tsx` (592 lines) — removed; functionality replaced by the
  in-page Live Test panel. Route `/admin/agent-definitions/[id]/test` 308s
  redirects to `/admin/agent-definitions/[id]?live=1`.
- `[id]/page.tsx` — removed; the new shell is single-page with deep-link
  `?id=<defId>&tenant_id=<tid>`.
- `structured-agent-editor.tsx` + `structured-agent-editor-form.tsx` +
  `structured-agent-editor-yaml.ts` + `version-history.tsx` +
  `yaml-flow-preview.tsx` — keep, surface inside the **Advanced** tab's
  collapsible "Raw YAML" section.

## Test plan

- **Visual smoke:** each tab renders with mock data, no console errors,
  no React hydration mismatches.
- **Flow:** tenant select → list updates → click agent → detail loads
  → switch tab → state preserved → Talk → live test panel slides in
  → mock stream produces transcript + log + recording → close panel.
- **Create:** + Create → wizard step 1 → step 2 → step 3 → submit
  → new agent appears at top of list and is selected, detail in Draft v1.
- **Edge cases:** empty tenant, empty agent list, no published version,
  archived agent (read-only mode).
- **Existing pages unaffected:** all other `/admin/*` pages still 200 OK
  after the rewrite.

## Open items / risks

- **LiveKit integration.** `createBrowserVoiceSession` and friends already
  exist for real LiveKit calls. The new `useTestStream(callId)` hook returns
  the same shape regardless of mode (real vs mock); `GROVE_USE_MOCK_API`
  flag chooses the implementation. When swapping later, only the hook body
  changes.
- **Catalog endpoints not in real backend.** This design treats model /
  voice / transcriber / tool / template catalogs as platform-managed
  defaults. The real backend will need matching endpoints later.
- **Sample recording asset.** Need a short (≤5s) royalty-free MP3 in
  `public/mock-recordings/` to drive the playback strip — placeholder will
  be added during implementation; final asset can be swapped.
