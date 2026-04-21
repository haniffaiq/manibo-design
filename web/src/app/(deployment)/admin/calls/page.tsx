"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";

import { Button } from "@grove/ui/button";
import { LiveTranscript } from "@/components/call-ops/live-transcript";
import {
  listAdminLiveCalls,
  listAdminCallHistory,
  type AdminLiveCall,
  type AdminHistoricalCall,
} from "@/lib/api/admin-calls";
import { listAdminTenants, type AdminTenantSummary } from "@/lib/api/tenants";
import * as swrKeys from "@/lib/swr-keys";

const ALL = "__all";
const EMPTY_TENANTS: AdminTenantSummary[] = [];

/* ================================================================== */
/*  Dummy actions                                                      */
/* ================================================================== */

function dummyNotice(msg: string) {
  const el = document.createElement("div");
  el.textContent = msg;
  el.className = "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#1a1a2e] px-5 py-2.5 text-[13px] font-medium text-white shadow-lg";
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; setTimeout(() => el.remove(), 300); }, 2500);
}

function downloadDummyFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  dummyNotice(`Downloaded ${filename}`);
}

function exportCallsCsv(calls: { id: string; started_at: string; agent_name: string; caller_number: string; duration_ms: number; cost_cents: number }[]) {
  const header = "call_id,started_at,agent,caller,duration,cost\n";
  const rows = calls.map((c) => `${c.id},${c.started_at},${c.agent_name},${c.caller_number},${fmt(c.duration_ms)},${cost(c.cost_cents)}`).join("\n");
  downloadDummyFile("calls-export.csv", header + rows, "text/csv");
}

function exportTranscriptTxt(callId: string) {
  const dummy = `Call: ${callId}\n\nCALLER 00:03: Hi, I booked a table last week and I never got the confirmation.\nAGENT 00:08: I'm sorry to hear that. Could I have the phone number or email you used?\nCALLER 00:12: Same number I'm calling from.\nAGENT 00:15: Thanks, one moment while I look that up.\nAGENT 00:22: I found the booking for Saturday at eight — is that the one?\nCALLER 00:26: Yes, that's the one.\nAGENT 00:28: Great, I'll resend the confirmation to your email right now.\n`;
  downloadDummyFile(`transcript-${callId}.txt`, dummy);
}

function downloadDummyRecording(callId: string) {
  dummyNotice(`Recording download started for ${callId} (demo — no real audio)`);
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function cost(c: number): string { return `$${(c / 100).toFixed(2)}`; }

const STATE_DOT: Record<string, string> = { in_progress: "bg-emerald-500", on_hold: "bg-amber-500", supervised: "bg-purple-500", ringing: "bg-blue-500", ended: "bg-slate-400", failed: "bg-red-500" };
const STATE_LABEL: Record<string, string> = { in_progress: "in prog.", on_hold: "on hold", supervised: "supervised", ringing: "ringing", ended: "ended", failed: "failed" };
const OUTCOME_DOT: Record<string, string> = { completed: "bg-emerald-500", caller_hangup: "bg-slate-400", agent_hangup: "bg-slate-400", supervisor_end: "bg-purple-500", error: "bg-red-500", timeout: "bg-amber-500" };

function StatusPill({ state }: { state: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-medium">
      <span className={`h-1.5 w-1.5 rounded-full ${STATE_DOT[state] ?? "bg-slate-400"}`} />
      {STATE_LABEL[state] ?? state}
    </span>
  );
}

function TenantBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex rounded bg-[var(--color-primary-100)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-primary-700)]">
      {name}
    </span>
  );
}

function ToolBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex rounded border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-neutral-600)]">
      {name}
    </span>
  );
}

/* ================================================================== */
/*  Tenant Dropdown                                                    */
/* ================================================================== */

function TenantDropdown({ value, onChange, tenants, liveCounts, showLive }: {
  value: string; onChange: (id: string) => void; tenants: AdminTenantSummary[];
  liveCounts: Record<string, number>; showLive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const cl = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", cl); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", cl); document.removeEventListener("keydown", esc); };
  }, [open]);
  const label = value === ALL ? "All tenants" : (tenants.find((t) => t.id === value)?.name ?? value);
  const allLc = Object.values(liveCounts).reduce((a, b) => a + b, 0);
  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] text-[var(--color-neutral-500)]">Tenant</span>
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-[13px] font-medium text-[var(--color-neutral-800)] shadow-sm hover:bg-[var(--color-bg-subtle)]">
          {label}
          <svg className={`h-3.5 w-3.5 text-[var(--color-neutral-400)] transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </div>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[200px] rounded-lg border border-[var(--color-border)] bg-white py-1 shadow-lg">
          {[{ id: ALL, name: "All tenants" }, ...tenants].map((t) => {
            const sel = t.id === value;
            const lc = t.id === ALL ? allLc : (liveCounts[t.id] ?? 0);
            return (
              <button key={t.id} type="button" onClick={() => { onChange(t.id); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] ${sel ? "bg-[var(--color-primary-50)] font-medium text-[var(--color-primary-700)]" : "text-[var(--color-neutral-700)] hover:bg-[var(--color-bg-subtle)]"}`}>
                <span className="flex-1">{t.name}</span>
                {showLive && lc > 0 && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">{lc}</span>}
                {sel && <svg className="h-3.5 w-3.5 text-[var(--color-primary-600)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Sub-header (tabs + tenant)                                         */
/* ================================================================== */

function SubHeader({ tab, onTab, liveCount, histCount, tenantFilter, onTenant, tenants, liveCounts, tenantsLoading }: {
  tab: string; onTab: (t: "live" | "history") => void; liveCount: number; histCount: number;
  tenantFilter: string; onTenant: (id: string) => void; tenants: AdminTenantSummary[];
  liveCounts: Record<string, number>; tenantsLoading: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-0.5">
        <button type="button" onClick={() => onTab("live")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${tab === "live" ? "bg-white shadow-sm" : "text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]"}`}>
          <span className={`h-2 w-2 rounded-full ${tab === "live" ? "bg-emerald-500" : "bg-[var(--color-neutral-400)]"}`} />
          Live
          <span className="rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-neutral-600)]">{liveCount}</span>
        </button>
        <button type="button" onClick={() => onTab("history")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${tab === "history" ? "bg-white shadow-sm" : "text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]"}`}>
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          History
          <span className="rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-neutral-600)]">{histCount}</span>
        </button>
      </div>
      {!tenantsLoading && <TenantDropdown value={tenantFilter} onChange={onTenant} tenants={tenants} liveCounts={liveCounts} showLive={tab === "live"} />}
    </div>
  );
}

/* ================================================================== */
/*  Live table view                                                    */
/* ================================================================== */

function LiveTable({ calls, onSelect }: { calls: AdminLiveCall[]; onSelect: (c: AdminLiveCall) => void }) {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const filtered = useMemo(() => {
    let r = calls;
    if (stateFilter !== "all") r = r.filter((c) => c.state === stateFilter);
    if (search) { const q = search.toLowerCase(); r = r.filter((c) => c.agent_name.toLowerCase().includes(q) || c.caller_number.includes(q) || (c.current_intent ?? "").toLowerCase().includes(q)); }
    return r;
  }, [calls, stateFilter, search]);

  const filters = ["all", "in_progress", "on_hold", "supervised", "ringing"];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-[15px] font-semibold">Live calls</h2>
        <span className="rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-neutral-600)]">{calls.length}</span>
        <div className="ml-2 flex-1">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agent, caller, intent..." className="w-full max-w-md rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-[13px] placeholder:text-[var(--color-neutral-400)] focus:border-[var(--color-primary-400)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-400)]" />
        </div>
        <div className="flex items-center gap-1">
          {filters.map((f) => (
            <button key={f} type="button" onClick={() => setStateFilter(f)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${stateFilter === f ? "bg-[var(--color-neutral-900)] text-white" : "text-[var(--color-neutral-600)] hover:bg-[var(--color-bg-subtle)]"}`}>
              {f === "all" ? "All" : (STATE_LABEL[f] ?? f)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
              {["AGENT", "TENANT", "CALLER", "INTENT", "DURATION", "STATUS", "COST"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} onClick={() => onSelect(c)} className="cursor-pointer border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-bg-subtle)]">
                <td className="px-4 py-3 font-medium"><span className={`mr-2 inline-block h-2 w-2 rounded-full ${STATE_DOT[c.state] ?? "bg-slate-400"}`} />{c.agent_name}</td>
                <td className="px-4 py-3"><TenantBadge name={c.tenant_name} /></td>
                <td className="px-4 py-3 font-mono text-xs">{c.caller_number}</td>
                <td className="px-4 py-3 text-[var(--color-neutral-600)]">{c.current_intent ?? "\u2014"}</td>
                <td className="px-4 py-3 font-mono text-xs">{fmt(c.duration_ms)}</td>
                <td className="px-4 py-3"><StatusPill state={c.state} /></td>
                <td className="px-4 py-3 text-right font-mono">{cost(c.cost_cents)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--color-neutral-400)]">No live calls</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Live call detail (full page)                                       */
/* ================================================================== */

/* ---------- Takeover Modal ---------- */

function TakeoverModal({ call, onClose, onConfirm }: { call: AdminLiveCall; onClose: () => void; onConfirm: (reason: string, announce: boolean) => void }) {
  const [reason, setReason] = useState("");
  const [announce, setAnnounce] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Take over this call?</h2>
          <button type="button" onClick={onClose} className="text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-700)]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <table className="mt-5 w-full text-[13px]">
          <tbody>
            <tr className="border-b border-[var(--color-border)]">
              <td className="py-2.5 pr-6 text-[var(--color-neutral-500)]">Caller</td>
              <td className="py-2.5 font-medium">{call.caller_number} {call.caller_name ? `· ${call.caller_name}` : ""}</td>
            </tr>
            <tr className="border-b border-[var(--color-border)]">
              <td className="py-2.5 pr-6 text-[var(--color-neutral-500)]">Agent</td>
              <td className="py-2.5 font-medium">{call.agent_name} v{call.agent_version}</td>
            </tr>
            <tr>
              <td className="py-2.5 pr-6 align-top text-[var(--color-neutral-500)]">Impact</td>
              <td className="py-2.5">AI agent will be <strong>muted</strong>. You will speak directly to the caller. Tool execution pauses.</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-5">
          <label className="text-[13px] font-medium">Reason (required)</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Payment dispute escalation"
            className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-[13px] placeholder:text-[var(--color-neutral-400)] focus:border-[var(--color-primary-400)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-400)]" rows={3} />
        </div>
        <label className="mt-4 flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} className="rounded border-[var(--color-border)]" />
          Announce handover to caller (&quot;Connecting you to a specialist&quot;)
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-[13px] font-medium hover:bg-[var(--color-bg-subtle)]">Cancel</button>
          <button type="button" disabled={!reason.trim()} onClick={() => onConfirm(reason, announce)}
            className="rounded-lg bg-[var(--color-primary-600)] px-4 py-2 text-[13px] font-medium text-white hover:bg-[var(--color-primary-700)] disabled:opacity-40">
            Confirm take-over
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Monitor Bar (bottom fixed bar for listen-in) ---------- */

function MonitorBar({ call, onLeave }: { call: AdminLiveCall; onLeave: () => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-4 border-t border-[var(--color-border)] bg-[#1a1a2e] px-5 py-2.5 text-white lg:left-60">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
      <span className="text-[13px]">Monitoring · <strong>{call.agent_name}</strong> · {call.caller_name ?? call.caller_number}</span>
      {/* Simulated waveform */}
      <div className="flex h-5 flex-1 items-end gap-px px-1">
        {Array.from({ length: 60 }).map((_, i) => {
          const h = 15 + Math.sin(i * 0.5 + Date.now() / 300) * 35 + Math.cos(i * 0.8) * 20;
          return <div key={i} className="flex-1 rounded-t-sm bg-[var(--color-primary-400)]" style={{ height: `${Math.max(10, Math.min(100, h))}%` }} />;
        })}
      </div>
      <button type="button" className="rounded-md border border-white/20 px-3 py-1 text-[12px] font-medium hover:bg-white/10">Mute</button>
      <button type="button" onClick={onLeave} className="rounded-md bg-red-600 px-4 py-1 text-[12px] font-semibold hover:bg-red-700">Leave</button>
    </div>
  );
}

/* ---------- Live Detail ---------- */

function LiveDetail({ call, onBack }: { call: AdminLiveCall; onBack: () => void }) {
  const [listening, setListening] = useState(false);
  const [showTakeover, setShowTakeover] = useState(false);
  const [callState, setCallState] = useState(call.state);

  return (
    <>
      <div className={`space-y-5 ${listening ? "pb-16" : ""}`}>
        {/* Back + status */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-[13px] text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Back to live calls
          </button>
          <StatusPill state={callState} />
        </div>

        {/* Caller header card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-100)] text-[15px] font-bold text-[var(--color-primary-700)]">+1</div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold tracking-tight">{call.caller_number}</span>
                  {call.caller_name && <span className="text-[13px] text-[var(--color-neutral-500)]">{call.caller_name}</span>}
                </div>
                <p className="mt-0.5 text-[13px] text-[var(--color-neutral-500)]">talking to <strong>{call.agent_name}</strong> · v{call.agent_version}</p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-right">
              {[["DURATION", fmt(call.duration_ms)], ["COST", cost(call.cost_cents)], ["LATENCY", call.latency_ms ? `${call.latency_ms} ms` : "\u2014"]].map(([l, v]) => (
                <div key={l as string}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">{l}</p>
                  <p className="mt-0.5 font-mono text-[15px] font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-3 gap-3">
          {/* Listen in */}
          <button type="button" onClick={() => setListening((v) => !v)}
            className={`flex items-center gap-3 rounded-xl border px-5 py-4 text-left transition-colors ${listening ? "border-emerald-400 bg-emerald-500 text-white" : "border-[var(--color-border)] bg-white hover:bg-[var(--color-bg-subtle)]"}`}>
            <svg className={`h-6 w-6 shrink-0 ${listening ? "text-white" : "text-[var(--color-neutral-500)]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /></svg>
            <div>
              <p className="text-[13px] font-semibold">{listening ? "Listening" : "Listen in"}</p>
              <p className={`text-[11px] ${listening ? "text-white/70" : "text-[var(--color-neutral-500)]"}`}>{listening ? "You can hear the call" : "Join read-only audio"}</p>
            </div>
          </button>
          {/* Take over */}
          <button type="button" onClick={() => setShowTakeover(true)}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-5 py-4 text-left transition-colors hover:bg-[var(--color-bg-subtle)]">
            <svg className="h-6 w-6 shrink-0 text-[var(--color-neutral-500)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            <div>
              <p className="text-[13px] font-semibold">Take over</p>
              <p className="text-[11px] text-[var(--color-neutral-500)]">Replace agent · reason required</p>
            </div>
          </button>
          {/* End call */}
          <button type="button" onClick={() => { setCallState("ended"); dummyNotice("Call ended by supervisor."); }}
            className={`flex items-center gap-3 rounded-xl border px-5 py-4 text-left transition-colors ${callState === "ended" ? "border-[var(--color-primary-400)] ring-2 ring-[var(--color-primary-200)]" : "border-[var(--color-border)] bg-white hover:bg-[var(--color-bg-subtle)]"}`}>
            <svg className="h-6 w-6 shrink-0 text-[var(--color-neutral-500)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91" /><line x1="23" y1="1" x2="1" y2="23" /></svg>
            <div>
              <p className="text-[13px] font-semibold">End call</p>
              <p className="text-[11px] text-[var(--color-neutral-500)]">Hang up immediately</p>
            </div>
          </button>
        </div>

        {/* Transcript + Context */}
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <LiveTranscript callId={call.id} onStop={() => {}} />

          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
              <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">Context</h4>
              <table className="w-full text-[13px]">
                <tbody>
                  {[["Intent", call.current_intent ?? "\u2014"], ["Channel", call.channel], ["Direction", call.direction], ["Call ID", call.id]].map(([k, v]) => (
                    <tr key={k} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-2 pr-4 text-[var(--color-neutral-500)]">{k}</td>
                      <td className="py-2 font-medium">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {call.tools.length > 0 && (
              <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
                <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">Tool Activity</h4>
                <div className="space-y-2">
                  {call.tools.map((t) => (
                    <div key={t} className="flex items-center justify-between rounded-lg bg-[var(--color-bg-subtle)] px-3 py-2">
                      <span className="font-mono text-xs font-medium text-[var(--color-primary-700)]">tool · {t}</span>
                      <span className="text-[10px] text-[var(--color-neutral-400)]">142 ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monitor bar (when listening) */}
      {listening && <MonitorBar call={call} onLeave={() => setListening(false)} />}

      {/* Takeover modal */}
      {showTakeover && (
        <TakeoverModal call={call} onClose={() => setShowTakeover(false)} onConfirm={(reason, announce) => {
          setShowTakeover(false);
          dummyNotice(`Taking over ${call.id} — agent muted. Reason: ${reason}${announce ? " (announced to caller)" : ""}`);
        }} />
      )}
    </>
  );
}

/* ================================================================== */
/*  History table view                                                 */
/* ================================================================== */

function HistoryDetail({ call, onBack }: { call: AdminHistoricalCall; onBack: () => void }) {
  return (
    <div className="space-y-5">
      {/* Back + status */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-[13px] text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back to history
        </button>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-medium">
            <span className={`h-1.5 w-1.5 rounded-full ${OUTCOME_DOT[call.end_reason] ?? "bg-slate-400"}`} />
            {call.state}
          </span>
          {call.supervised_by && (
            <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">supervised by {call.supervised_by}</span>
          )}
        </div>
      </div>

      {/* Call header */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-neutral-100)] text-[15px] font-bold text-[var(--color-neutral-600)]">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight">{call.caller_number}</span>
                {call.caller_name && <span className="text-[13px] text-[var(--color-neutral-500)]">{call.caller_name}</span>}
              </div>
              <p className="mt-0.5 text-[13px] text-[var(--color-neutral-500)]">handled by <strong>{call.agent_name}</strong> · {call.direction} · {call.channel}</p>
            </div>
          </div>
          <div className="flex items-center gap-8 text-right">
            {[["STARTED", fmtDate(call.started_at)], ["DURATION", fmt(call.duration_ms)], ["COST", cost(call.cost_cents)]].map(([l, v]) => (
              <div key={l as string}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">{l}</p>
                <p className="mt-0.5 font-mono text-[15px] font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => exportTranscriptTxt(call.id)} className="text-[13px] font-medium text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]">Export transcript</button>
        <button type="button" onClick={() => downloadDummyRecording(call.id)} className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-neutral-700)] hover:bg-[var(--color-bg-subtle)]">Download recording</button>
        <div className="flex-1" />
        <Link href={`/admin/calls/${call.id}`}>
          <button type="button" className="rounded-md bg-[var(--color-primary-600)] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[var(--color-primary-700)]">Open full replay</button>
        </Link>
      </div>

      {/* Detail grid */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Transcript preview */}
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
          <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">Transcript preview</h4>
          <div className="space-y-3">
            {[
              { role: "caller", time: "00:03", text: "Hi, I booked a table last week and I never got the confirmation." },
              { role: "agent", time: "00:08", text: "I\u2019m sorry to hear that. Could I have the phone number or email you used?" },
              { role: "caller", time: "00:12", text: "Same number I\u2019m calling from." },
              { role: "agent", time: "00:15", text: "Thanks, one moment while I look that up." },
              { role: "agent", time: "00:22", text: "I found the booking for Saturday at eight \u2014 is that the one?" },
            ].map((t, i) => {
              const isAgent = t.role === "agent";
              return (
                <div key={i} className={isAgent ? "pl-16" : "pr-16"}>
                  <div className={`flex items-center gap-2 ${isAgent ? "justify-end" : ""}`}>
                    <span className={`text-[11px] font-bold uppercase ${isAgent ? "text-[var(--color-primary-600)]" : "text-[var(--color-neutral-700)]"}`}>{t.role}</span>
                    <span className="font-mono text-[10px] text-[var(--color-neutral-400)]">{t.time}</span>
                  </div>
                  <div className={`mt-1 rounded-xl px-4 py-2.5 text-[13px] leading-relaxed ${isAgent ? "bg-[var(--color-primary-50)] text-[var(--color-primary-900)]" : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-900)]"}`}>
                    {t.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {/* Context */}
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">Context</h4>
            <table className="w-full text-[13px]">
              <tbody>
                {[
                  ["Intent", call.current_intent ?? "\u2014"],
                  ["End reason", call.end_reason],
                  ["Channel", call.channel],
                  ["Direction", call.direction],
                  ["Tenant", call.tenant_name],
                  ["Call ID", call.id],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="py-2 pr-4 text-[var(--color-neutral-500)]">{k}</td>
                    <td className="py-2 font-medium">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tools used */}
          {call.tools.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
              <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">Tools used</h4>
              <div className="space-y-2">
                {call.tools.map((t) => (
                  <div key={t} className="flex items-center justify-between rounded-lg bg-[var(--color-bg-subtle)] px-3 py-2">
                    <span className="font-mono text-xs font-medium text-[var(--color-primary-700)]">tool · {t}</span>
                    <span className="text-[10px] text-[var(--color-neutral-400)]">ok</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  History table view                                                 */
/* ================================================================== */

function HistoryTable({ calls, isLoading, onSelect }: { calls: AdminHistoricalCall[]; isLoading: boolean; onSelect: (c: AdminHistoricalCall) => void }) {
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const filtered = useMemo(() => {
    let r = calls;
    if (outcomeFilter !== "all") r = r.filter((c) => c.end_reason === outcomeFilter);
    if (search) { const q = search.toLowerCase(); r = r.filter((c) => c.agent_name.toLowerCase().includes(q) || c.caller_number.includes(q) || (c.current_intent ?? "").toLowerCase().includes(q)); }
    return r;
  }, [calls, outcomeFilter, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search calls..." className="flex-1 rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-[13px] placeholder:text-[var(--color-neutral-400)] focus:border-[var(--color-primary-400)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-400)]" />
      </div>

      <div className="flex items-center justify-between">
        <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value)} className="rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-[13px]">
          <option value="all">All outcomes</option>
          <option value="completed">completed</option>
          <option value="caller_hangup">caller_hangup</option>
          <option value="supervisor_end">supervisor_end</option>
          <option value="error">error</option>
        </select>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-[var(--color-neutral-500)]"><strong>{filtered.length}</strong> calls</span>
          <button type="button" onClick={() => exportCallsCsv(filtered)} className="text-[13px] font-medium text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]">Export CSV</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
              {["STARTED", "TENANT", "AGENT", "CALLER", "INTENT", "DURATION", "OUTCOME", "COST", "TOOLS"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">{h}</th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} onClick={() => onSelect(c)} className="cursor-pointer border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-bg-subtle)]">
                <td className="px-4 py-3 text-xs">{fmtDate(c.started_at)}</td>
                <td className="px-4 py-3"><TenantBadge name={c.tenant_name} /></td>
                <td className="px-4 py-3 font-mono text-xs">{c.agent_name}</td>
                <td className="px-4 py-3">
                  <div className="font-mono text-xs">{c.caller_number}</div>
                  {c.caller_name && <div className="text-[11px] text-[var(--color-neutral-500)]">{c.caller_name}</div>}
                </td>
                <td className="px-4 py-3 text-[var(--color-neutral-600)]">
                  {c.current_intent ?? "\u2014"}
                  {c.supervised_by && <span className="ml-1 inline-flex rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">supervised</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{fmt(c.duration_ms)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${OUTCOME_DOT[c.end_reason] ?? "bg-slate-400"}`} />
                    <span>{c.state}</span>
                  </div>
                  <div className="text-[11px] text-[var(--color-neutral-500)]">{c.end_reason}</div>
                </td>
                <td className="px-4 py-3 font-mono">{cost(c.cost_cents)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.tools.map((t) => <ToolBadge key={t} name={t} />)}
                  </div>
                </td>
                <td className="px-2 py-3">
                  <Link href={`/admin/calls/${c.id}`}>
                    <svg className="h-4 w-4 text-[var(--color-neutral-400)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-[var(--color-neutral-400)]">No calls found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Main page                                                          */
/* ================================================================== */

export default function AdminCallsPage() {
  const [tab, setTab] = useState<"live" | "history">("live");
  const [tenantFilter, setTenantFilter] = useState(ALL);
  const [liveDetail, setLiveDetail] = useState<AdminLiveCall | null>(null);
  const [historyDetail, setHistoryDetail] = useState<AdminHistoricalCall | null>(null);

  const { data: tenantsData, isLoading: tenantsLoading } = useSWR("admin-calls-tenants", () => listAdminTenants(500, 0, { include_non_production: true }), { revalidateOnFocus: false });
  const tenants = tenantsData ?? EMPTY_TENANTS;

  const { data: liveData, isLoading: liveLoading } = useSWR(swrKeys.adminLiveCalls(), listAdminLiveCalls, { revalidateOnFocus: false, refreshInterval: 10_000 });
  const allLive = liveData?.calls ?? [];

  const { data: histData, isLoading: histLoading } = useSWR(swrKeys.adminCallHistory(null), () => listAdminCallHistory(), { revalidateOnFocus: false });
  const allHistory = histData?.calls ?? [];

  const liveCalls = useMemo(() => tenantFilter === ALL ? allLive : allLive.filter((c) => c.tenant_id === tenantFilter), [allLive, tenantFilter]);
  const historyCalls = useMemo(() => tenantFilter === ALL ? allHistory : allHistory.filter((c) => c.tenant_id === tenantFilter), [allHistory, tenantFilter]);

  const liveCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of allLive) m[c.tenant_id] = (m[c.tenant_id] ?? 0) + 1;
    return m;
  }, [allLive]);

  const tenantLabel = tenantFilter === ALL ? "All tenants" : (tenants.find((t) => t.id === tenantFilter)?.name ?? tenantFilter);

  const handleTab = (t: "live" | "history") => { setTab(t); setLiveDetail(null); setHistoryDetail(null); };
  const showingDetail = liveDetail || historyDetail;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-white px-5 py-3">
        <span className="text-[13px] text-[var(--color-neutral-500)]">Platform</span>
        <span className="text-[13px] text-[var(--color-neutral-300)]">/</span>
        <span className="text-[13px] font-medium text-[var(--color-neutral-900)]">
          {showingDetail ? "Calls \u00b7 Replay" : `Calls \u00b7 ${tab === "live" ? "Live" : "History"} \u00b7 ${tenantLabel}`}
        </span>
      </div>

      {/* Sub-header */}
      {!showingDetail && (
        <div className="border-b border-[var(--color-border)] bg-white px-5 py-3">
          <SubHeader tab={tab} onTab={handleTab} liveCount={liveCalls.length} histCount={historyCalls.length}
            tenantFilter={tenantFilter} onTenant={setTenantFilter} tenants={tenants} liveCounts={liveCounts} tenantsLoading={tenantsLoading} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white px-5 py-5">
        {liveDetail ? (
          <LiveDetail call={liveDetail} onBack={() => setLiveDetail(null)} />
        ) : historyDetail ? (
          <HistoryDetail call={historyDetail} onBack={() => setHistoryDetail(null)} />
        ) : tab === "live" ? (
          <LiveTable calls={liveCalls} onSelect={setLiveDetail} />
        ) : (
          <HistoryTable calls={historyCalls} isLoading={histLoading} onSelect={setHistoryDetail} />
        )}
      </div>
    </div>
  );
}
