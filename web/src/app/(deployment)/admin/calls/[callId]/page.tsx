"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import {
  getAdminCallReplay,
  type TranscriptTurn,
  type CallEvent,
  type ToolExecution,
} from "@/lib/api/admin-calls";
import * as swrKeys from "@/lib/swr-keys";
//Hanif

/* ---------- helpers ---------- */

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function cost(c: number): string { return `$${(c / 100).toFixed(2)}`; }
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  state_change: "STATE_CHANGE", model_invocation: "MODEL_INVOCATION", asr_event: "ASR_EVENT",
  tts_event: "TTS_EVENT", handoff: "HANDOFF", dtmf: "DTMF", supervisor_action: "SUPERVISOR", log: "LOG",
};
const EVENT_TYPE_COLOR: Record<string, string> = {
  STATE_CHANGE: "bg-slate-100 text-slate-600", MODEL_INVOCATION: "bg-blue-100 text-blue-700",
  ASR_EVENT: "bg-amber-100 text-amber-700", TOOL: "bg-emerald-100 text-emerald-700",
  HANDOFF: "bg-purple-100 text-purple-700", TTS_EVENT: "bg-sky-100 text-sky-700",
};

const TIMELINE_DOT: Record<string, string> = {
  info: "bg-blue-500", warning: "bg-amber-500", warn: "bg-amber-500", error: "bg-red-500",
};

/* ---------- Timeline ---------- */

function Timeline({ durationMs, playheadMs, events, toolExecs, onSeek }: {
  durationMs: number; playheadMs: number; events: CallEvent[]; toolExecs: ToolExecution[]; onSeek: (ms: number) => void;
}) {
  const markers = useMemo(() => {
    const m: { ms: number; color: string }[] = [];
    for (const e of events) m.push({ ms: e.at_ms, color: e.severity === "error" ? "bg-red-500" : e.severity === "warning" || e.severity === "warn" ? "bg-amber-500" : "bg-blue-500" });
    for (const t of toolExecs) m.push({ ms: t.started_at_ms, color: t.status === "ok" ? "bg-emerald-500" : "bg-red-500" });
    return m.sort((a, b) => a.ms - b.ms);
  }, [events, toolExecs]);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">Timeline</h3>
        <span className="font-mono text-[13px] text-[var(--color-neutral-500)]">{fmt(playheadMs)} / {fmt(durationMs)}</span>
      </div>
      <div className="relative mt-4 h-8 cursor-pointer rounded bg-[var(--color-bg-subtle)]"
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSeek(Math.round(((e.clientX - r.left) / r.width) * durationMs)); }}>
        {/* Track line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-[var(--color-neutral-200)]" />
        {/* Markers */}
        {markers.map((m, i) => (
          <div key={i} className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${m.color}`} style={{ left: `${(m.ms / durationMs) * 100}%` }} />
        ))}
        {/* Playhead */}
        <div className="absolute top-0 h-full w-0.5 bg-[var(--color-neutral-900)]" style={{ left: `${(playheadMs / durationMs) * 100}%` }}>
          <div className="absolute -left-1.5 -top-1 h-3 w-3 rounded-sm bg-[var(--color-neutral-900)]" style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }} />
        </div>
        {/* Time labels */}
        <div className="absolute -bottom-5 left-0 font-mono text-[10px] text-[var(--color-neutral-400)]">00:00</div>
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[10px] text-[var(--color-neutral-400)]">{fmt(durationMs / 2)}</div>
        <div className="absolute -bottom-5 right-0 font-mono text-[10px] text-[var(--color-neutral-400)]">{fmt(durationMs)}</div>
      </div>
    </div>
  );
}

/* ---------- Transcript panel ---------- */

function TranscriptPanel({ turns, playheadMs, onSeek }: { turns: TranscriptTurn[]; playheadMs: number; onSeek: (ms: number) => void }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">Transcript</h3>
        <span className="text-[11px] text-[var(--color-neutral-400)]">{turns.length} turns</span>
      </div>
      <div className="mt-4 space-y-4">
        {turns.map((t) => {
          const isAgent = t.role === "agent" || t.role === "supervisor";
          const active = playheadMs >= t.started_at_ms && playheadMs <= t.ended_at_ms;
          return (
            <div key={t.id} className={isAgent ? "pl-16" : "pr-16"} onClick={() => onSeek(t.started_at_ms)}>
              <div className={`flex items-center gap-2 ${isAgent ? "justify-end" : ""}`}>
                <span className={`text-[11px] font-bold uppercase ${t.role === "agent" ? "text-[var(--color-primary-600)]" : t.role === "supervisor" ? "text-purple-600" : "text-[var(--color-neutral-700)]"}`}>{t.role}</span>
                <span className="font-mono text-[10px] text-[var(--color-neutral-400)]">{fmt(t.started_at_ms)}</span>
              </div>
              <div className={`mt-1 cursor-pointer rounded-xl px-4 py-2.5 text-[13px] leading-relaxed transition-shadow ${
                isAgent
                  ? `${t.role === "supervisor" ? "bg-purple-50 text-purple-900" : "bg-[var(--color-primary-50)] text-[var(--color-primary-900)]"} ml-auto`
                  : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-900)]"
              } ${active ? "ring-2 ring-[var(--color-primary-400)]" : ""}`}>
                {t.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Event Inspector ---------- */

function EventInspector({ events, toolExecs, playheadMs, onSeek }: {
  events: CallEvent[]; toolExecs: ToolExecution[]; playheadMs: number; onSeek: (ms: number) => void;
}) {
  type Item = { type: "event"; data: CallEvent } | { type: "tool"; data: ToolExecution };
  const items = useMemo<Item[]>(() => {
    const merged: Item[] = [
      ...events.map((e) => ({ type: "event" as const, data: e })),
      ...toolExecs.map((t) => ({ type: "tool" as const, data: t })),
    ];
    merged.sort((a, b) => {
      const aMs = a.type === "event" ? a.data.at_ms : a.data.started_at_ms;
      const bMs = b.type === "event" ? b.data.at_ms : b.data.started_at_ms;
      return aMs - bMs;
    });
    return merged;
  }, [events, toolExecs]);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-neutral-400)]">Event Inspector</h3>
        <span className="font-mono text-[11px] text-[var(--color-neutral-400)]">@ {fmt(playheadMs)}</span>
      </div>
      <div className="mt-4 space-y-1">
        {items.map((item) => {
          if (item.type === "tool") {
            const t = item.data;
            return (
              <button key={t.id} type="button" onClick={() => onSeek(t.started_at_ms)}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--color-bg-subtle)]">
                <span className="mt-0.5 shrink-0 font-mono text-[11px] text-[var(--color-neutral-400)]">{fmt(t.started_at_ms)}</span>
                <div className="min-w-0 flex-1">
                  <span className={`font-mono text-xs font-medium ${t.status === "ok" ? "text-[var(--color-neutral-800)]" : "text-red-600"}`}>{t.tool_name}</span>
                  <p className="text-[11px] text-[var(--color-neutral-500)]">{t.status} · {t.latency_ms} ms</p>
                </div>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${EVENT_TYPE_COLOR.TOOL}`}>TOOL</span>
              </button>
            );
          }
          const ev = item.data;
          const typeLabel = EVENT_TYPE_LABEL[ev.kind] ?? ev.kind.toUpperCase();
          return (
            <button key={ev.id} type="button" onClick={() => onSeek(ev.at_ms)}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--color-bg-subtle)]">
              <span className="mt-0.5 shrink-0 font-mono text-[11px] text-[var(--color-neutral-400)]">{fmt(ev.at_ms)}</span>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-[var(--color-neutral-800)]">{ev.label}</span>
                {ev.payload && Object.keys(ev.payload).length > 0 && (
                  <p className="truncate text-[11px] text-[var(--color-neutral-500)]">
                    {Object.entries(ev.payload).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </p>
                )}
              </div>
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${EVENT_TYPE_COLOR[typeLabel] ?? "bg-slate-100 text-slate-600"}`}>{typeLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Audio player ---------- */

function AudioPlayer({ durationMs, playheadMs, onSeek }: { durationMs: number; playheadMs: number; onSeek: (ms: number) => void }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-white px-5 py-3">
      <button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-600)] text-white shadow-md hover:bg-[var(--color-primary-700)]" disabled>
        <svg className="ml-0.5 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
      </button>
      <div className="flex items-center gap-2">
        {["0.5\u00d7", "1\u00d7", "1.5\u00d7", "2\u00d7"].map((s, i) => (
          <button key={s} type="button" className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${i === 1 ? "bg-[var(--color-neutral-900)] text-white" : "text-[var(--color-neutral-500)] hover:bg-[var(--color-bg-subtle)]"}`}>{s}</button>
        ))}
      </div>
      <div className="relative h-8 flex-1 cursor-pointer overflow-hidden rounded bg-[var(--color-bg-subtle)]"
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSeek(Math.round(((e.clientX - r.left) / r.width) * durationMs)); }}>
        <div className="absolute inset-0 flex items-end gap-px px-0.5">
          {Array.from({ length: 120 }).map((_, i) => {
            const h = 15 + Math.sin(i * 0.3) * 25 + Math.cos(i * 0.7) * 20 + Math.sin(i * 1.3) * 10;
            return (
              <div key={i} className={`flex-1 rounded-t-sm ${i / 120 <= playheadMs / durationMs ? "bg-[var(--color-primary-500)]" : "bg-[var(--color-neutral-300)]"}`}
                style={{ height: `${Math.max(8, Math.min(100, h))}%` }} />
            );
          })}
        </div>
      </div>
      <span className="shrink-0 font-mono text-[12px] text-[var(--color-neutral-500)]">{fmt(playheadMs)} / {fmt(durationMs)}</span>
    </div>
  );
}

/* ---------- Dummy actions ---------- */

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

/* ---------- Main Replay Page ---------- */

export default function CallReplayPage() {
  const params = useParams<{ callId: string }>();
  const callId = params.callId;
  const { data, isLoading, error } = useSWR(swrKeys.adminCallReplay(callId), () => getAdminCallReplay(callId), { revalidateOnFocus: false });
  const [playheadMs, setPlayheadMs] = useState(0);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        <div className="border-b border-[var(--color-border)] bg-white px-5 py-3">
          <span className="text-[13px] text-[var(--color-neutral-500)]">Platform / <span className="font-medium text-[var(--color-neutral-900)]">Calls · Replay</span></span>
        </div>
        <div className="flex-1 space-y-4 p-6">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--color-bg-subtle)]" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4">
        <p className="text-[var(--color-neutral-500)]">Call not found</p>
        <Link href="/admin/calls"><Button variant="outline">Back to calls</Button></Link>
      </div>
    );
  }

  const { call, transcript, events, tool_executions, recording } = data;
  const durationMs = call.duration_ms || recording?.duration_ms || 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-[var(--color-border)] bg-white px-5 py-3">
        <span className="text-[13px] text-[var(--color-neutral-500)]">Platform / <span className="font-medium text-[var(--color-neutral-900)]">Calls · Replay</span></span>
      </div>

      <div className="flex-1 overflow-y-auto bg-white px-5 py-5">
        <div className="space-y-5">
          {/* Back + call header */}
          <div>
            <Link href="/admin/calls" className="flex items-center gap-1 text-[13px] text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              Back to history
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[14px]">
              <span className="font-bold">{call.agent_name}</span>
              <span className="text-[var(--color-neutral-400)]">·</span>
              <span className="font-mono">{call.caller_number}</span>
              {call.caller_name && <><span className="text-[var(--color-neutral-400)]">·</span><span>{call.caller_name}</span></>}
              <span className="text-[var(--color-neutral-400)]">·</span>
              <span>{fmtDate(call.started_at)}</span>
              <span className="text-[var(--color-neutral-400)]">·</span>
              <span className="font-mono">{fmt(durationMs)}</span>
              <span className="text-[var(--color-neutral-400)]">·</span>
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" />{call.state}</span>
              {call.end_reason === "supervisor_end" && (
                <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">supervised by hanif@manibo.com</span>
              )}
              <span className="text-[var(--color-neutral-400)]">·</span>
              <span className="font-mono">{cost(call.cost_cents)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => {
              const lines = transcript.map((t) => `${t.role.toUpperCase()} ${fmt(t.started_at_ms)}: ${t.text}`).join("\n");
              downloadDummyFile(`transcript-${callId}.txt`, `Call: ${callId}\n\n${lines}`);
            }} className="text-[13px] font-medium text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]">Export transcript</button>
            <button type="button" onClick={() => dummyNotice(`Recording download started for ${callId} (demo — no real audio)`)} className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-neutral-700)] hover:bg-[var(--color-bg-subtle)]">Download recording</button>
          </div>

          {/* Timeline */}
          <Timeline durationMs={durationMs} playheadMs={playheadMs} events={events} toolExecs={tool_executions} onSeek={setPlayheadMs} />

          {/* Transcript + Event Inspector */}
          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <TranscriptPanel turns={transcript} playheadMs={playheadMs} onSeek={setPlayheadMs} />
            <EventInspector events={events} toolExecs={tool_executions} playheadMs={playheadMs} onSeek={setPlayheadMs} />
          </div>

          {/* Audio player */}
          <AudioPlayer durationMs={durationMs} playheadMs={playheadMs} onSeek={setPlayheadMs} />
        </div>
      </div>
    </div>
  );
}
