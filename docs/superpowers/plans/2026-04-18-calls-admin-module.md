# Calls Admin Module — Implementation Plan

> **Status: COMPLETED** — All tasks executed 2026-04-18. See `docs/wiki/calls-implementation-summary.md` for full implementation details.

**Goal:** Add a "Calls" admin module to the Deployment Console with Live/History tabs, demo tenant login buttons, and a Call Replay view — all backed by mock data for the design pack.

**Architecture:** Full-width table layout (matching the HTML prototype) with custom SubHeader tab bar, tenant dropdown, and full-page detail views. Call Replay is a dedicated route with synced transcript/timeline/audio panels. Mock fixtures power the design pack via the existing dispatcher.

**Tech Stack:** Next.js App Router, React, SWR, @grove/ui (Badge, Button, Card), existing mock dispatcher pattern. Custom tab bar instead of @grove/ui Tabs (to match prototype).

---

## Task 1: Fix Demo Login Buttons

Add tenant demo login buttons so designers can log in as Tenant Admin or Operator without pasting tokens.

**Files:**
- Modify: `web/src/app/(auth)/login/login-form.tsx:263-271`
- Modify: `web/src/lib/mock/dev-session.ts` (import constants)

- [x] **Step 1: Update login-form.tsx dev token buttons**

Replace the single "Sign in as Demo Admin" button with three role-specific buttons. The current button uses a wrong UUID (`...0002`). Fix it to use the correct UUIDs from `dev-session.ts`.

```tsx
{devTokenAuthEnabled ? (
  <div className="mt-6 space-y-2">
    <button
      type="button"
      onClick={() => void signInWithDevToken("dev:00000000-0000-4000-a000-000000000099")}
      className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
    >
      Sign in as Platform Admin
    </button>
    <button
      type="button"
      onClick={() => void signInWithDevToken("dev:00000000-0000-4000-a000-000000000010")}
      className="w-full rounded-lg border border-[var(--color-edge)] bg-white px-3 py-2.5 text-[13px] font-medium text-[var(--color-text)] transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
    >
      Sign in as Tenant Admin
    </button>
    <button
      type="button"
      onClick={() => void signInWithDevToken("dev:00000000-0000-4000-a000-000000000020")}
      className="w-full rounded-lg border border-[var(--color-edge)] bg-white px-3 py-2.5 text-[13px] font-medium text-[var(--color-text)] transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
    >
      Sign in as Operator
    </button>
    <details className="group">
      <!-- keep existing "Sign in with a different token" expandable section unchanged -->
    </details>
  </div>
) : /* rest stays the same */}
```

- [x] **Step 2: Verify dev identities match**

Confirm the three UUIDs match `dev-session.ts`:
- `00000000-0000-4000-a000-000000000099` → SuperAdmin (platform-admin@manibo.dev)
- `00000000-0000-4000-a000-000000000010` → ClientAdmin (ayu@northstar.example)
- `00000000-0000-4000-a000-000000000020` → ClientOperator (bagas@northstar.example)

- [x] **Step 3: Commit**

```bash
git add web/src/app/\(auth\)/login/login-form.tsx
git commit -m "feat: add tenant demo login buttons (admin + operator)"
```

---

## Task 2: Add "Calls" Nav Item to Deployment Sidebar

Per the design doc §3.1, Calls sits under Platform next to Audit.

**Files:**
- Modify: `web/src/lib/deployment-workbench.ts:36-39`

- [x] **Step 1: Add Calls item to Platform section**

```typescript
{
  title: "Platform",
  items: [
    { label: "Audit", href: "/admin/audit", icon: "shield" },
    { label: "Calls", href: "/admin/calls", icon: "phone" },
  ],
},
```

- [x] **Step 2: Commit**

```bash
git add web/src/lib/deployment-workbench.ts
git commit -m "feat: add Calls nav item to deployment sidebar"
```

---

## Task 3: Create Mock Fixtures for Admin Calls

Add mock data for the Calls module to the existing fixtures file.

**Files:**
- Modify: `web/src/lib/mock/fixtures.ts` (append new exports)
- Modify: `web/src/lib/mock/dispatcher.ts` (add routes)

- [x] **Step 1: Add admin call fixtures to fixtures.ts**

Append after the `adminAuditEvents` block:

```typescript
/* ---------------------------------------------------------------- */
/*  Admin: calls                                                     */
/* ---------------------------------------------------------------- */

export const adminLiveCalls = {
  calls: [
    {
      id: "call_live_001",
      tenant_id: TENANT_ID,
      tenant_name: TENANT_NAME,
      agent_id: "agent_002",
      agent_name: "Clinic Booking Assistant",
      agent_version: "3",
      state: "in_progress" as const,
      direction: "inbound" as const,
      caller_number: "+6281230001012",
      callee_number: "+12065550105",
      channel: "pstn" as const,
      started_at: "2026-04-16T05:20:02Z",
      duration_ms: 221000,
      current_intent: "Reschedule appointment",
      cost_cents: 18,
    },
    {
      id: "call_live_002",
      tenant_id: TENANT_ID,
      tenant_name: TENANT_NAME,
      agent_id: "agent_001",
      agent_name: "Northstar Driver Verifier",
      agent_version: "8",
      state: "ringing" as const,
      direction: "outbound" as const,
      caller_number: "+12065550101",
      callee_number: "+6281230002001",
      channel: "pstn" as const,
      started_at: "2026-04-16T05:28:00Z",
      duration_ms: 0,
      current_intent: null,
      cost_cents: 0,
    },
    {
      id: "call_live_003",
      tenant_id: TENANT_ID,
      tenant_name: TENANT_NAME,
      agent_id: "agent_002",
      agent_name: "Clinic Booking Assistant",
      agent_version: "3",
      state: "supervised" as const,
      direction: "inbound" as const,
      caller_number: "+6281230001020",
      callee_number: "+12065550105",
      channel: "pstn" as const,
      started_at: "2026-04-16T05:10:00Z",
      duration_ms: 1080000,
      current_intent: "Complaint about wait time",
      cost_cents: 42,
    },
    {
      id: "call_live_004",
      tenant_id: "ten_01JTCLINIC000002",
      tenant_name: "Satelit Clinic Group",
      agent_id: "agent_005",
      agent_name: "Satelit Intake Bot",
      agent_version: "2",
      state: "in_progress" as const,
      direction: "inbound" as const,
      caller_number: "+6281230003001",
      callee_number: "+12065550110",
      channel: "sip" as const,
      started_at: "2026-04-16T05:25:00Z",
      duration_ms: 180000,
      current_intent: "New patient registration",
      cost_cents: 8,
    },
  ],
};

export const adminCallHistory = {
  calls: [
    {
      id: "call_adm_hist_001",
      tenant_id: TENANT_ID,
      tenant_name: TENANT_NAME,
      agent_name: "Northstar Driver Verifier",
      state: "ended" as const,
      end_reason: "completed" as const,
      direction: "outbound" as const,
      caller_number: "+12065550101",
      callee_number: "+6281230001001",
      channel: "pstn" as const,
      started_at: "2026-04-16T03:12:00Z",
      ended_at: "2026-04-16T03:17:04Z",
      duration_ms: 304000,
      cost_cents: 22,
    },
    {
      id: "call_adm_hist_002",
      tenant_id: TENANT_ID,
      tenant_name: TENANT_NAME,
      agent_name: "Clinic Booking Assistant",
      state: "ended" as const,
      end_reason: "caller_hangup" as const,
      direction: "inbound" as const,
      caller_number: "+6281230001009",
      callee_number: "+12065550105",
      channel: "pstn" as const,
      started_at: "2026-04-16T02:42:00Z",
      ended_at: "2026-04-16T02:51:45Z",
      duration_ms: 585000,
      cost_cents: 38,
    },
    {
      id: "call_adm_hist_003",
      tenant_id: "ten_01JTCLINIC000002",
      tenant_name: "Satelit Clinic Group",
      agent_name: "Satelit Intake Bot",
      state: "ended" as const,
      end_reason: "supervisor_end" as const,
      direction: "inbound" as const,
      caller_number: "+6281230003005",
      callee_number: "+12065550110",
      channel: "sip" as const,
      started_at: "2026-04-16T01:30:00Z",
      ended_at: "2026-04-16T01:38:22Z",
      duration_ms: 502000,
      cost_cents: 30,
    },
    {
      id: "call_adm_hist_004",
      tenant_id: TENANT_ID,
      tenant_name: TENANT_NAME,
      agent_name: "Northstar Driver Verifier",
      state: "ended" as const,
      end_reason: "error" as const,
      direction: "outbound" as const,
      caller_number: "+12065550101",
      callee_number: "+6281230002010",
      channel: "pstn" as const,
      started_at: "2026-04-16T00:15:00Z",
      ended_at: "2026-04-16T00:15:42Z",
      duration_ms: 42000,
      cost_cents: 2,
    },
  ],
  total: 248,
};

export const adminCallReplay = {
  call: {
    id: "call_adm_hist_002",
    tenant_id: TENANT_ID,
    tenant_name: TENANT_NAME,
    agent_id: "agent_002",
    agent_name: "Clinic Booking Assistant",
    agent_version: "3",
    state: "ended" as const,
    end_reason: "caller_hangup" as const,
    direction: "inbound" as const,
    caller_number: "+6281230001009",
    callee_number: "+12065550105",
    channel: "pstn" as const,
    started_at: "2026-04-16T02:42:00Z",
    ended_at: "2026-04-16T02:51:45Z",
    duration_ms: 585000,
    cost_cents: 38,
    recording_uri: "s3://recordings/call_adm_hist_002.opus",
  },
  transcript: [
    { id: "tt_001", seq: 1, role: "agent" as const, started_at_ms: 0, ended_at_ms: 2200, text: "Halo, terima kasih sudah menelepon. Ada yang bisa saya bantu?", confidence: 0.95, language: "id-ID" },
    { id: "tt_002", seq: 2, role: "caller" as const, started_at_ms: 3000, ended_at_ms: 7100, text: "Saya mau ubah jadwal kontrol saya ke hari Jumat sore kalau masih ada slot.", confidence: 0.91, language: "id-ID" },
    { id: "tt_003", seq: 3, role: "agent" as const, started_at_ms: 8000, ended_at_ms: 11500, text: "Tentu, saya cek slot yang tersedia untuk hari Jumat sore ya.", confidence: 0.97, language: "id-ID" },
    { id: "tt_004", seq: 4, role: "agent" as const, started_at_ms: 15000, ended_at_ms: 20200, text: "Maaf, saya kesulitan mencari jadwal saat ini. Saya coba sekali lagi.", confidence: 0.93, language: "id-ID" },
    { id: "tt_005", seq: 5, role: "agent" as const, started_at_ms: 38000, ended_at_ms: 45000, text: "Mohon maaf, sepertinya sistem penjadwalan sedang lambat. Saya sambungkan ke petugas klinik ya.", confidence: 0.96, language: "id-ID" },
    { id: "tt_006", seq: 6, role: "caller" as const, started_at_ms: 46000, ended_at_ms: 48500, text: "Ya sudah, terima kasih.", confidence: 0.94, language: "id-ID" },
    { id: "tt_007", seq: 7, role: "agent" as const, started_at_ms: 49000, ended_at_ms: 53000, text: "Sama-sama. Sebentar ya, saya sambungkan sekarang.", confidence: 0.97, language: "id-ID" },
  ],
  events: [
    { id: "ev_001", at_ms: 0, kind: "state_change" as const, severity: "info" as const, payload: { from: null, to: "in_progress" }, label: "Call started" },
    { id: "ev_002", at_ms: 11500, kind: "model_invocation" as const, severity: "info" as const, payload: { model: "gpt-4o", tokens: 820, latency_ms: 980 }, label: "LLM invocation" },
    { id: "ev_003", at_ms: 12500, kind: "asr_event" as const, severity: "info" as const, payload: { provider: "deepgram", latency_ms: 320 }, label: "ASR transcription" },
    { id: "ev_004", at_ms: 15000, kind: "state_change" as const, severity: "warning" as const, payload: { detail: "Schedule connector lookup timeout (2.1s)" }, label: "Tool timeout" },
    { id: "ev_005", at_ms: 36000, kind: "state_change" as const, severity: "warning" as const, payload: { detail: "Second lookup attempt timeout (2.4s)" }, label: "Tool retry timeout" },
    { id: "ev_006", at_ms: 50000, kind: "handoff" as const, severity: "info" as const, payload: { queue: "clinic-front-desk", reason: "Schedule connector unreachable" }, label: "Escalated to human" },
    { id: "ev_007", at_ms: 585000, kind: "state_change" as const, severity: "info" as const, payload: { from: "in_progress", to: "ended", end_reason: "caller_hangup" }, label: "Call ended" },
  ],
  tool_executions: [
    { id: "te_001", turn_id: "tt_003", tool_name: "lookup_slots", tool_version: "1.2", started_at_ms: 11500, ended_at_ms: 12480, status: "ok" as const, arguments: { specialty: "dermatology", date: "2026-04-18" }, result: { slots: ["10:00", "14:00", "16:00"] }, latency_ms: 980 },
    { id: "te_002", turn_id: "tt_004", tool_name: "lookup_slots", tool_version: "1.2", started_at_ms: 15000, ended_at_ms: 17100, status: "timeout" as const, arguments: { specialty: "dermatology", date: "2026-04-18", confirm: true }, result: null, error: { code: "TIMEOUT", message: "Connector timeout after 2100ms" }, latency_ms: 2100 },
    { id: "te_003", turn_id: "tt_004", tool_name: "lookup_slots", tool_version: "1.2", started_at_ms: 36000, ended_at_ms: 38400, status: "timeout" as const, arguments: { specialty: "dermatology", date: "2026-04-18", confirm: true }, result: null, error: { code: "TIMEOUT", message: "Connector timeout after 2400ms" }, latency_ms: 2400 },
    { id: "te_004", turn_id: "tt_005", tool_name: "transfer_to_human", tool_version: "1.0", started_at_ms: 50000, ended_at_ms: 51200, status: "ok" as const, arguments: { queue: "clinic-front-desk", reason: "Schedule connector unreachable" }, result: { transferred: true }, latency_ms: 1200 },
  ],
  recording: {
    id: "rec_adm_001",
    codec: "opus" as const,
    sample_rate: 16000,
    channels: 2,
    duration_ms: 585000,
    bytes: 468000,
    waveform_peaks_uri: null,
  },
};
```

- [x] **Step 2: Add dispatcher routes for admin calls**

In `dispatcher.ts`, add before the `// ---- Admin: health / reports ----` section:

```typescript
// ---- Admin: calls ---- //
if (path === "/admin/calls/live") return ok(fx.adminLiveCalls);
if (path === "/admin/calls/history") return ok(fx.adminCallHistory);
if (path.startsWith("/admin/calls/") && path.endsWith("/replay")) {
  return ok(fx.adminCallReplay);
}
if (path.startsWith("/admin/calls/")) {
  return ok(fx.adminCallReplay);
}
```

- [x] **Step 3: Commit**

```bash
git add web/src/lib/mock/fixtures.ts web/src/lib/mock/dispatcher.ts
git commit -m "feat: add mock fixtures and dispatcher routes for admin calls"
```

---

## Task 4: Create Admin Calls API Functions

Create the API layer that the page components will call.

**Files:**
- Create: `web/src/lib/api/admin-calls.ts`
- Modify: `web/src/lib/swr-keys.ts` (add keys)

- [x] **Step 1: Create admin-calls.ts**

```typescript
import { platformApiFetch } from "@/lib/platform-api";

export type CallState = "ringing" | "in_progress" | "on_hold" | "supervised" | "wrapping_up" | "ended" | "failed";
export type CallEndReason = "completed" | "caller_hangup" | "agent_hangup" | "supervisor_end" | "error" | "timeout";
export type CallChannel = "pstn" | "sip" | "web" | "test";
export type TranscriptRole = "caller" | "agent" | "supervisor" | "system";
export type EventKind = "state_change" | "model_invocation" | "asr_event" | "tts_event" | "dtmf" | "handoff" | "supervisor_action" | "log";
export type EventSeverity = "debug" | "info" | "warn" | "warning" | "error";
export type ToolStatus = "ok" | "error" | "timeout" | "cancelled";

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
  callee_number: string;
  channel: CallChannel;
  started_at: string;
  duration_ms: number;
  current_intent: string | null;
  cost_cents: number;
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
  callee_number: string;
  channel: CallChannel;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  cost_cents: number;
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

export async function listAdminLiveCalls(): Promise<{ calls: AdminLiveCall[] }> {
  return platformApiFetch("/admin/calls/live");
}

export async function listAdminCallHistory(params?: {
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
  return platformApiFetch(`/admin/calls/history${qs ? `?${qs}` : ""}`);
}

export async function getAdminCallReplay(callId: string): Promise<AdminCallReplay> {
  return platformApiFetch(`/admin/calls/${encodeURIComponent(callId)}/replay`);
}
```

- [x] **Step 2: Add SWR keys**

Check `web/src/lib/swr-keys.ts` and add:

```typescript
export function adminLiveCalls() { return ["admin-live-calls"] as const; }
export function adminCallHistory(tenantId: string | null) { return ["admin-call-history", tenantId] as const; }
export function adminCallReplay(callId: string) { return ["admin-call-replay", callId] as const; }
```

- [x] **Step 3: Commit**

```bash
git add web/src/lib/api/admin-calls.ts web/src/lib/swr-keys.ts
git commit -m "feat: add API types and SWR keys for admin calls"
```

---

## Task 5: Create Calls Admin Page (Live + History Tabs)

The main page with two tabs: Live (real-time call list + detail drawer) and History (filterable table + detail drawer).

**Files:**
- Create: `web/src/app/(deployment)/admin/calls/page.tsx`

- [x] **Step 1: Create the Calls page with Live and History tabs**

```tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@grove/ui/tabs";
import { AdminPageShell } from "@/components/admin-page-shell";
import {
  listAdminLiveCalls,
  listAdminCallHistory,
  type AdminLiveCall,
  type AdminHistoricalCall,
  type CallState,
} from "@/lib/api/admin-calls";
import * as swrKeys from "@/lib/swr-keys";

/* ---------- helpers ---------- */

const STATE_VARIANTS: Record<string, "success" | "warning" | "neutral" | "info"> = {
  ringing: "info",
  in_progress: "success",
  on_hold: "warning",
  supervised: "warning",
  wrapping_up: "neutral",
  ended: "neutral",
  failed: "warning",
};

function stateVariant(state: string) {
  return STATE_VARIANTS[state] ?? "neutral";
}

function stateLabel(state: string) {
  return state.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleString();
}

/* ---------- Call Detail Drawer ---------- */

function LiveCallDetail({ call }: { call: AdminLiveCall }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{call.agent_name}</h3>
          <Badge variant={stateVariant(call.state)}>{stateLabel(call.state)}</Badge>
        </div>
        <p className="text-xs text-[var(--color-neutral-500)]">{call.tenant_name}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-medium text-[var(--color-neutral-500)]">Call ID</p>
            <p className="font-mono text-xs">{call.id}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--color-neutral-500)]">Direction</p>
            <p>{call.direction}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--color-neutral-500)]">Caller</p>
            <p className="font-mono text-xs">{call.caller_number}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--color-neutral-500)]">Callee</p>
            <p className="font-mono text-xs">{call.callee_number}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--color-neutral-500)]">Duration</p>
            <p>{formatDuration(call.duration_ms)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--color-neutral-500)]">Channel</p>
            <p className="uppercase text-xs">{call.channel}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--color-neutral-500)]">Agent version</p>
            <p>v{call.agent_version}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--color-neutral-500)]">Cost</p>
            <p>${(call.cost_cents / 100).toFixed(2)}</p>
          </div>
        </div>
        {call.current_intent ? (
          <div>
            <p className="text-xs font-medium text-[var(--color-neutral-500)]">Current intent</p>
            <p className="mt-0.5 text-sm">{call.current_intent}</p>
          </div>
        ) : null}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" disabled>Listen in</Button>
          <Button variant="outline" size="sm" disabled>Take over</Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Live Tab ---------- */

function LiveTab() {
  const { data, isLoading } = useSWR(
    swrKeys.adminLiveCalls(),
    listAdminLiveCalls,
    { revalidateOnFocus: false, refreshInterval: 10_000 },
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const calls = data?.calls ?? [];
  const selectedCall = useMemo(() => calls.find((c) => c.id === selectedId) ?? null, [calls, selectedId]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card className="self-start">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Live calls</h2>
            <Badge variant="neutral">{calls.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)]" />
              ))}
            </div>
          ) : calls.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-neutral-500)]">No live calls.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {calls.map((call) => (
                <li key={call.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(call.id)}
                    className={`w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-colors ${
                      selectedId === call.id
                        ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)]"
                        : "border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-primary-300)] hover:bg-[var(--color-bg-subtle)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{call.agent_name}</span>
                      <Badge variant={stateVariant(call.state)}>{stateLabel(call.state)}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-neutral-500)]">
                      <span>{call.tenant_name}</span>
                      <span>{call.caller_number}</span>
                      <span>{formatDuration(call.duration_ms)}</span>
                    </div>
                    {call.current_intent ? (
                      <p className="mt-1 truncate text-xs italic text-[var(--color-neutral-400)]">{call.current_intent}</p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="min-h-[24rem]">
        {selectedCall ? (
          <LiveCallDetail call={selectedCall} />
        ) : (
          <Card className="flex min-h-[24rem] items-center justify-center">
            <p className="text-sm text-[var(--color-neutral-500)]">Select a call to view details</p>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ---------- History Tab ---------- */

function HistoryTab() {
  const { data, isLoading } = useSWR(
    swrKeys.adminCallHistory(null),
    () => listAdminCallHistory(),
    { revalidateOnFocus: false },
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const calls = data?.calls ?? [];
  const selectedCall = useMemo(() => calls.find((c) => c.id === selectedId) ?? null, [calls, selectedId]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Card className="self-start">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">History</h2>
            <span className="text-xs text-[var(--color-neutral-500)]">{data?.total ?? 0} total</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)]" />
              ))}
            </div>
          ) : calls.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-neutral-500)]">No historical calls.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {calls.map((call) => (
                <li key={call.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(call.id)}
                    className={`w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-colors ${
                      selectedId === call.id
                        ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)]"
                        : "border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-primary-300)] hover:bg-[var(--color-bg-subtle)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium">{call.agent_name}</span>
                      <Badge variant={call.end_reason === "completed" ? "success" : call.end_reason === "error" ? "warning" : "neutral"}>
                        {call.end_reason}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-neutral-500)]">
                      <span>{call.tenant_name}</span>
                      <Badge variant={call.direction === "inbound" ? "neutral" : "success"} className="text-[10px]">
                        {call.direction}
                      </Badge>
                      <span>{formatDateTime(call.started_at)}</span>
                      <span>{formatDuration(call.duration_ms)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="min-h-[24rem]">
        {selectedCall ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{selectedCall.agent_name}</h3>
                <Link href={`/admin/calls/${selectedCall.id}`}>
                  <Button variant="outline" size="sm">Open replay</Button>
                </Link>
              </div>
              <p className="text-xs text-[var(--color-neutral-500)]">{selectedCall.tenant_name}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-[var(--color-neutral-500)]">Call ID</p>
                  <p className="font-mono text-xs">{selectedCall.id}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-neutral-500)]">End reason</p>
                  <Badge variant={selectedCall.end_reason === "completed" ? "success" : "warning"}>
                    {selectedCall.end_reason}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-neutral-500)]">Direction</p>
                  <p>{selectedCall.direction}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-neutral-500)]">Channel</p>
                  <p className="uppercase text-xs">{selectedCall.channel}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-neutral-500)]">Caller</p>
                  <p className="font-mono text-xs">{selectedCall.caller_number}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-neutral-500)]">Callee</p>
                  <p className="font-mono text-xs">{selectedCall.callee_number}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-neutral-500)]">Started</p>
                  <p className="text-xs">{formatDateTime(selectedCall.started_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-neutral-500)]">Duration</p>
                  <p>{formatDuration(selectedCall.duration_ms)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex min-h-[24rem] items-center justify-center">
            <p className="text-sm text-[var(--color-neutral-500)]">Select a call to view details</p>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ---------- Main Page ---------- */

export default function AdminCallsPage() {
  return (
    <AdminPageShell
      title="Calls"
      description="Observe, intervene in, and audit voice-AI calls across tenants."
    >
      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="live" className="mt-4">
          <LiveTab />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}
```

- [x] **Step 2: Commit**

```bash
git add web/src/app/\(deployment\)/admin/calls/page.tsx
git commit -m "feat: add Calls admin page with Live and History tabs"
```

---

## Task 6: Create Call Replay Page

Full-page route for historical call inspection with synced transcript, timeline, events, and tool calls (design doc §2.4 / §3.4).

**Files:**
- Create: `web/src/app/(deployment)/admin/calls/[callId]/page.tsx`

- [x] **Step 1: Create the Call Replay page**

```tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { AdminPageShell } from "@/components/admin-page-shell";
import {
  getAdminCallReplay,
  type TranscriptTurn,
  type CallEvent,
  type ToolExecution,
} from "@/lib/api/admin-calls";
import * as swrKeys from "@/lib/swr-keys";

/* ---------- helpers ---------- */

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const ROLE_COLORS: Record<string, string> = {
  agent: "bg-blue-50 border-blue-200 text-blue-900",
  caller: "bg-slate-50 border-slate-200 text-slate-900",
  supervisor: "bg-amber-50 border-amber-200 text-amber-900",
  system: "bg-gray-50 border-gray-200 text-gray-600",
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-blue-50 text-blue-700",
  warning: "bg-amber-50 text-amber-700",
  warn: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
  debug: "bg-gray-50 text-gray-500",
};

const TOOL_STATUS_VARIANTS: Record<string, "success" | "warning" | "neutral"> = {
  ok: "success",
  error: "warning",
  timeout: "warning",
  cancelled: "neutral",
};

/* ---------- Timeline Scrubber ---------- */

function TimelineScrubber({
  durationMs,
  playheadMs,
  events,
  onSeek,
}: {
  durationMs: number;
  playheadMs: number;
  events: CallEvent[];
  onSeek: (ms: number) => void;
}) {
  const pct = durationMs > 0 ? (playheadMs / durationMs) * 100 : 0;

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--color-neutral-500)] w-10">{formatMs(playheadMs)}</span>
          <div
            className="relative flex-1 h-8 rounded bg-[var(--color-bg-subtle)] cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const ms = Math.round((x / rect.width) * durationMs);
              onSeek(Math.max(0, Math.min(durationMs, ms)));
            }}
          >
            {/* Event markers */}
            {events.map((ev) => (
              <div
                key={ev.id}
                className={`absolute top-0 w-1 h-full rounded-sm ${ev.severity === "warning" || ev.severity === "warn" ? "bg-amber-400" : ev.severity === "error" ? "bg-red-400" : "bg-blue-300"}`}
                style={{ left: `${(ev.at_ms / durationMs) * 100}%` }}
                title={ev.label}
              />
            ))}
            {/* Playhead */}
            <div
              className="absolute top-0 w-0.5 h-full bg-[var(--color-primary-600)] z-10"
              style={{ left: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-[var(--color-neutral-500)] w-10 text-right">{formatMs(durationMs)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Transcript Panel ---------- */

function TranscriptPanel({
  turns,
  playheadMs,
  onSeek,
}: {
  turns: TranscriptTurn[];
  playheadMs: number;
  onSeek: (ms: number) => void;
}) {
  return (
    <Card className="self-start">
      <CardHeader>
        <h3 className="text-sm font-semibold">Transcript</h3>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {turns.map((turn) => {
            const isActive = playheadMs >= turn.started_at_ms && playheadMs <= turn.ended_at_ms;
            return (
              <li key={turn.id}>
                <button
                  type="button"
                  onClick={() => onSeek(turn.started_at_ms)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${ROLE_COLORS[turn.role] ?? ROLE_COLORS.system} ${isActive ? "ring-2 ring-[var(--color-primary-400)]" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide">{turn.role}</span>
                    <span className="text-[10px] font-mono text-[var(--color-neutral-400)]">{formatMs(turn.started_at_ms)}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed">{turn.text}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

/* ---------- Event Inspector ---------- */

function EventInspector({
  events,
  toolExecutions,
  playheadMs,
  onSeek,
}: {
  events: CallEvent[];
  toolExecutions: ToolExecution[];
  playheadMs: number;
  onSeek: (ms: number) => void;
}) {
  // Merge events + tool executions into a single timeline sorted by time
  type TimelineItem = { type: "event"; data: CallEvent } | { type: "tool"; data: ToolExecution };
  const items = useMemo<TimelineItem[]>(() => {
    const merged: TimelineItem[] = [
      ...events.map((e) => ({ type: "event" as const, data: e })),
      ...toolExecutions.map((t) => ({ type: "tool" as const, data: t })),
    ];
    merged.sort((a, b) => {
      const aMs = a.type === "event" ? a.data.at_ms : a.data.started_at_ms;
      const bMs = b.type === "event" ? b.data.at_ms : b.data.started_at_ms;
      return aMs - bMs;
    });
    return merged;
  }, [events, toolExecutions]);

  return (
    <Card className="self-start">
      <CardHeader>
        <h3 className="text-sm font-semibold">Events & tools</h3>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {items.map((item) => {
            if (item.type === "event") {
              const ev = item.data;
              return (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => onSeek(ev.at_ms)}
                    className={`w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${SEVERITY_COLORS[ev.severity] ?? SEVERITY_COLORS.info}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{ev.label}</span>
                      <span className="font-mono text-[10px]">{formatMs(ev.at_ms)}</span>
                    </div>
                  </button>
                </li>
              );
            }
            const tool = item.data;
            return (
              <li key={tool.id}>
                <button
                  type="button"
                  onClick={() => onSeek(tool.started_at_ms)}
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-[var(--color-bg-subtle)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium">{tool.tool_name}</span>
                    <Badge variant={TOOL_STATUS_VARIANTS[tool.status] ?? "neutral"} className="text-[10px]">
                      {tool.status}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--color-neutral-500)]">
                    <span>{formatMs(tool.started_at_ms)}</span>
                    <span>{tool.latency_ms}ms</span>
                  </div>
                  {tool.error ? (
                    <p className="mt-1 text-[11px] text-red-600">{tool.error.message}</p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

/* ---------- Audio Player (placeholder) ---------- */

function AudioPlayer({
  durationMs,
  playheadMs,
  onSeek,
}: {
  durationMs: number;
  playheadMs: number;
  onSeek: (ms: number) => void;
}) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>Play</Button>
          <div
            className="relative flex-1 h-6 rounded bg-[var(--color-bg-subtle)] cursor-pointer overflow-hidden"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const ms = Math.round((x / rect.width) * durationMs);
              onSeek(Math.max(0, Math.min(durationMs, ms)));
            }}
          >
            {/* Simulated waveform bars */}
            <div className="absolute inset-0 flex items-end gap-px px-0.5">
              {Array.from({ length: 80 }).map((_, i) => {
                const h = 20 + Math.sin(i * 0.4) * 30 + Math.cos(i * 0.7) * 20;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm ${i / 80 <= playheadMs / durationMs ? "bg-[var(--color-primary-500)]" : "bg-[var(--color-neutral-300)]"}`}
                    style={{ height: `${Math.max(10, Math.min(100, h))}%` }}
                  />
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-neutral-500)]">
            <span className="font-mono">{formatMs(playheadMs)} / {formatMs(durationMs)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Main Replay Page ---------- */

export default function CallReplayPage() {
  const params = useParams<{ callId: string }>();
  const callId = params.callId;

  const { data, isLoading, error } = useSWR(
    swrKeys.adminCallReplay(callId),
    () => getAdminCallReplay(callId),
    { revalidateOnFocus: false },
  );

  const [playheadMs, setPlayheadMs] = useState(0);

  if (isLoading) {
    return (
      <AdminPageShell title="Call Replay">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--color-bg-subtle)]" />
          ))}
        </div>
      </AdminPageShell>
    );
  }

  if (error || !data) {
    return (
      <AdminPageShell title="Call Replay" error={error ? String(error) : "Call not found"}>
        <Link href="/admin/calls"><Button variant="outline">Back to calls</Button></Link>
      </AdminPageShell>
    );
  }

  const { call, transcript, events, tool_executions, recording } = data;
  const durationMs = call.duration_ms || recording?.duration_ms || 0;

  return (
    <AdminPageShell
      title="Call Replay"
      description={`${call.agent_name} — ${call.caller_number}`}
      actions={<Link href="/admin/calls"><Button variant="outline" size="sm">Back to calls</Button></Link>}
    >
      {/* Call summary bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Badge variant={call.end_reason === "completed" ? "success" : call.end_reason === "error" ? "warning" : "neutral"}>
              {call.end_reason ?? call.state}
            </Badge>
            <span className="font-mono text-xs">{call.id}</span>
            <span>{call.tenant_name}</span>
            <span>{call.direction}</span>
            <span className="uppercase text-xs">{call.channel}</span>
            <span>{formatMs(durationMs)}</span>
            <span>${(call.cost_cents / 100).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline scrubber */}
      <TimelineScrubber durationMs={durationMs} playheadMs={playheadMs} events={events} onSeek={setPlayheadMs} />

      {/* Transcript + Event inspector */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <TranscriptPanel turns={transcript} playheadMs={playheadMs} onSeek={setPlayheadMs} />
        <EventInspector events={events} toolExecutions={tool_executions} playheadMs={playheadMs} onSeek={setPlayheadMs} />
      </div>

      {/* Audio player */}
      <AudioPlayer durationMs={durationMs} playheadMs={playheadMs} onSeek={setPlayheadMs} />
    </AdminPageShell>
  );
}
```

- [x] **Step 2: Commit**

```bash
git add web/src/app/\(deployment\)/admin/calls/\[callId\]/page.tsx
git commit -m "feat: add Call Replay page with synced transcript, timeline, and events"
```

---

## Task 7: Verify and Fix Build

- [x] **Step 1: Check TypeScript compilation**

```bash
cd web && npx tsc --noEmit
```

Fix any type errors. Common issues:
- `platformApiFetch` import path may need adjustment — check existing API files like `web/src/lib/api/call-history.ts` for the correct import.
- `Tabs` components — verify the import path matches what other pages use.
- SWR key function signature.

- [x] **Step 2: Check Next.js build**

```bash
cd web && npx next build
```

Fix any build errors.

- [x] **Step 3: Commit fixes if any**

```bash
git add -A
git commit -m "fix: resolve build errors for calls admin module"
```
