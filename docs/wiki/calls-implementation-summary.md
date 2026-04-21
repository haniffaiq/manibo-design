# Calls Admin Module — Implementation Summary

| | |
|---|---|
| **Status** | Implemented (design pack) |
| **Implements** | `call-admin-module.md` (design doc) |
| **Last updated** | 2026-04-18 |
| **Files** | See File Map below |

---

## 1. What Was Built

The Calls module provides a single surface in the Deployment Console for platform admins to **observe, intervene in, and audit** voice-AI calls across all tenants. It is fully functional with mock data for the design pack.

### 1.1 Pages

| Route | Purpose |
|---|---|
| `/admin/calls` | Main calls page with Live and History tabs |
| `/admin/calls/[callId]` | Call Replay page for historical call inspection |

### 1.2 Features Implemented

**Live tab:**
- Full-width table: AGENT, TENANT, CALLER, INTENT, DURATION, STATUS, COST
- Status filter chips: All, in prog., on hold, supervised, ringing
- Search by agent, caller, intent
- Tenant dropdown with "All tenants" and per-tenant live count badges
- Click row to open live call detail

**Live call detail:**
- Caller header card with phone, name, agent info, duration/cost/latency stats
- Three action cards with full interactive behavior:
  - **Listen in**: Toggles green active state, shows Monitor Bar pinned at page bottom with waveform, Mute, and Leave controls
  - **Take over**: Opens modal dialog with caller/agent/impact info, required reason textarea, announce checkbox, confirm/cancel
  - **End call**: Changes status to "ended", shows toast "Call ended by supervisor."
- Live transcript (auto-streaming via SSE)
- Context panel (intent, channel, direction, call ID)
- Tool Activity panel with tool names and latency

**History tab:**
- Full-width table: STARTED, TENANT, AGENT, CALLER, INTENT, DURATION, OUTCOME, COST, TOOLS
- Search and outcome filter dropdown
- Call count and Export CSV button (downloads real CSV)
- Click row to open history detail

**History detail:**
- Caller header card with phone icon, phone number, name, agent, started/duration/cost stats
- Action buttons: Export transcript (downloads .txt), Download recording (toast), Open full replay (links to replay page)
- Transcript preview with chat bubbles (caller left, agent right)
- Context table and Tools used panel

**Call Replay page (`/admin/calls/[callId]`):**
- Breadcrumb: `Platform / Calls · Replay`
- Back link + header: agent, phone, caller, date, duration, status, supervised badge, cost
- Export transcript / Download recording buttons (functional with dummy data)
- Timeline scrubber with colored dot markers and playhead (click to seek)
- Transcript panel with role-colored chat bubbles synced to playhead
- Event Inspector with merged events + tool executions, type badges (STATE_CHANGE, TOOL, MODEL_INVOCATION, etc.)
- Audio player with play button, speed controls (0.5x-2x), simulated waveform, time display

**Navigation:**
- "Calls" nav item under Platform section in deployment sidebar (with NEW badge in prototype)
- Breadcrumb bar: `Platform / Calls · Live · All tenants` or `Calls · History · Tenant Name`

**Login:**
- Three demo login buttons: Platform Admin, Tenant Admin, Operator (with correct UUIDs)

---

## 2. File Map

### Pages

| File | Purpose |
|---|---|
| `web/src/app/(deployment)/admin/calls/page.tsx` | Main calls page (Live table, History table, Live detail, History detail, Takeover modal, Monitor bar) |
| `web/src/app/(deployment)/admin/calls/[callId]/page.tsx` | Call Replay page (Timeline, Transcript, Event Inspector, Audio player) |

### API Layer

| File | Purpose |
|---|---|
| `web/src/lib/api/admin-calls.ts` | Types (`AdminLiveCall`, `AdminHistoricalCall`, `AdminCallReplay`, etc.) and fetch functions |
| `web/src/lib/swr-keys.ts` | SWR cache keys: `adminLiveCalls`, `adminCallHistory`, `adminCallReplay` |

### Mock Data

| File | Purpose |
|---|---|
| `web/src/lib/mock/fixtures.ts` | Mock data: `adminLiveCalls` (6 calls, 3 tenants), `adminCallHistory` (7 calls), `adminCallReplay` (transcript, events, tool executions, recording) |
| `web/src/lib/mock/dispatcher.ts` | Routes: `/admin/calls/live`, `/admin/calls/history`, `/admin/calls/*/replay` |

### Navigation

| File | Change |
|---|---|
| `web/src/lib/deployment-workbench.ts` | Added `Calls` nav item under Platform section |
| `web/src/app/(auth)/login/login-form.tsx` | Added demo login buttons (Platform Admin, Tenant Admin, Operator) |

### Removed (from prior session)

| File | Reason |
|---|---|
| `web/src/components/tenant-shell.tsx` | Removed `/settings/recordings` link from sidebar footer (settings page was deleted) |
| `web/src/lib/tenant-workbench.ts` | Removed observability and settings nav items |
| `web/src/lib/deployment-workbench.ts` | Removed observability, releases, health, channels, settings nav items |

---

## 3. Data Model

### AdminLiveCall

```typescript
{
  id, tenant_id, tenant_name, agent_id, agent_name, agent_version,
  state: "ringing" | "in_progress" | "on_hold" | "supervised" | "wrapping_up" | "ended" | "failed",
  direction, caller_number, caller_name, callee_number, channel,
  started_at, duration_ms, current_intent, cost_cents, latency_ms, tools[]
}
```

### AdminHistoricalCall

```typescript
{
  id, tenant_id, tenant_name, agent_name, state, end_reason,
  direction, caller_number, caller_name, callee_number, channel,
  started_at, ended_at, duration_ms, cost_cents,
  current_intent, tools[], supervised_by
}
```

### AdminCallReplay

```typescript
{
  call: { ...AdminLiveCall, end_reason, ended_at, recording_uri },
  transcript: TranscriptTurn[],
  events: CallEvent[],
  tool_executions: ToolExecution[],
  recording: CallRecording | null
}
```

---

## 4. Design Decisions

1. **Full-width table layout** (not master-detail split) for both Live and History tabs — matches the prototype HTML and Vapi-style dashboard patterns. Call detail is a separate full-page view, not a side drawer.

2. **Custom tab bar** (not @grove/ui Tabs) with pill-style tabs containing live dot, clock icon, and count badges — matches prototype SubHeader exactly.

3. **Tenant dropdown on the right** of the tab bar with per-tenant live count badges showing pulsing dots — follows prototype `TenantDropdown` component.

4. **Action cards** for Listen in / Take over / End call are stateful interactive cards, not simple buttons:
   - Listen in toggles green active state and shows a pinned Monitor Bar
   - Take over opens a proper modal with impact info and required reason
   - End call changes status and shows toast

5. **Replay page** uses a shared playhead state — clicking transcript turns, timeline markers, or events all seek the same time position across all panels.

6. **All buttons functional** with dummy data — Export CSV downloads real CSV, Export transcript downloads .txt, Download recording shows toast, action cards have full interaction flows.

---

## 5. Mock Data Coverage

| Data | Count | Tenants | Notes |
|---|---|---|---|
| Live calls | 6 | Northstar, Acme Foods, Vista Health | Various states: in_progress, on_hold, supervised, ringing |
| History calls | 7 | Northstar | Various outcomes: completed, caller_hangup, supervisor_end, error |
| Replay data | 1 | Northstar | 7 transcript turns, 7 events, 4 tool executions |
| Tenants | 3 | — | From existing `adminTenants` fixture |

---

## 6. Coverage vs Design Doc

| Design Doc Section | Status | Notes |
|---|---|---|
| §2.1 Live call monitoring | Done | Table + detail view with streaming transcript |
| §2.2 Listen-in | Done | Green card, monitor bar with waveform/mute/leave |
| §2.3 Take-over | Done | Modal with caller/agent/impact, reason, announce checkbox |
| §2.4 Historical call inspection | Done | History table + detail view + full replay page |
| §3.1 Information architecture | Done | Calls under Platform, Live/History tabs |
| §3.2 Live tab layout | Done | Table layout (adapted from prototype) |
| §3.3 History tab | Done | Table with filters + detail view |
| §3.4 Call Replay layout | Done | Timeline + Transcript + Event Inspector + Audio player |
| §3.5 Key components | Done | StatusPill, TranscriptTurn (chat bubbles), waveform, ToolBadge, MonitorBar |
| §4 Data model | Partial | Types defined, mock data matches schema; no real DB |
| §5 API design | Partial | Client fetch functions defined; mock dispatcher handles routes |
| §7.2 Roles | Not yet | All views visible to all roles (design pack only) |
| §9 Edge cases | Not yet | Design pack — no real WebRTC/SSE connections |
| §10 Future extensions | Not started | Analytics, search, AI summarisation, coaching |
