# Agent Builder Design Pack

Production design reference for the agent definition workbench — a Vapi-inspired single-page builder for configuring, testing, and managing voice AI assistants in a multi-tenant platform.

**Reference UI:** [Vapi Dashboard](https://dashboard.vapi.ai/assistants/)

---

## 1. Layout

### 1.1 Overall Structure

Route: `/admin/agent-definitions` inside the deployment admin shell.

```
┌──────────┬────────────────────┬──────────────────────────────────────┐
│ Admin    │  Assistants List   │  Detail Panel                        │
│ Sidebar  │  (320px fixed)     │  (flex-1)                            │
│ (shell)  │                    │                                      │
│          │  ┌──────────────┐  │  ┌────────────────────────────────┐  │
│          │  │ Tenant ▾     │  │  │ Header: name · status · Talk  │  │
│          │  │ Search...    │  │  ├────────────────────────────────┤  │
│          │  │ + Create     │  │  │ Tabs: Model│Voice│Tools│...   │  │
│          │  ├──────────────┤  │  ├────────────────────────────────┤  │
│          │  │ · Agent A    │  │  │ Tab content (scrollable)       │  │
│          │  │ · Agent B ◄──│──│──│                                │  │
│          │  │ · Agent C    │  │  │                                │  │
│          │  ├──────────────┤  │  ├────────────────────────────────┤  │
│          │  │ 3 assistants │  │  │ Unsaved bar (sticky bottom)   │  │
│          │  └──────────────┘  │  └────────────────────────────────┘  │
└──────────┴────────────────────┴──────────────────────────────────────┘
```

Desktop-first (≥1280px). Backoffice admin tool — no mobile layout required.

### 1.2 URL State

| Param | Purpose |
|---|---|
| `?tenant_id=<id>` | Currently selected tenant (drives the list) |
| `?id=<defId>` | Currently selected assistant (drives the detail) |
| `?live=1` | Open the Test tab by default |

---

## 2. Middle Column — Assistants List

### 2.1 Header

- **Tenant selector** dropdown. Switching tenant refreshes the list and clears agent selection.
- **Search box** — client-side filter by agent name.
- **"+ Create" button** — opens the Create Assistant modal.

### 2.2 List Rows

- Status dot: green (published), amber (draft), gray (retired)
- Agent name (primary, truncated)
- Secondary: `v<published_version> · <status>`
- Active row: left accent border (3px primary)

### 2.3 Empty States

| State | Display |
|---|---|
| No tenant selected | "Select a tenant" |
| 0 agents | "No assistants yet" + "+ Create Assistant" CTA |
| Search no match | "No matches" |

### 2.4 Footer

Count: "N assistants"

---

## 3. Detail Panel

### 3.1 Header Strip

- Agent name + copyable ID (monospace, click → "copied!")
- Status pill Badge: Draft / In Review / Published / Retired
- Version selector dropdown
- Cost strip: `~$0.14 /min`
- Latency strip: `~1150 ms`
- **Talk** button (green) — toggles to Test tab
- Overflow menu: Publish, Duplicate, Archive, Delete

### 3.2 Tabs

6 tabs: **Model** | **Voice** | **Tools** | **Analysis** | **Advanced** | **Test**

### 3.3 Save Behavior

Explicit save. Sticky bottom bar when dirty:
- Left: amber dot + "Unsaved changes"
- Right: Discard (ghost) + Save as new draft (primary)

Save → `POST /api/platform/admin/tenants/<tid>/agent-definitions/<id>/versions` with serialized config.

---

## 4. Tab Specs

### 4.1 Model Tab

| Field | Type | Notes |
|---|---|---|
| Provider | Dropdown | Fetched from `GET /api/platform/admin/model-providers` |
| Model | Dropdown | Filtered by selected provider |
| First Message Mode | Dropdown | assistant_speaks_first / user_speaks_first / wait_for_greeting |
| First Message | Textarea (2 rows) | |
| System Prompt | Textarea (10 rows, mono) | "Generate" button calls `POST /api/platform/admin/agent-prompt-generate` |
| Temperature | Slider 0.00–1.00 | |

Changing provider auto-selects first model of that provider.

### 4.2 Voice Tab

| Field | Type | Notes |
|---|---|---|
| TTS Provider | Dropdown | Fetched from `GET /api/platform/admin/voice-providers` |
| Voice | Dropdown | Filtered by provider |
| Language | Dropdown | id-ID / en-US |
| Preview | Button | Calls `POST /api/platform/admin/voice-preview` → plays returned audio |

Changing provider auto-selects first voice.

### 4.3 Tools Tab

Active tools list with per-tool:
- Category icon, name (mono), description, category label
- Enable/disable Switch
- Remove (×)
- Click row → expand to show parameter schema

"+ Add tool" → **Tool Picker Drawer** (slide-over):
- Search, checkbox multi-select from catalog
- Catalog fetched from `GET /api/platform/admin/tool-catalog`
- Footer: count + Cancel / Add buttons

### 4.4 Analysis Tab

| Field | Type |
|---|---|
| Summary prompt | Textarea |
| Success criteria | Textarea |
| Structured data extraction | Editable table: field name / JSON path / type (string/number/boolean/enum) / remove |

"+ Add field" appends row.

### 4.5 Advanced Tab

**Transcriber (STT):**
| Field | Type | Notes |
|---|---|---|
| STT Provider | Dropdown | Fetched from `GET /api/platform/admin/transcriber-providers` |
| Model | Dropdown | Filtered by provider |
| Auto-detect language | Toggle | |

**Recording & Compliance:**
| Field | Type |
|---|---|
| Recording retention | Slider 1–365 days |
| PII redaction | Toggle |

**Raw YAML** (collapsible):
- Read-only YAML preview of the full working config
- "Edit raw" toggle for power-user direct YAML editing

### 4.6 Test Tab

Full-tab live test powered by LiveKit browser voice sessions.

```
┌──────────────────────────────────────────────────────────────┐
│ [▶ Start]  🔴 02:14  provider: openai · ardi                │
├──────────────────────────────┬───────────────────────────────┤
│ Transcript (flex)            │ Event log (320px)             │
│                              │                               │
│ AGENT  00:03                 │ 00:00  session.created         │
│ Halo, terima kasih...        │ 00:03  tts.spoken              │
│                              │ 00:10  stt.final               │
│ USER   00:10                 │ 00:14  tool.lookup_slots       │
│ Saya mau buat janji...       │ 00:28  latency.spike           │
│                              │ 00:53  transfer_to_human       │
├──────────────────────────────┴───────────────────────────────┤
│ [▶] ━━━━━━━━━━━━ 03:45 / 04:12  Recording: ▾ call_0099      │
└──────────────────────────────────────────────────────────────┘
```

**Controls bar** (dark bg):
- Start / End call / Mic toggle
- Recording indicator + elapsed timer
- Provider + voice label

**Transcript column** (flex): chat bubbles, auto-scroll, role + timestamp + text

**Event log column** (320px, dark terminal): monospace, timestamp | event_type | summary

**Recording playback bar** (bottom): play/pause, scrubber, duration, recording selector

---

## 5. Create Assistant Modal

3-step wizard:

### Step 1 — Pick template

Grid of cards. Templates fetched from `GET /api/platform/admin/agent-templates`.

Default templates:

| Template | Default Model | Default Voice | Default Tools |
|---|---|---|---|
| Blank | GPT-4o mini | Azure Gadis (id-ID) | — |
| Booking Assistant | GPT-4o | Azure Gadis (id-ID) | lookup_slots, create_booking, send_sms, transfer_to_human |
| Driver Verification | GPT-4o | Azure Ardi (id-ID) | lookup_customer, transfer_to_human |
| Lead Capture | Claude 3.5 Haiku | ElevenLabs Rachel (en-US) | lookup_customer, send_sms, transfer_to_human |

### Step 2 — Name + language + tenant

- Assistant name (pre-filled from template)
- Language: id-ID / en-US (from template)
- Tenant (pre-filled from current selection)

### Step 3 — Review & create

Summary card. Submit → `POST /api/platform/admin/tenants/<tid>/agent-definitions`

On success: new agent appears at top of list, auto-selected, status "Draft v1".

---

## 6. Backend API Contract

All endpoints proxied through the Next.js BFF at `/api/platform/*` → upstream platform API. Requests include `Authorization: Bearer <token>` from the session cookie.

### 6.1 Catalog Endpoints (read-only)

These serve dropdown options for the builder UI. Cached aggressively (SWR with long `revalidateOnFocus: false`).

#### `GET /admin/model-providers`

Returns the list of LLM providers and their available models.

```json
[
  {
    "id": "openai",
    "label": "OpenAI",
    "models": [
      { "id": "gpt-4o", "label": "GPT-4o", "context_window": 128000 },
      { "id": "gpt-4o-mini", "label": "GPT-4o mini", "context_window": 128000, "notes": "Lower cost" },
      { "id": "gpt-4.1", "label": "GPT-4.1", "context_window": 1000000, "notes": "Long context" },
      { "id": "gpt-4-turbo", "label": "GPT-4 Turbo", "context_window": 128000 }
    ]
  },
  {
    "id": "anthropic",
    "label": "Anthropic",
    "models": [
      { "id": "claude-3-5-sonnet", "label": "Claude 3.5 Sonnet", "context_window": 200000 },
      { "id": "claude-3-5-haiku", "label": "Claude 3.5 Haiku", "context_window": 200000, "notes": "Fastest" },
      { "id": "claude-3-opus", "label": "Claude 3 Opus", "context_window": 200000 }
    ]
  },
  {
    "id": "google",
    "label": "Google",
    "models": [
      { "id": "gemini-1.5-pro", "label": "Gemini 1.5 Pro", "context_window": 2000000, "notes": "Long context" },
      { "id": "gemini-1.5-flash", "label": "Gemini 1.5 Flash", "context_window": 1000000, "notes": "Fastest" }
    ]
  }
]
```

#### `GET /admin/voice-providers`

```json
[
  {
    "id": "azure",
    "label": "Azure",
    "voices": [
      { "id": "id-ID-ArdiNeural", "label": "Ardi", "gender": "male", "language": "id-ID" },
      { "id": "id-ID-GadisNeural", "label": "Gadis", "gender": "female", "language": "id-ID" },
      { "id": "en-US-JennyNeural", "label": "Jenny", "gender": "female", "language": "en-US" },
      { "id": "en-US-GuyNeural", "label": "Guy", "gender": "male", "language": "en-US" }
    ]
  },
  {
    "id": "elevenlabs",
    "label": "ElevenLabs",
    "voices": [
      { "id": "rachel", "label": "Rachel", "gender": "female", "language": "en-US" },
      { "id": "antoni", "label": "Antoni", "gender": "male", "language": "en-US" },
      { "id": "bella", "label": "Bella", "gender": "female", "language": "en-US" },
      { "id": "adam", "label": "Adam", "gender": "male", "language": "en-US" }
    ]
  },
  {
    "id": "openai_tts",
    "label": "OpenAI TTS",
    "voices": [
      { "id": "alloy", "label": "Alloy", "gender": "neutral", "language": "en-US" },
      { "id": "echo", "label": "Echo", "gender": "male", "language": "en-US" },
      { "id": "fable", "label": "Fable", "gender": "neutral", "language": "en-US" },
      { "id": "onyx", "label": "Onyx", "gender": "male", "language": "en-US" },
      { "id": "nova", "label": "Nova", "gender": "female", "language": "en-US" },
      { "id": "shimmer", "label": "Shimmer", "gender": "female", "language": "en-US" }
    ]
  }
]
```

#### `GET /admin/transcriber-providers`

```json
[
  {
    "id": "deepgram",
    "label": "Deepgram",
    "models": [
      { "id": "nova-2", "label": "Nova-2", "notes": "Best accuracy" },
      { "id": "nova-2-conversationalai", "label": "Nova-2 Conversational" },
      { "id": "enhanced", "label": "Enhanced" }
    ]
  },
  {
    "id": "openai_whisper",
    "label": "OpenAI Whisper",
    "models": [{ "id": "whisper-1", "label": "Whisper-1" }]
  },
  {
    "id": "azure_stt",
    "label": "Azure Speech",
    "models": [
      { "id": "azure-stt-standard", "label": "Standard" },
      { "id": "azure-stt-conversational", "label": "Conversational" }
    ]
  }
]
```

#### `GET /admin/tool-catalog`

```json
[
  {
    "id": "lookup_slots",
    "name": "lookup_slots",
    "category": "scheduling",
    "description": "Find open clinic appointment slots for a given date range and specialty.",
    "icon": "calendar",
    "params": [
      { "name": "specialty", "type": "string", "required": true, "description": "Medical specialty." },
      { "name": "city", "type": "string", "required": false, "description": "Filter by city." },
      { "name": "from_date", "type": "string", "required": true, "description": "ISO date, inclusive." },
      { "name": "to_date", "type": "string", "required": true, "description": "ISO date, inclusive." }
    ]
  },
  {
    "id": "create_booking",
    "name": "create_booking",
    "category": "scheduling",
    "description": "Create a confirmed booking for the caller.",
    "icon": "calendar-plus",
    "params": [
      { "name": "slot_id", "type": "string", "required": true, "description": "Slot identifier." },
      { "name": "patient_name", "type": "string", "required": true, "description": "Caller's full name." },
      { "name": "patient_phone", "type": "string", "required": true, "description": "Phone in E.164." },
      { "name": "notes", "type": "string", "required": false, "description": "Free-form note." }
    ]
  },
  {
    "id": "send_sms",
    "name": "send_sms",
    "category": "messaging",
    "description": "Send an SMS confirmation or reminder.",
    "icon": "message",
    "params": [
      { "name": "phone", "type": "string", "required": true, "description": "Recipient phone E.164." },
      { "name": "body", "type": "string", "required": true, "description": "SMS body, 1-320 chars." }
    ]
  },
  {
    "id": "transfer_to_human",
    "name": "transfer_to_human",
    "category": "handoff",
    "description": "Hand off the call to a live operator queue.",
    "icon": "user-headset",
    "params": [
      { "name": "queue", "type": "enum", "required": true, "description": "Queue id.", "enumValues": ["clinic-front-desk", "billing", "vip"] },
      { "name": "reason", "type": "string", "required": false, "description": "Escalation reason." }
    ]
  },
  {
    "id": "lookup_customer",
    "name": "lookup_customer",
    "category": "lookup",
    "description": "Look up a customer by phone or email.",
    "icon": "search",
    "params": [
      { "name": "phone", "type": "string", "required": false, "description": "Phone E.164." },
      { "name": "email", "type": "string", "required": false, "description": "Email address." }
    ]
  }
]
```

#### `GET /admin/agent-templates`

```json
[
  {
    "id": "tpl_blank",
    "name": "Blank",
    "tagline": "Start from scratch",
    "description": "An empty assistant with sensible defaults.",
    "icon": "file",
    "defaults": {
      "model_provider": "openai",
      "model_id": "gpt-4o-mini",
      "voice_provider": "azure",
      "voice_id": "id-ID-GadisNeural",
      "language": "id-ID",
      "first_message_mode": "assistant_speaks_first",
      "first_message": "Halo, ada yang bisa saya bantu?",
      "system_prompt": "You are a helpful voice assistant. Speak in clear, friendly Bahasa Indonesia.",
      "tools": []
    }
  }
]
```

### 6.2 Agent Definition CRUD

#### `GET /admin/tenants/{tenant_id}/agent-definitions?limit=500&offset=0`

Returns `AdminAgentDefinitionSummary[]`:

```json
[
  {
    "id": "agent_001",
    "tenant_id": "ten_01JTNORTHSTAR0001",
    "name": "Northstar Driver Verifier",
    "status": "published",
    "published_version": 8,
    "created_at": "2026-02-01T08:00:00Z",
    "updated_at": "2026-04-16T05:21:00Z"
  }
]
```

#### `GET /admin/tenants/{tenant_id}/agent-definitions/{id}`

Returns single `AdminAgentDefinitionSummary`.

#### `POST /admin/tenants/{tenant_id}/agent-definitions`

Create new agent definition.

Request:
```json
{
  "name": "My Assistant",
  "template_id": "tpl_booking",
  "language": "id-ID"
}
```

Response: `AdminAgentDefinitionSummary` with `status: "draft"`, `published_version: null`.

#### `GET /admin/tenants/{tenant_id}/agent-definitions/{id}/versions`

Returns `AdminAgentDefinitionVersionDetail[]`:

```json
[
  {
    "id": "agent_001_v8",
    "agent_definition_id": "agent_001",
    "tenant_id": "ten_01JTNORTHSTAR0001",
    "version": 8,
    "status": "published",
    "source_yaml": "name: Northstar Driver Verifier\nlanguage: id-ID\n...",
    "source_yaml_hash": "yamlhash_v8",
    "compiled_hash": "compiledhash_v8",
    "created_at": "2026-04-15T08:40:00Z",
    "published_at": "2026-04-16T05:21:00Z"
  }
]
```

#### `POST /admin/tenants/{tenant_id}/agent-definitions/{id}/versions`

Create new draft version (the "Save" action).

Request:
```json
{
  "source_yaml": "<serialized AgentBuilderConfig as YAML>"
}
```

Response: new `AdminAgentDefinitionVersionDetail` with `status: "draft"`.

#### `POST /admin/tenants/{tenant_id}/agent-definitions/{id}/versions/{version}/publish`

Publish a version. Response: updated version detail with `status: "published"`.

### 6.3 Live Test — Browser Voice Session

The Test tab creates real voice calls through LiveKit.

#### `POST /admin/tenants/{tenant_id}/agent-definitions/{id}/browser-voice-session`

Creates a browser voice session for testing.

Request:
```json
{
  "version": 4,
  "compiled_hash": "compiledhash_v4"
}
```

Response:
```json
{
  "call_id": "call_01JTEST0001",
  "livekit_url": "wss://livekit.platform.example/rtc",
  "livekit_token": "<participant JWT>",
  "agent_participant_name": "agent",
  "user_participant_name": "browser-user"
}
```

**Frontend connects to LiveKit room** using `livekit-client` SDK:
1. Create `Room` → connect with token
2. Subscribe to agent audio track → play through speakers
3. Publish local mic track → agent hears user
4. Listen to data channel messages for real-time events (transcript turns, tool calls, log entries)

#### `DELETE /admin/tenants/{tenant_id}/agent-definitions/{id}/browser-voice-session/{call_id}`

Cleanup/end the browser voice session.

#### Real-time Event Stream

During an active call, the platform pushes events via LiveKit data channel (or WebSocket fallback at `GET /admin/tenants/{tenant_id}/agent-definitions/{id}/browser-voice-session/{call_id}/events`).

Event shape:
```json
{
  "kind": "transcript",
  "speaker": "agent",
  "text": "Halo, terima kasih sudah menelepon.",
  "occurred_at_ms": 3000
}
```

```json
{
  "kind": "tool",
  "event_type": "tool.lookup_slots.start",
  "summary": "Looking up slots for Friday.",
  "occurred_at_ms": 14000,
  "duration_ms": 980
}
```

```json
{
  "kind": "log",
  "event_type": "call.ended",
  "summary": "Call ended normally.",
  "occurred_at_ms": 63000
}
```

#### Test Call History

`GET /admin/tenants/{tenant_id}/calls/test-history?agent_definition_id={id}&version={v}&limit=5`

Returns recent test calls for the recording playback dropdown:

```json
[
  {
    "call_id": "call_01JTEST0001",
    "version": 4,
    "duration_ms": 252000,
    "created_at": "2026-04-16T09:32:00Z",
    "recording_status": "available",
    "recording_signed_url_path": "/recordings/call_01JTEST0001/signed"
  }
]
```

#### Voice Preview

`POST /admin/voice-preview`

Request:
```json
{
  "provider": "azure",
  "voice_id": "id-ID-GadisNeural",
  "text": "Halo, ada yang bisa saya bantu hari ini?"
}
```

Response: `audio/mpeg` stream (short sample).

### 6.4 Prompt Generation

`POST /admin/agent-prompt-generate`

Request:
```json
{
  "template_id": "tpl_booking",
  "language": "id-ID",
  "context": "Clinic appointment scheduling for dermatology patients"
}
```

Response:
```json
{
  "system_prompt": "You are a clinic scheduling assistant. Help callers find and confirm appointment slots..."
}
```

---

## 7. TypeScript Types

### 7.1 Working Config (frontend state)

```typescript
type FirstMessageMode = "assistant_speaks_first" | "user_speaks_first" | "wait_for_greeting";

interface AgentBuilderConfig {
  model: {
    provider: string;
    model: string;
    first_message_mode: FirstMessageMode;
    first_message: string;
    system_prompt: string;
    temperature: number;        // 0.00–1.00
  };
  voice: {
    provider: string;
    voice: string;
    language: string;           // "id-ID" | "en-US"
  };
  tools: Array<{
    id: string;
    enabled: boolean;
    overrides: Record<string, string>;
  }>;
  analysis: {
    summary_prompt: string;
    success_criteria: string;
    fields: Array<{
      name: string;
      json_path: string;
      type: "string" | "number" | "boolean" | "enum";
    }>;
  };
  advanced: {
    transcriber_provider: string;
    transcriber_model: string;
    language_detection: boolean;
    recording_retention_days: number;
    pii_redaction: boolean;
  };
}
```

### 7.2 Catalog Types

```typescript
interface ModelProvider {
  id: string;
  label: string;
  models: Array<{ id: string; label: string; context_window: number; notes?: string }>;
}

interface VoiceProvider {
  id: string;
  label: string;
  voices: Array<{ id: string; label: string; gender: "male" | "female" | "neutral"; language: string }>;
}

interface TranscriberProvider {
  id: string;
  label: string;
  models: Array<{ id: string; label: string; notes?: string }>;
}

interface ToolCatalogEntry {
  id: string;
  name: string;
  category: "scheduling" | "messaging" | "lookup" | "handoff";
  description: string;
  icon: string;
  params: Array<{
    name: string;
    type: "string" | "number" | "boolean" | "enum";
    required: boolean;
    description: string;
    enumValues?: string[];
  }>;
}

interface AgentTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  defaults: {
    model_provider: string;
    model_id: string;
    voice_provider: string;
    voice_id: string;
    language: string;
    first_message_mode: FirstMessageMode;
    first_message: string;
    system_prompt: string;
    tools: string[];
  };
}
```

### 7.3 Agent Definition Types

```typescript
type AgentDefinitionStatus = "draft" | "published" | "retired";
type VersionStatus = "draft" | "in_review" | "approved" | "rejected" | "published" | "previously_published" | "archived";

interface AdminAgentDefinitionSummary {
  id: string;
  tenant_id: string;
  name: string;
  status: AgentDefinitionStatus;
  published_version: number | null;
  created_at: string;
  updated_at: string;
}

interface AdminAgentDefinitionVersionDetail {
  id: string;
  agent_definition_id: string;
  tenant_id: string;
  version: number;
  status: VersionStatus;
  source_yaml: string;
  source_yaml_hash: string;
  compiled_hash: string;
  created_at: string;
  published_at: string | null;
}
```

### 7.4 Live Test Types

```typescript
interface BrowserVoiceSessionInfo {
  call_id: string;
  livekit_url: string;
  livekit_token: string;
  agent_participant_name: string;
  user_participant_name: string;
}

interface LiveTestEvent {
  kind: "transcript" | "tool" | "log" | "metric" | "ended";
  speaker?: "user" | "agent";
  event_type?: string;
  text?: string;
  summary?: string;
  occurred_at_ms: number;
  duration_ms?: number;
}

interface TestCallSummary {
  call_id: string;
  version: number;
  duration_ms: number;
  created_at: string;
  recording_status: "available" | "processing" | "unavailable";
  recording_signed_url_path: string | null;
}
```

---

## 8. Component File Structure

```
src/app/(deployment)/admin/agent-definitions/
  page.tsx                         — 2-column shell (list + detail)
  components/
    agent-config-types.ts          — working config TypeScript types
    tenant-selector.tsx            — tenant dropdown
    assistant-list.tsx             — 320px list column with search
    create-assistant-modal.tsx     — 3-step wizard (template → name → review)
    detail-panel.tsx               — assembles header + tabs + save bar
    detail-header.tsx              — name, status, version, cost, Talk, menu
    cost-latency-strip.tsx         — two metric badge cards
    unsaved-bar.tsx                — sticky bottom save/discard bar
    tabs/
      model-tab.tsx                — provider + model + prompt + temperature
      voice-tab.tsx                — TTS provider + voice + language + preview
      tools-tab.tsx                — active tools list + add
      tool-picker-drawer.tsx       — catalog picker drawer (multi-select)
      analysis-tab.tsx             — summary + criteria + extraction table
      advanced-tab.tsx             — STT + retention + PII + raw YAML
      test-tab.tsx                 — live test: controls + transcript + log + playback
    live-test/
      voice-controls.tsx           — start/end/mic/timer bar
      live-transcript.tsx          — chat bubbles with auto-scroll
      event-log.tsx                — terminal-style event feed
      recording-playback.tsx       — audio scrubber + recording dropdown
src/lib/api/
  agent-builder-catalogs.ts        — getModelProviders, getVoiceProviders, etc.
```

---

## 9. Backend Endpoints Summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/model-providers` | LLM provider + model catalog |
| GET | `/admin/voice-providers` | TTS provider + voice catalog |
| GET | `/admin/transcriber-providers` | STT provider + model catalog |
| GET | `/admin/tool-catalog` | Function tool catalog with param schemas |
| GET | `/admin/agent-templates` | Create wizard templates |
| POST | `/admin/voice-preview` | TTS sample audio |
| POST | `/admin/agent-prompt-generate` | AI-generated system prompt |
| GET | `/admin/tenants/{tid}/agent-definitions` | List agent definitions |
| GET | `/admin/tenants/{tid}/agent-definitions/{id}` | Get agent definition |
| POST | `/admin/tenants/{tid}/agent-definitions` | Create agent definition |
| GET | `/admin/tenants/{tid}/agent-definitions/{id}/versions` | List versions |
| POST | `/admin/tenants/{tid}/agent-definitions/{id}/versions` | Create draft version |
| POST | `/admin/tenants/{tid}/agent-definitions/{id}/versions/{v}/publish` | Publish version |
| POST | `/admin/tenants/{tid}/agent-definitions/{id}/browser-voice-session` | Start test call |
| DELETE | `/admin/tenants/{tid}/agent-definitions/{id}/browser-voice-session/{call_id}` | End test call |
| GET | `/admin/tenants/{tid}/calls/test-history` | Recent test calls |

---

## 10. Design States

| State | Behavior |
|---|---|
| No tenant | List: "Select a tenant". Detail: "Pick a tenant to start" |
| No agents | List: CTA. Detail: CTA |
| Agent loading | "Loading assistant…" |
| Agent error | Red error message with retry |
| Unsaved | Sticky bar: amber dot + Save/Discard |
| Saving | "Saving…" disabled button |
| Test idle | "Start test call" button |
| Test active | Red dot, timer, live transcript + log |
| Test ended | Recording playback bar |
| Create modal | 3-step wizard overlay |

---

## 11. Visual Style

- Font: Geist Sans 13px, monospace for code/IDs
- Primary: purple (#8b5cf6)
- Spacing: compact — px-2.5 py-[7px] items, gap-4 sections
- Borders: 1px neutral-200, rounded-md (5px)
- Shadows: minimal
- Active: primary-50 bg + primary-700 text
- Buttons: primary (purple), secondary (border), ghost (no bg), destructive (red)
