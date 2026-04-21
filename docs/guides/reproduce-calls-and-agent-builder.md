# Reproduction Guide: Calls Admin + Agent Builder Pages

| | |
|---|---|
| **Purpose** | Reproduce the Calls and Agent Builder pages in another repo so the result is identical to `manibo-design` |
| **Source** | `manibo-design/web/src/app/(deployment)/admin/calls/` and `manibo-design/web/src/app/(deployment)/admin/agent-definitions/` |
| **Last updated** | 2026-04-21 |

---

## Prerequisites in Target Repo

The repo must already have:

| Component | Description |
|----------|------------|
| Next.js App Router | `app/` directory, `"use client"` pages |
| `@grove/ui` | Badge, Button, Card, Tabs, Select, Modal, Drawer, Switch, Input, Skeleton |
| `@grove/web-shared` | `platformApiRequest`, `PageHeader`, tenant-locale types |
| SWR | Data fetching and cache |
| Tailwind CSS v4 | Utility classes |
| CSS custom properties | `--color-primary-*`, `--color-neutral-*`, `--color-border`, `--color-bg-subtle` |
| Mock dispatcher | `GROVE_USE_MOCK_API` env flag, `dispatchMockApi()` pattern |
| Admin shell | Layout with sidebar (`AdminPageShell`, `PageFrame`) |
| Existing API modules | `@/lib/api/platform.ts` (re-exports `platformApiRequest`), `@/lib/api/tenants.ts` |
| SWR key factory | `@/lib/swr-keys.ts` |

---

## Code Conventions (MUST follow)

### Import Paths

```typescript
// @grove/ui — per-component import
import { Button } from "@grove/ui/button";
import { Badge } from "@grove/ui/badge";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@grove/ui/tabs";

// @grove/web-shared
import { platformApiRequest } from "@/lib/api/platform"; // re-export

// Internal
import * as swrKeys from "@/lib/swr-keys";
import { listAdminTenants, type AdminTenantSummary } from "@/lib/api/tenants";
```

### Styling Tokens

```
bg-[var(--color-primary-100)]     # tenant badge bg
text-[var(--color-primary-700)]   # tenant badge text
bg-[var(--color-primary-600)]     # primary button bg
bg-[var(--color-bg-subtle)]       # table header, hover states
border-[var(--color-border)]      # standard borders
text-[var(--color-neutral-500)]   # muted text
text-[var(--color-neutral-400)]   # label text
text-[var(--color-neutral-900)]   # heading text
```

### Typography

| Element | Size | Weight | Font |
|--------|------|--------|------|
| Breadcrumb | `text-[13px]` | medium/regular | Inter |
| Tab labels | `text-[13px]` | medium | Inter |
| Tab count badge | `text-[10px]` | semibold | Inter |
| Table header | `text-[11px] uppercase tracking-wider` | semibold | Inter |
| Table cell | `text-[13px]` | regular | Inter |
| Monospace values | `text-[12px]`/`text-[13px]` | regular | `font-mono` |
| Section label | `text-[11px] uppercase tracking-wider` | semibold | Inter |
| Call header phone | `text-xl` | `font-bold tracking-tight` | Inter |
| Stats values | `text-[15px]` | semibold | `font-mono` |
| Chat bubble text | `text-[13px] leading-relaxed` | regular | Inter |
| Chat role label | `text-[11px] uppercase` | bold | Inter |

### Data Fetching Pattern

```typescript
// SWR key factory (in @/lib/swr-keys.ts)
export const adminLiveCalls = () => "admin-live-calls" as const;
export const adminCallHistory = (tenantId: string | null) => ["admin-call-history", tenantId] as const;

// In page:
const { data, isLoading } = useSWR(
  swrKeys.adminLiveCalls(),
  listAdminLiveCalls,
  { revalidateOnFocus: false, refreshInterval: 10_000 }, // live data: 10s poll
);
```

### API Layer Pattern

```typescript
// @/lib/api/admin-calls.ts
import { platformApiRequest } from "@/lib/api/platform";

export function listAdminLiveCalls(): Promise<{ calls: AdminLiveCall[] }> {
  return platformApiRequest<{ calls: AdminLiveCall[] }>("/admin/calls/live", { method: "GET" });
}
```

### Mock Dispatcher Pattern

```typescript
// @/lib/mock/dispatcher.ts
import * as fx from "@/lib/mock/fixtures";

// Route matching: exact path → fixture
if (path === "/admin/calls/live") return ok(fx.adminLiveCalls);
if (path === "/admin/calls/history") return ok(fx.adminCallHistory);
if (path.startsWith("/admin/calls/") && path.endsWith("/replay")) return ok(fx.adminCallReplay);

// Non-GET → generic ok
if (upperMethod !== "GET" && upperMethod !== "HEAD") return ok({ ok: true });
```

### Mock Fixture Pattern

```typescript
// @/lib/mock/fixtures.ts
const TENANT_ID = "ten_01JTNORTHSTAR0001";
const TENANT_NAME = "Northstar Mobility";

export const adminLiveCalls = {
  calls: [
    {
      id: "cl_01JXYZA",
      tenant_id: TENANT_ID,
      tenant_name: TENANT_NAME,
      // ...all fields per interface
    },
  ],
};
```

---

## Milestone A: Calls Admin Module

### Branch & Commit Structure

```
Branch: feat/calls-admin-module
Commit format: feat: calls T{NN} - {short description}
```

### File Map (final)

```
web/src/
├── app/(deployment)/admin/calls/
│   ├── page.tsx                      # Main: Live table, History table, Live detail, History detail,
│   │                                 #   TakeoverModal, MonitorBar — all inline in this file
│   └── [callId]/
│       └── page.tsx                  # Replay: Timeline, Transcript, Event Inspector, Audio player
├── lib/
│   ├── api/
│   │   └── admin-calls.ts           # Types + fetch functions (3 endpoints)
│   ├── mock/
│   │   ├── fixtures.ts              # +adminLiveCalls, +adminCallHistory, +adminCallReplay
│   │   └── dispatcher.ts            # +4 route rules
│   ├── swr-keys.ts                  # +3 key factories
│   └── deployment-workbench.ts       # +1 nav item
└── components/
    └── call-ops/
        └── live-transcript.tsx       # Shared transcript component (already exists)
```

### Task Breakdown

---

#### T01 — Nav item + SWR keys

**Modified files:**
- `web/src/lib/deployment-workbench.ts`
- `web/src/lib/swr-keys.ts`

**Steps:**

1. In `deployment-workbench.ts`, add item in the "Platform" section:

```typescript
{
  title: "Platform",
  items: [
    { label: "Audit", href: "/admin/audit", icon: "shield" },
    { label: "Calls", href: "/admin/calls", icon: "phone" },   // ← add
  ],
},
```

2. In `swr-keys.ts`, add at the end of the file:

```typescript
/* Admin — calls */
export const adminLiveCalls = () => "admin-live-calls" as const;
export const adminCallHistory = (tenantId: string | null) => ["admin-call-history", tenantId] as const;
export const adminCallReplay = (callId: string) => ["admin-call-replay", callId] as const;
```

**Commit:** `feat: calls T01 - add nav item and SWR cache keys`

---

#### T02 — API types and fetch functions

**New file:** `web/src/lib/api/admin-calls.ts`

**Full contents:**

```typescript
import { platformApiRequest } from "@/lib/api/platform";

// -- Type aliases --
export type CallState = "ringing" | "in_progress" | "on_hold" | "supervised" | "wrapping_up" | "ended" | "failed";
export type CallEndReason = "completed" | "caller_hangup" | "agent_hangup" | "supervisor_end" | "error" | "timeout";
export type CallChannel = "pstn" | "sip" | "web" | "test";
export type TranscriptRole = "caller" | "agent" | "supervisor" | "system";
export type EventKind = "state_change" | "model_invocation" | "asr_event" | "tts_event" | "dtmf" | "handoff" | "supervisor_action" | "log";
export type EventSeverity = "debug" | "info" | "warn" | "warning" | "error";
export type ToolStatus = "ok" | "error" | "timeout" | "cancelled";

// -- Interfaces --
export interface AdminLiveCall {
  id: string;
  tenant_id: string;
  tenant_name: string;
  agent_id: string;
  agent_name: string;
  agent_version: string;
  state: CallState;
  direction: "inbound" | "outbound";
  caller_number: string;
  caller_name: string | null;
  callee_number: string;
  channel: CallChannel;
  started_at: string;
  duration_ms: number;
  current_intent: string | null;
  cost_cents: number;
  latency_ms: number | null;
  tools: string[];
}

export interface AdminHistoricalCall {
  id: string;
  tenant_id: string;
  tenant_name: string;
  agent_name: string;
  state: CallState;
  end_reason: CallEndReason;
  direction: "inbound" | "outbound";
  caller_number: string;
  caller_name: string | null;
  callee_number: string;
  channel: CallChannel;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  cost_cents: number;
  current_intent: string | null;
  tools: string[];
  supervised_by: string | null;
}

export interface TranscriptTurn {
  id: string;
  seq: number;
  role: TranscriptRole;
  started_at_ms: number;
  ended_at_ms: number;
  text: string;
  confidence: number;
  language: string;
}

export interface CallEvent {
  id: string;
  at_ms: number;
  kind: EventKind;
  severity: EventSeverity;
  payload: Record<string, unknown>;
  label: string;
}

export interface ToolExecution {
  id: string;
  turn_id: string | null;
  tool_name: string;
  tool_version: string;
  started_at_ms: number;
  ended_at_ms: number;
  status: ToolStatus;
  arguments: Record<string, unknown>;
  result: unknown;
  error?: { code: string; message: string } | null;
  latency_ms: number;
}

export interface CallRecording {
  id: string;
  codec: string;
  sample_rate: number;
  channels: number;
  duration_ms: number;
  bytes: number;
  waveform_peaks_uri: string | null;
}

export interface AdminCallReplay {
  call: AdminLiveCall & {
    end_reason?: CallEndReason;
    ended_at?: string;
    recording_uri?: string;
  };
  transcript: TranscriptTurn[];
  events: CallEvent[];
  tool_executions: ToolExecution[];
  recording: CallRecording | null;
}

// -- Fetch functions --
export function listAdminLiveCalls(): Promise<{ calls: AdminLiveCall[] }> {
  return platformApiRequest<{ calls: AdminLiveCall[] }>("/admin/calls/live", { method: "GET" });
}

export function listAdminCallHistory(params?: {
  tenant_id?: string;
  agent_name?: string;
  end_reason?: string;
  started_after?: string;
  started_before?: string;
}): Promise<{ calls: AdminHistoricalCall[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.tenant_id) query.set("tenant_id", params.tenant_id);
  if (params?.agent_name) query.set("agent_name", params.agent_name);
  if (params?.end_reason) query.set("end_reason", params.end_reason);
  if (params?.started_after) query.set("started_after", params.started_after);
  if (params?.started_before) query.set("started_before", params.started_before);
  const qs = query.toString();
  return platformApiRequest<{ calls: AdminHistoricalCall[]; total: number }>(
    `/admin/calls/history${qs ? `?${qs}` : ""}`,
    { method: "GET" },
  );
}

export function getAdminCallReplay(callId: string): Promise<AdminCallReplay> {
  return platformApiRequest<AdminCallReplay>(
    `/admin/calls/${encodeURIComponent(callId)}/replay`,
    { method: "GET" },
  );
}
```

**Commit:** `feat: calls T02 - add API types and fetch functions`

---

#### T03 — Mock fixtures and dispatcher routes

**Modified files:**
- `web/src/lib/mock/fixtures.ts` — append exports
- `web/src/lib/mock/dispatcher.ts` — add routes

**Fixtures to add:**

1. `adminLiveCalls` — 6 call objects:
   - 2x `in_progress` (Northstar, different tenant)
   - 1x `on_hold`
   - 1x `supervised`
   - 1x `ringing`
   - 1x `in_progress` (3rd tenant)
   - Minimum 3 different tenants
   - Each call: `id`, `tenant_id`, `tenant_name`, `agent_id`, `agent_name`, `agent_version`, `state`, `direction`, `caller_number` (masked: `"+1 415 ••• 4421"`), `caller_name`, `callee_number`, `channel`, `started_at` (ISO), `duration_ms`, `current_intent`, `cost_cents`, `latency_ms`, `tools[]`

2. `adminCallHistory` — 7 call objects:
   - Mix of `end_reason`: completed, caller_hangup, supervisor_end, error, agent_hangup
   - Field `supervised_by: string | null` — fill with email for taken-over calls
   - `total: 248` (simulate pagination)

3. `adminCallReplay` — 1 complete replay object:
   - `call`: extend AdminLiveCall + `end_reason`, `ended_at`, `recording_uri`
   - `transcript`: 7 turns, alternating caller/agent roles, with `seq`, `started_at_ms`, `ended_at_ms`, `text`, `confidence`, `language`
   - `events`: 7 events (state_change, model_invocation, asr_event, tool timeout warning, retry timeout, handoff, call ended)
   - `tool_executions`: 4 items (1 ok, 2 timeout, 1 ok transfer)
   - `recording`: `{ id, codec: "opus", sample_rate: 16000, channels: 2, duration_ms, bytes, waveform_peaks_uri: null }`

**Dispatcher routes:**

```typescript
// ---- Admin: calls ---- //
if (path === "/admin/calls/live") return ok(fx.adminLiveCalls);
if (path === "/admin/calls/history") return ok(fx.adminCallHistory);
if (path.startsWith("/admin/calls/") && path.endsWith("/replay")) return ok(fx.adminCallReplay);
if (path.startsWith("/admin/calls/")) return ok(fx.adminCallReplay);
```

**Commit:** `feat: calls T03 - add mock fixtures and dispatcher routes`

---

#### T04 — Calls main page (Live + History tabs)

**New file:** `web/src/app/(deployment)/admin/calls/page.tsx`

**IMPORTANT: Custom layout, NOT AdminPageShell.**

Layout:
```
h-[calc(100vh-3.5rem)] flex flex-col
├─ Breadcrumb   border-b bg-white px-5 py-3
├─ SubHeader    border-b bg-white px-5 py-3  (tabs + tenant dropdown)
└─ Content      flex-1 overflow-y-auto bg-white px-5 py-5
```

**Inline components to create inside this file:**

1. **`dummyNotice(msg)`** — Toast notification: `fixed bottom-4 left-1/2 z-50 bg-[#1a1a2e] text-white rounded-lg`, auto-dismiss 2.5s
2. **`downloadDummyFile(filename, content, mime)`** — Blob download helper
3. **`exportCallsCsv(calls)`** — CSV export (call_id, started_at, agent, caller, duration, cost)
4. **`exportTranscriptTxt(callId)`** — Dummy transcript .txt download
5. **Helper functions:** `fmt(ms)` → "MM:SS", `fmtDate(iso)` → "YYYY-MM-DD HH:MM", `cost(cents)` → "$X.XX"
6. **Constants:**
   ```typescript
   const STATE_DOT: Record<string, string> = {
     in_progress: "bg-emerald-500", on_hold: "bg-amber-500",
     supervised: "bg-purple-500", ringing: "bg-blue-500",
     ended: "bg-slate-400", failed: "bg-red-500",
   };
   const STATE_LABEL: Record<string, string> = {
     in_progress: "in prog.", on_hold: "on hold", supervised: "supervised",
     ringing: "ringing", ended: "ended", failed: "failed",
   };
   const OUTCOME_DOT: Record<string, string> = {
     completed: "bg-emerald-500", caller_hangup: "bg-slate-400",
     agent_hangup: "bg-slate-400", supervisor_end: "bg-purple-500",
     error: "bg-red-500", timeout: "bg-amber-500",
   };
   ```
7. **`StatusPill({ state })`** — Pill with colored dot: `inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]`
8. **`TenantBadge({ name })`** — `rounded bg-primary-100 px-1.5 py-0.5 text-[11px] text-primary-700`
9. **`ToolBadge({ name })`** — `rounded border bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px]`
10. **`TenantDropdown`** — Custom dropdown (NOT @grove/ui Select): `absolute z-30 mt-1 rounded-lg border bg-white shadow-lg`, with "All tenants" + per-tenant rows, checkmark on selected, live count badges (green) in Live tab
11. **`SubHeader`** — Pill segmented tabs:
    - Container: `inline-flex rounded-lg border bg-bg-subtle p-0.5`
    - Live tab: green dot `bg-emerald-500` (grey inactive) + "Live" + count badge
    - History tab: clock SVG + "History" + count badge
    - Active: `bg-white shadow-sm`, Inactive: `text-neutral-500`

**4 views in Content area (switch via state):**

12. **`LiveTable`** — Sub-bar (title + count + search + filter chips) + full-width table
    - Filter chips: All, in prog., on hold, supervised, ringing
    - Active chip: `bg-neutral-900 text-white`
    - Table columns: AGENT (dot + name), TENANT, CALLER (mono), INTENT, DURATION (mono), STATUS (StatusPill), COST (mono right-align)
    - Rows clickable → set `liveDetail`

13. **`LiveDetail`** — Full-page view:
    - Back bar: "← Back to live calls" + StatusPill
    - Caller header card: avatar circle (h-12 w-12 rounded-full bg-primary-100) + phone (text-xl bold) + name + agent info + stats (DURATION/COST/LATENCY in 3 cols)
    - Action cards grid-cols-3:
      - Listen in: headphone SVG, toggles green active state (`bg-emerald-500 text-white`), shows MonitorBar
      - Take over: lock SVG, opens TakeoverModal
      - End call: phone-off SVG, changes state to "ended", shows toast
    - Content grid `lg:grid-cols-[1fr_340px]`: LiveTranscript (left) + Context card + Tool Activity card (right)

14. **`TakeoverModal`** — `fixed inset-0 z-50 bg-black/40`, centered card `max-w-lg rounded-2xl`:
    - Title + close X
    - Info table: Caller, Agent, Impact ("AI agent will be **muted**...")
    - Reason textarea (required)
    - Announce checkbox
    - Cancel (outline) + Confirm (primary, disabled until reason filled)

15. **`MonitorBar`** — `fixed bottom-0 left-0 right-0 lg:left-60 z-40`:
    - `bg-[#1a1a2e]` dark navy, white text
    - Left: pulsing red dot (`animate-ping`) + "Monitoring · {agent} · {caller}"
    - Center: 60 simulated waveform bars (`bg-primary-400`, heights from sin/cos)
    - Right: Mute button (outline white) + Leave button (`bg-red-600`)

16. **`HistoryTable`** — Search + outcome dropdown + count + "Export CSV" button + table
    - Outcome filter: All outcomes, completed, caller_hangup, supervisor_end, error
    - Table columns: STARTED, TENANT, AGENT, CALLER (+name below), INTENT (+supervised badge), DURATION, OUTCOME (dot + label), COST, TOOLS, › (link)
    - Rows clickable → set `historyDetail`

17. **`HistoryDetail`** — Full-page view:
    - Back bar + outcome pill + supervised badge
    - Caller header card (phone icon avatar, not colored circle) + phone + name + agent + stats
    - Action buttons: Export transcript, Download recording, Open full replay (link)
    - Content grid: Transcript preview (dummy bubbles) + Context table + Tools card

**State management:**
```typescript
const [tab, setTab] = useState<"live" | "history">("live");
const [liveDetail, setLiveDetail] = useState<AdminLiveCall | null>(null);
const [historyDetail, setHistoryDetail] = useState<AdminHistoricalCall | null>(null);
const [listening, setListening] = useState(false);
const [showTakeover, setShowTakeover] = useState(false);
const [callState, setCallState] = useState<Record<string, string>>({});
const [tenantFilter, setTenantFilter] = useState<string>("__all");
```

**Data fetching:**
```typescript
const { data: liveData } = useSWR(swrKeys.adminLiveCalls(), listAdminLiveCalls, { refreshInterval: 10_000 });
const { data: historyData } = useSWR(swrKeys.adminCallHistory(null), () => listAdminCallHistory());
const { data: tenantData } = useSWR("adminTenants", () => listAdminTenants(500, 0));
```

**Commit:** `feat: calls T04 - add Calls main page with Live and History tabs`

---

#### T05 — Call Replay page

**New file:** `web/src/app/(deployment)/admin/calls/[callId]/page.tsx`

**Layout (vertical stack):**
```
├─ Breadcrumb: "Platform / Calls · Replay"
├─ Back link + Header (agent + phone + caller + date + duration + status + supervised + cost)
├─ Action buttons: Export transcript, Download recording
├─ Timeline card (TIMELINE label + time display + track + markers + playhead)
├─ Two-column grid lg:grid-cols-[1fr_380px]:
│   ├─ Transcript panel (TRANSCRIPT + turn count, chat bubbles)
│   └─ Event Inspector (EVENT INSPECTOR + @time, merged events + tool execs)
└─ Audio player card (play + speed controls + waveform + time)
```

**Shared playhead state:**
```typescript
const [playheadMs, setPlayheadMs] = useState(0);
// Passed as `onSeek={setPlayheadMs}` to all panels
```

**Inline components:**

1. **`Timeline`** — `rounded-xl border bg-white p-5`:
   - Horizontal track `h-0.5 bg-neutral-200` with colored dot markers
   - Marker colors: events (blue/amber/red by severity), tools (emerald/red by status)
   - Playhead: `bg-neutral-900 w-0.5 h-full` + triangle top
   - Time labels: 00:00 left, midpoint center, total right
   - Click track to seek

2. **`TranscriptPanel`** — Chat bubbles:
   - Caller: left-align, `bg-neutral-100 rounded-xl rounded-tl-sm`
   - Agent: right-align, `bg-primary-50 rounded-xl rounded-tr-sm`
   - Supervisor: right-align, `bg-purple-50`
   - Role label: `text-[11px] uppercase font-bold` + timestamp mono
   - Active turn: `ring-2 ring-primary-400`
   - Click bubble → `onSeek(turn.started_at_ms)`

3. **`EventInspector`** — Merged sorted timeline:
   - Events: timestamp (mono 11px) + label + type badge
   - Type badge colors:
     ```
     STATE_CHANGE: bg-slate-100 text-slate-600
     MODEL_INVOCATION: bg-blue-100 text-blue-700
     ASR_EVENT: bg-amber-100 text-amber-700
     TOOL: bg-emerald-100 text-emerald-700
     HANDOFF: bg-purple-100 text-purple-700
     TTS_EVENT: bg-sky-100 text-sky-700
     ```
   - Tool items: tool_name (mono, red if error) + status badge + latency_ms + error message
   - Click → seek

4. **`AudioPlayer`** — `rounded-xl border bg-white p-5`:
   - Play button: `h-10 w-10 rounded-full bg-primary-600 text-white` (disabled)
   - Speed: 0.5x, **1x** (active: `bg-neutral-900 text-white`), 1.5x, 2x
   - Waveform: 120 bars, filled to playhead (`bg-primary-500` played, `bg-neutral-300` remaining)
   - Time: `MM:SS / MM:SS` mono
   - Click waveform → seek

**Commit:** `feat: calls T05 - add Call Replay page`

---

#### T06 — Verify build

```bash
cd web && npx tsc --noEmit    # zero errors
cd web && npx next build      # successful build
```

**Commit:** `fix: calls T06 - resolve build errors` (only if there are fixes)

---

## Milestone B: Agent Builder Module

### Branch & Commit Structure

```
Branch: feat/agent-builder-workbench
Commit format: feat: agent-builder T{NN} - {short description}
```

### File Map (final)

```
web/src/
├── app/(deployment)/admin/agent-definitions/
│   ├── page.tsx                                # 2-column workbench shell
│   ├── helpers.ts                              # Shared helper functions
│   ├── structured-agent-editor.tsx              # (existing, keep for Advanced tab)
│   ├── structured-agent-editor-form.tsx         # (existing)
│   ├── structured-agent-editor-yaml.ts          # (existing)
│   ├── version-history.tsx                      # (existing)
│   ├── yaml-flow-preview.tsx                    # (existing)
│   ├── [id]/
│   │   ├── page.tsx                             # Redirect → ?id=X on main page
│   │   ├── test/page.tsx                        # Redirect → ?id=X&live=1
│   │   ├── channels-panel.tsx
│   │   └── detail-support.tsx
│   └── components/
│       ├── agent-config-types.ts                # Shared types for config state
│       ├── assistant-list.tsx                    # Left sidebar 320px
│       ├── tenant-selector.tsx                   # Dropdown (filter offboarded)
│       ├── create-assistant-modal.tsx            # 3-step wizard
│       ├── detail-panel.tsx                      # Right pane orchestrator
│       ├── detail-header.tsx                     # Name + ID + status + version + Talk + More
│       ├── cost-latency-strip.tsx                # 2 badge cards
│       ├── unsaved-bar.tsx                       # Sticky bottom bar
│       ├── tabs/
│       │   ├── model-tab.tsx                     # Provider + model + first message + system prompt
│       │   ├── voice-tab.tsx                     # TTS provider + voice + language + preview
│       │   ├── tools-tab.tsx                     # Active tools table
│       │   ├── tool-picker-drawer.tsx            # Catalog drawer
│       │   ├── analysis-tab.tsx                  # Summary + criteria + extraction
│       │   ├── advanced-tab.tsx                  # STT + retention + PII + YAML
│       │   └── test-tab.tsx                      # (optional)
│       └── live-test/
│           ├── live-test-panel.tsx               # Slide-down panel
│           ├── voice-controls.tsx                # Mic toggle + end call + timer
│           ├── waveform-pair.tsx                 # Mic + agent waveforms
│           ├── live-transcript.tsx               # Chat bubbles
│           ├── event-log.tsx                     # Event feed
│           ├── recording-playback.tsx            # Wavesurfer + recordings
│           └── use-mock-test-stream.ts           # Scripted sequence emitter
├── lib/
│   ├── api/
│   │   ├── admin-agent-definitions.ts           # (existing) listAdminTenantAgentDefinitions
│   │   └── agent-builder-catalogs.ts            # 5 fetch functions (catalogs + templates)
│   └── mock/
│       └── agent-builder-fixtures.ts            # Catalogs + templates + test stream
```

### Task Breakdown

---

#### T01 — Agent builder mock fixtures

**New file:** `web/src/lib/mock/agent-builder-fixtures.ts`

**Types + data:**

1. **`modelProviderCatalog`** — 3 providers (OpenAI, Anthropic, Google), each with model list:
   ```typescript
   export type ModelProviderId = "openai" | "anthropic" | "google";
   export interface ModelOption { id: string; label: string; context_window: number; notes?: string; }
   export interface ModelProvider { id: ModelProviderId; label: string; models: ModelOption[]; }
   ```

2. **`voiceProviderCatalog`** — 3 providers (Azure, ElevenLabs, OpenAI TTS), each with voice list:
   ```typescript
   export type VoiceProviderId = "azure" | "elevenlabs" | "openai_tts";
   export type VoiceGender = "female" | "male" | "neutral";
   export interface VoiceOption { id: string; label: string; gender: VoiceGender; language: string; }
   export interface VoiceProvider { id: VoiceProviderId; label: string; voices: VoiceOption[]; }
   ```

3. **`transcriberProviderCatalog`** — 3 providers (Deepgram, OpenAI Whisper, Azure)

4. **`toolCatalog`** — 5 tools (lookup_slots, create_booking, send_sms, transfer_to_human, lookup_customer), each with description + parameters JSON schema

5. **`agentTemplates`** — 4 templates (Booking Assistant, Driver Verification, Lead Capture, Blank), each with default model, voice, prompt, tools

6. **`liveTestStream`** — Array of `{ delayMs, kind, payload }` frames (~30s scripted sequence)

7. **`mockRecordings`** — Array of `{ id, callId, durationMs, signedUrl }` for playback bar

**Commit:** `feat: agent-builder T01 - add mock fixtures and types`

---

#### T02 — Agent builder API + dispatcher routes

**New file:** `web/src/lib/api/agent-builder-catalogs.ts`

```typescript
import { platformApiRequest } from "@/lib/api/platform";
import type { AgentTemplate, ModelProvider, ToolCatalogEntry, TranscriberProvider, VoiceProvider } from "@/lib/mock/agent-builder-fixtures";

// Re-export all types
export type { AgentTemplate, ModelOption, ModelProvider, ModelProviderId, ... } from "@/lib/mock/agent-builder-fixtures";

export function getModelProviders(): Promise<ModelProvider[]> {
  return platformApiRequest<ModelProvider[]>("/admin/model-providers", { method: "GET" });
}
export function getVoiceProviders(): Promise<VoiceProvider[]> { ... }
export function getTranscriberProviders(): Promise<TranscriberProvider[]> { ... }
export function getToolCatalog(): Promise<ToolCatalogEntry[]> { ... }
export function getAgentTemplates(): Promise<AgentTemplate[]> { ... }
```

**Additional dispatcher routes:**
```typescript
if (path === "/admin/model-providers") return ok(modelProviderCatalog);
if (path === "/admin/voice-providers") return ok(voiceProviderCatalog);
if (path === "/admin/transcriber-providers") return ok(transcriberProviderCatalog);
if (path === "/admin/tool-catalog") return ok(toolCatalog);
if (path === "/admin/agent-templates") return ok(agentTemplates);
```

**Commit:** `feat: agent-builder T02 - add API layer and dispatcher routes`

---

#### T03 — Config types

**New file:** `web/src/app/(deployment)/admin/agent-definitions/components/agent-config-types.ts`

Shared types for state across tabs:
```typescript
export interface AgentConfig {
  modelProviderId: string;
  modelId: string;
  firstMessageMode: "assistant_first" | "user_first" | "wait_greeting";
  firstMessage: string;
  systemPrompt: string;
  voiceProviderId: string;
  voiceId: string;
  language: string;
  activeTools: string[];
  analysisSummaryPrompt: string;
  analysisCriteria: string;
  extractionFields: ExtractionField[];
  transcriberProviderId: string;
  transcriberModelId: string;
  retentionDays: number;
  piiRedaction: boolean;
}

export interface ExtractionField {
  name: string;
  jsonPath: string;
  type: "string" | "number" | "boolean" | "enum";
}
```

**Commit:** `feat: agent-builder T03 - add shared config types`

---

#### T04 — AssistantList + TenantSelector

**New files:**
- `components/assistant-list.tsx`
- `components/tenant-selector.tsx`

**AssistantList:**
- Fixed width `w-80 border-r flex flex-col`
- Header: TenantSelector + search input + "+ Create" button
- List: scrollable, agent rows with name + secondary line (`provider · voice · vN`) + status dot
- Empty states: "Select a tenant" / "No assistants yet" + CTA
- Footer: count

**TenantSelector:**
- Filter out `status === "offboarded"` tenants
- Uses `@grove/ui/select`

**Commit:** `feat: agent-builder T04 - add AssistantList and TenantSelector`

---

#### T05 — DetailPanel + DetailHeader + CostLatencyStrip + UnsavedBar

**New files:**
- `components/detail-panel.tsx` — Right pane, manages tab state, renders header + active tab
- `components/detail-header.tsx` — Name + copyable ID + status pill + version dropdown + Talk button + More menu
- `components/cost-latency-strip.tsx` — 2 small badge cards (cost/min + latency)
- `components/unsaved-bar.tsx` — Sticky bottom: "Unsaved changes" pill + Discard + Save buttons, only visible when dirty

**Commit:** `feat: agent-builder T05 - add detail panel with header and unsaved bar`

---

#### T06 — Model tab + Voice tab

**New files:**
- `components/tabs/model-tab.tsx` — Provider dropdown → model dropdown (filtered) + First Message Mode dropdown + First Message textarea + System Prompt textarea + "Generate" button
- `components/tabs/voice-tab.tsx` — TTS provider dropdown → voice dropdown (filtered) + Language dropdown + "Preview" button

**Commit:** `feat: agent-builder T06 - add Model and Voice tabs`

---

#### T07 — Tools tab + Tool picker drawer

**New files:**
- `components/tabs/tools-tab.tsx` — Table: name, description, on/off toggle. Click row → inline expand. "+ Add tool" → opens drawer
- `components/tabs/tool-picker-drawer.tsx` — Drawer from right with tool catalog, click to add

**Commit:** `feat: agent-builder T07 - add Tools tab with picker drawer`

---

#### T08 — Analysis tab + Advanced tab

**New files:**
- `components/tabs/analysis-tab.tsx` — Summary prompt textarea + Success criteria textarea + Extraction fields table (name, path, type) + "+ Add field"
- `components/tabs/advanced-tab.tsx` — STT provider/model + language detection toggle + retention slider (1-365 days) + PII redaction toggle + collapsible Raw YAML (wraps existing structured-agent-editor)

**Commit:** `feat: agent-builder T08 - add Analysis and Advanced tabs`

---

#### T09 — Live test panel

**New files:**
- `components/live-test/live-test-panel.tsx` — Slide-down from header, 3-column: waveforms | transcript | event log
- `components/live-test/voice-controls.tsx` — Mic toggle + end call + elapsed timer + provider/voice info + close
- `components/live-test/waveform-pair.tsx` — Mic + agent waveforms (canvas, sin/cos simulated)
- `components/live-test/live-transcript.tsx` — Chat bubbles (user/agent alternating)
- `components/live-test/event-log.tsx` — Timestamp + event type feed
- `components/live-test/recording-playback.tsx` — Scrubber + past recordings dropdown
- `components/live-test/use-mock-test-stream.ts` — `useMockTestStream()` hook: steps through `liveTestStream` frames with setTimeout delays, returns `{ transcript, events, recording, isActive, start, stop }`

**Commit:** `feat: agent-builder T09 - add live test panel with mock stream`

---

#### T10 — CreateAssistantModal (3-step wizard)

**New file:** `components/create-assistant-modal.tsx`

3 steps:
1. Pick template — 4 grid cards (Booking Assistant, Driver Verification, Lead Capture, Blank)
2. Name + language (id-ID / en-US) + tenant (pre-filled)
3. Review & create

On submit: generate ULID, insert optimistic entry, close modal, select new agent.

**Commit:** `feat: agent-builder T10 - add create assistant wizard`

---

#### T11 — Main page shell

**Modified file:** `page.tsx` (rewrite)

```typescript
export default function AgentDefinitionsWorkbenchPage() {
  // URL state: ?tenant_id=X&id=Y&live=1
  // SWR: tenants, agents (per tenant), templates
  // Layout:
  //   <div className="-mx-4 -mt-6 flex h-[calc(100vh-72px)] min-h-0 overflow-hidden">
  //     <AssistantList />
  //     <main className="min-w-0 flex-1 overflow-hidden bg-white">
  //       {selected ? <DetailPanel /> : <EmptyDetail />}
  //     </main>
  //     <CreateAssistantModal />
  //   </div>
}
```

Key behaviors:
- Auto-select first usable tenant on load
- URL sync via `router.replace(..., { scroll: false })`
- Optimistic update on create
- Validate URL-pinned agent against loaded list

**Commit:** `feat: agent-builder T11 - wire up workbench page shell`

---

#### T12 — Redirects for old routes

**Modified files:**
- `[id]/page.tsx` — Redirect to `?id=X`
- `[id]/test/page.tsx` — Redirect to `?id=X&live=1`

**Commit:** `feat: agent-builder T12 - add redirects from old routes`

---

#### T13 — Verify build

```bash
cd web && npx tsc --noEmit    # zero errors
cd web && npx next build      # successful build
```

**Commit:** `fix: agent-builder T13 - resolve build errors` (only if there are fixes)

---

## Final Verification Checklist

### Calls Module
- [ ] Nav item "Calls" appears in sidebar under Platform
- [ ] `/admin/calls` shows Live tab with 6 calls, History tab with 7 calls
- [ ] Live: filter chips work, search works, tenant dropdown works
- [ ] Live detail: Listen in toggle + MonitorBar, Take over modal, End call + toast
- [ ] History: search, outcome filter, Export CSV (real file download)
- [ ] History detail: Export transcript, Download recording, Open full replay link
- [ ] `/admin/calls/[callId]`: timeline + transcript + events + audio player all synced via playhead
- [ ] `tsc --noEmit` zero errors
- [ ] `next build` succeeds

### Agent Builder Module
- [ ] `/admin/agent-definitions` shows 2-column layout
- [ ] Tenant selector loads and filters agents
- [ ] Click agent → detail panel with 5 tabs
- [ ] Model tab: provider → model filtering works
- [ ] Voice tab: provider → voice filtering works
- [ ] Tools tab: toggle on/off + drawer picker
- [ ] Analysis tab: fields + extraction table
- [ ] Advanced tab: STT + retention + PII + YAML
- [ ] "Talk" → live test panel slides down, mock stream runs ~30s
- [ ] "+ Create" → 3-step wizard → new agent appears
- [ ] URL state persisted (`?tenant_id=X&id=Y&live=1`)
- [ ] `tsc --noEmit` zero errors
- [ ] `next build` succeeds
