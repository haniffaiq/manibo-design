# Calls Page — UI Documentation

| | |
|---|---|
| **Status** | Final (design pack) |
| **Last updated** | 2026-04-19 |
| **Route** | `/admin/calls` (main) · `/admin/calls/[callId]` (replay) |
| **Source** | `web/src/app/(deployment)/admin/calls/page.tsx` · `web/src/app/(deployment)/admin/calls/[callId]/page.tsx` |
| **Prototype** | `docs/design/Calls - Live Monitoring Prototype.html` |

---

## 1. Page Structure

```
┌─────────────────────────────────────────────────────────┐
│ Breadcrumb    Platform / Calls · Live · All tenants     │
├─────────────────────────────────────────────────────────┤
│ SubHeader   [● Live 6] [⏱ History 7]     Tenant [▾]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Content area (switches between views):                 │
│  - LiveTable                                            │
│  - LiveDetail                                           │
│  - HistoryTable                                         │
│  - HistoryDetail                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Full height: `h-[calc(100vh-3.5rem)]`. No `AdminPageShell` — custom layout with breadcrumb + sub-header + scrollable content.

---

## 2. Views & Navigation Flow

```
LiveTable ──(click row)──► LiveDetail ──(back)──► LiveTable
HistoryTable ──(click row)──► HistoryDetail ──(back)──► HistoryTable
HistoryTable ──(click ›)──► /admin/calls/[callId] (Replay page)
HistoryDetail ──(Open full replay)──► /admin/calls/[callId]
```

State: `tab` ("live" | "history"), `liveDetail` (AdminLiveCall | null), `historyDetail` (AdminHistoricalCall | null). When a detail is shown, SubHeader hides and breadcrumb shows "Calls · Replay".

---

## 3. Components

### 3.1 Breadcrumb

```
Platform / Calls · Live · All tenants      (list view)
Platform / Calls · History · Northstar      (list view, filtered)
Platform / Calls · Replay                   (detail view)
```

Simple text, no links. Updates based on `tab`, `tenantFilter`, and `showingDetail`.

### 3.2 SubHeader

Two-part row: tab switcher (left) + tenant dropdown (right).

**Tab switcher** — pill-style segmented control with border + bg-subtle container:
- **Live tab**: green dot `bg-emerald-500` (grey when inactive) + "Live" + count badge
- **History tab**: clock SVG icon + "History" + count badge
- Active tab: `bg-white shadow-sm`. Inactive: `text-neutral-500`.

**Tenant dropdown** — custom dropdown (not @grove/ui Select):
- Label "Tenant" + trigger button with chevron
- Dropdown menu with "All tenants" + tenant list
- In Live tab: shows live count badge per tenant (green `bg-emerald-100`)
- Selected item: checkmark + primary color highlight
- Closes on outside click or Escape

### 3.3 StatusPill

```tsx
<StatusPill state="in_progress" />
// Renders: [● in prog.] with colored dot + border pill
```

State colors:
| State | Dot color | Label |
|---|---|---|
| `in_progress` | `bg-emerald-500` | in prog. |
| `on_hold` | `bg-amber-500` | on hold |
| `supervised` | `bg-purple-500` | supervised |
| `ringing` | `bg-blue-500` | ringing |
| `ended` | `bg-slate-400` | ended |
| `failed` | `bg-red-500` | failed |

### 3.4 TenantBadge

Small colored badge: `bg-primary-100 text-primary-700`, rounded, 11px font.

### 3.5 ToolBadge

Monospace border badge: `border bg-bg-subtle font-mono text-[10px]`.

---

## 4. Live Tab

### 4.1 LiveTable

**Sub-bar:** "Live calls" title + count badge + search input + status filter chips.

**Filter chips:** All, in prog., on hold, supervised, ringing. Active chip: `bg-neutral-900 text-white`. Search filters by agent name, caller number, and intent.

**Table columns:**

| Column | Content | Style |
|---|---|---|
| AGENT | Colored state dot + agent_name | `font-medium`, dot from `STATE_DOT` map |
| TENANT | TenantBadge | `bg-primary-100` |
| CALLER | caller_number | `font-mono text-xs` |
| INTENT | current_intent or "—" | `text-neutral-600` |
| DURATION | MM:SS | `font-mono text-xs` |
| STATUS | StatusPill | border pill with dot |
| COST | $X.XX | `font-mono text-right` |

Rows are clickable → opens LiveDetail.

### 4.2 LiveDetail

Full-page view replacing the table. Sections top to bottom:

**1. Back bar**
- "← Back to live calls" (left) + StatusPill (right)

**2. Caller header card** (`rounded-xl border bg-white px-6 py-5`)
- Left: Circle avatar (`h-12 w-12 rounded-full bg-primary-100`, shows "+1")
- Caller number (text-xl font-bold) + caller_name (13px neutral-500)
- "talking to **agent_name** · v{version}"
- Right: DURATION / COST / LATENCY stats in 3 columns (10px uppercase labels, 15px mono values)

**3. Action cards** (grid-cols-3 gap-3)

| Card | Icon | Title | Description | Behavior |
|---|---|---|---|---|
| Listen in | headphone SVG | Listen in / Listening | Join read-only audio / You can hear the call | Toggle green active state. Shows MonitorBar. |
| Take over | lock SVG | Take over | Replace agent · reason required | Opens TakeoverModal. |
| End call | phone-off SVG | End call | Hang up immediately | Changes state to "ended", shows toast. Card gets ring highlight. |

**Listen in active state:**
- Card: `border-emerald-400 bg-emerald-500 text-white`
- Title changes to "Listening", desc to "You can hear the call"
- Icon turns white

**End call triggered state:**
- Card: `border-primary-400 ring-2 ring-primary-200`
- StatusPill changes to "ended"

**4. Content grid** (`grid lg:grid-cols-[1fr_340px]`)
- Left: `<LiveTranscript>` component (auto-streaming via SSE)
- Right: Context card (table: Intent, Channel, Direction, Call ID) + Tool Activity card (tool badges with latency)

### 4.3 TakeoverModal

Overlay modal (`fixed inset-0 bg-black/40`), centered white card `max-w-lg rounded-2xl`.

**Content:**
- Title: "Take over this call?" + close X button
- Info table:
  - Caller: `{phone} · {name}`
  - Agent: `{agent_name} v{version}`
  - Impact: "AI agent will be **muted**. You will speak directly to the caller. Tool execution pauses."
- Reason textarea (required, placeholder "e.g. Payment dispute escalation")
- Checkbox: "Announce handover to caller ("Connecting you to a specialist")"
- Buttons: Cancel (outline) + Confirm take-over (primary, disabled until reason filled)

### 4.4 MonitorBar

Fixed at bottom of viewport when Listen in is active.

```
┌──────────────────────────────────────────────────────────┐
│ 🔴 Monitoring · booking_assistant · Maya R.  |||||||  [Mute] [Leave] │
└──────────────────────────────────────────────────────────┘
```

- Position: `fixed bottom-0 left-0 right-0 lg:left-60` (accounts for sidebar)
- Background: `bg-[#1a1a2e]` (dark navy), white text
- Left: pulsing red dot (`animate-ping`) + "Monitoring · {agent} · {caller}"
- Center: simulated waveform bars (60 bars, `bg-primary-400`, heights from sin/cos)
- Right: Mute button (outline white) + Leave button (`bg-red-600`)

---

## 5. History Tab

### 5.1 HistoryTable

**Controls:** Search input (full width) + outcome dropdown filter + call count + "Export CSV" button.

**Outcome filter options:** All outcomes, completed, caller_hangup, supervisor_end, error.

**Export CSV:** Downloads real CSV file with columns: call_id, started_at, agent, caller, duration, cost.

**Table columns:**

| Column | Content | Style |
|---|---|---|
| STARTED | YYYY-MM-DD HH:MM | `text-xs` |
| TENANT | TenantBadge | colored badge |
| AGENT | agent_name | `font-mono text-xs` |
| CALLER | caller_number + caller_name below | mono + 11px neutral-500 |
| INTENT | text + optional "supervised" badge | purple border badge if supervised_by set |
| DURATION | MM:SS | `font-mono text-xs` |
| OUTCOME | dot + state + end_reason below | colored dot from `OUTCOME_DOT` map |
| COST | $X.XX | `font-mono` |
| TOOLS | ToolBadge list | monospace border badges, flex-wrap |
| › | chevron link | Links to `/admin/calls/[id]` |

Rows clickable → opens HistoryDetail.

**Outcome dot colors:**
| end_reason | Color |
|---|---|
| `completed` | `bg-emerald-500` |
| `caller_hangup` | `bg-slate-400` |
| `agent_hangup` | `bg-slate-400` |
| `supervisor_end` | `bg-purple-500` |
| `error` | `bg-red-500` |
| `timeout` | `bg-amber-500` |

### 5.2 HistoryDetail

Full-page view replacing the table.

**1. Back bar**
- "← Back to history" (left)
- Right: outcome pill (dot + state) + optional "supervised by {email}" badge (purple)

**2. Caller header card**
- Left: phone icon avatar (`h-12 w-12 rounded-full bg-neutral-100`) + phone + name + "handled by **agent** · direction · channel"
- Right: STARTED / DURATION / COST stats

**3. Action buttons row**
- "Export transcript" (text link, downloads .txt file)
- "Download recording" (outline button, shows toast)
- "Open full replay" (primary button, links to `/admin/calls/[id]`)

**4. Content grid** (`grid lg:grid-cols-[1fr_340px]`)
- Left: Transcript preview card — hardcoded dummy chat bubbles (caller left, agent right)
- Right: Context card (table: Intent, End reason, Channel, Direction, Tenant, Call ID) + Tools used card

---

## 6. Replay Page (`/admin/calls/[callId]`)

Separate page route. Full-height layout.

### 6.1 Header

- Breadcrumb: `Platform / Calls · Replay`
- "← Back to history" link
- Call summary line: **agent** · phone · caller · date · duration · ● status · optional supervised badge · cost

### 6.2 Action buttons

- "Export transcript" — downloads real transcript data as .txt
- "Download recording" — shows toast notification

### 6.3 Timeline

Card with `TIMELINE` label + time display (`MM:SS / MM:SS`).

- Horizontal track line (`h-0.5 bg-neutral-200`)
- Colored dot markers at event positions:
  - Events: blue (info), amber (warning), red (error)
  - Tools: emerald (ok), red (error/timeout)
- Playhead: black vertical bar with triangle pointer top
- Time labels: 00:00 (left), midpoint (center), total (right)
- Click anywhere to seek

### 6.4 Transcript + Event Inspector

Two-column grid: `lg:grid-cols-[1fr_380px]`.

**Transcript panel:**
- Label: `TRANSCRIPT` + turn count
- Chat bubbles: caller on left (`bg-neutral-100`), agent on right (`bg-primary-50`), supervisor (`bg-purple-50`)
- Each bubble: role label (uppercase, 11px bold) + timestamp (mono 10px) + text (13px)
- Active turn (matching playhead): `ring-2 ring-primary-400`
- Click bubble to seek

**Event Inspector panel:**
- Label: `EVENT INSPECTOR` + `@ MM:SS` (playhead time)
- Merged list of events + tool executions, sorted by time
- Each item: timestamp (mono 11px neutral-400) + name + details + type badge
- Type badges with colors:

| Type | Colors |
|---|---|
| STATE_CHANGE | `bg-slate-100 text-slate-600` |
| MODEL_INVOCATION | `bg-blue-100 text-blue-700` |
| ASR_EVENT | `bg-amber-100 text-amber-700` |
| TOOL | `bg-emerald-100 text-emerald-700` |
| HANDOFF | `bg-purple-100 text-purple-700` |
| TTS_EVENT | `bg-sky-100 text-sky-700` |

- Tool items show: tool_name (mono, red if error) + status + latency_ms + error message if failed
- Click any item to seek

### 6.5 Audio Player

Bottom card with play button + speed controls + waveform + time.

- Play button: `h-10 w-10 rounded-full bg-primary-600 text-white` (disabled in design pack)
- Speed controls: 0.5×, **1×** (active: `bg-neutral-900 text-white`), 1.5×, 2×
- Waveform: 120 simulated bars, filled up to playhead position (`bg-primary-500` played, `bg-neutral-300` remaining)
- Time: `MM:SS / MM:SS` (mono 12px)
- Click waveform to seek

### 6.6 Shared Playhead

All panels share a single `playheadMs` state. Any component can call `onSeek(ms)`:
- Timeline click → updates playhead
- Transcript bubble click → seeks to turn start
- Event Inspector item click → seeks to event time
- Audio waveform click → seeks to position
- Active transcript turn highlights with ring

---

## 7. Data Types

### AdminLiveCall

```typescript
{
  id: string;
  tenant_id: string;
  tenant_name: string;
  agent_id: string;
  agent_name: string;        // e.g. "booking_assistant"
  agent_version: string;     // e.g. "7"
  state: CallState;          // "ringing" | "in_progress" | "on_hold" | "supervised" | ...
  direction: "inbound" | "outbound";
  caller_number: string;     // masked, e.g. "+1 415 ••• 4421"
  caller_name: string | null;
  callee_number: string;
  channel: CallChannel;      // "pstn" | "sip" | "web" | "test"
  started_at: string;        // ISO
  duration_ms: number;
  current_intent: string | null;
  cost_cents: number;
  latency_ms: number | null;
  tools: string[];           // e.g. ["check_availability"]
}
```

### AdminHistoricalCall

```typescript
{
  // ...same base fields...
  end_reason: CallEndReason;  // "completed" | "caller_hangup" | "supervisor_end" | "error" | ...
  ended_at: string;
  current_intent: string | null;
  tools: string[];
  supervised_by: string | null;  // email of supervisor, e.g. "hanif@manibo.com"
}
```

### AdminCallReplay (replay page)

```typescript
{
  call: AdminLiveCall & { end_reason?, ended_at?, recording_uri? };
  transcript: TranscriptTurn[];   // seq, role, started_at_ms, ended_at_ms, text, confidence
  events: CallEvent[];            // at_ms, kind, severity, payload, label
  tool_executions: ToolExecution[]; // tool_name, status, arguments, result, error, latency_ms
  recording: CallRecording | null;
}
```

---

## 8. Mock Data

| Dataset | Count | Source |
|---|---|---|
| Live calls | 6 | `fixtures.ts → adminLiveCalls` |
| History calls | 7 | `fixtures.ts → adminCallHistory` |
| Replay transcript | 7 turns | `fixtures.ts → adminCallReplay.transcript` |
| Replay events | 7 events | `fixtures.ts → adminCallReplay.events` |
| Replay tools | 4 executions | `fixtures.ts → adminCallReplay.tool_executions` |
| Tenants | 3 | `fixtures.ts → adminTenants` (Northstar, Acme Foods, Vista Health) |

Dispatcher routes: `/admin/calls/live`, `/admin/calls/history`, `/admin/calls/*/replay`.

---

## 9. Typography & Spacing

| Element | Size | Weight | Font |
|---|---|---|---|
| Breadcrumb | 13px | medium (active), regular (path) | Inter |
| Tab labels | 13px | medium | Inter |
| Tab count badges | 10px | semibold | Inter |
| Table headers | 11px uppercase tracking-wider | semibold | Inter |
| Table cells | 13px | regular | Inter |
| Monospace values (phone, call ID, cost, duration) | 12-13px | regular | JetBrains Mono (font-mono) |
| Section labels (CONTEXT, TOOL ACTIVITY, etc.) | 11px uppercase tracking-wider | semibold | Inter |
| Call header phone | 20px | bold tracking-tight | Inter |
| Stats values (DURATION/COST/LATENCY) | 15px | semibold | JetBrains Mono |
| Chat bubble text | 13px leading-relaxed | regular | Inter |
| Chat role labels | 11px uppercase | bold | Inter |

---

## 10. Color Tokens

All colors use CSS custom properties (`var(--color-*)`) from the design system, plus Tailwind utilities for state-specific colors:

| Usage | Token / Class |
|---|---|
| Page background | `bg-white` |
| Borders | `border-[var(--color-border)]` |
| Subtle backgrounds | `bg-[var(--color-bg-subtle)]` |
| Primary actions | `bg-[var(--color-primary-600)]` |
| Tenant badges | `bg-[var(--color-primary-100)]` / `text-[var(--color-primary-700)]` |
| Muted text | `text-[var(--color-neutral-500)]` |
| Label text | `text-[var(--color-neutral-400)]` |
| Monitor bar | `bg-[#1a1a2e]` (hardcoded dark navy) |
| Listen-in active | `bg-emerald-500 border-emerald-400 text-white` |
| Supervised badge | `border-purple-200 bg-purple-50 text-purple-700` |
| Error/failed | `bg-red-500` (dot) / `bg-red-100 text-red-700` (badge) |
| Toast notification | `bg-[#1a1a2e] text-white` fixed bottom center |
