# UI Specs Reference — Visual & Interaction Details

Complete reference for pixel-perfect reproduction.

---

## 1. Color Maps (Constants)

### Calls — State Colors

```typescript
// Dot colors for live call states
const STATE_DOT: Record<string, string> = {
  in_progress: "bg-emerald-500",
  on_hold: "bg-amber-500",
  supervised: "bg-purple-500",
  ringing: "bg-blue-500",
  ended: "bg-slate-400",
  failed: "bg-red-500",
};

// Labels for states
const STATE_LABEL: Record<string, string> = {
  in_progress: "in prog.",
  on_hold: "on hold",
  supervised: "supervised",
  ringing: "ringing",
  ended: "ended",
  failed: "failed",
};

// Dot colors for historical call outcomes
const OUTCOME_DOT: Record<string, string> = {
  completed: "bg-emerald-500",
  caller_hangup: "bg-slate-400",
  agent_hangup: "bg-slate-400",
  supervisor_end: "bg-purple-500",
  error: "bg-red-500",
  timeout: "bg-amber-500",
};
```

### Replay — Event Type Badges

```typescript
const EVENT_TYPE_LABEL: Record<string, string> = {
  state_change: "STATE_CHANGE",
  model_invocation: "MODEL_INVOCATION",
  asr_event: "ASR_EVENT",
  tts_event: "TTS_EVENT",
  handoff: "HANDOFF",
  dtmf: "DTMF",
  supervisor_action: "SUPERVISOR",
  log: "LOG",
};

const EVENT_TYPE_COLOR: Record<string, string> = {
  STATE_CHANGE: "bg-slate-100 text-slate-600",
  MODEL_INVOCATION: "bg-blue-100 text-blue-700",
  ASR_EVENT: "bg-amber-100 text-amber-700",
  TOOL: "bg-emerald-100 text-emerald-700",
  HANDOFF: "bg-purple-100 text-purple-700",
  TTS_EVENT: "bg-sky-100 text-sky-700",
};

const TIMELINE_DOT: Record<string, string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  warn: "bg-amber-500",
  error: "bg-red-500",
};
```

### Replay — Transcript Bubble Colors

```
Caller:     bg-neutral-100 rounded-xl rounded-tl-sm  (left-aligned)
Agent:      bg-[var(--color-primary-50)] rounded-xl rounded-tr-sm  (right-aligned)
Supervisor: bg-purple-50 rounded-xl rounded-tr-sm  (right-aligned)
System:     bg-gray-50 (centered)
Active:     ring-2 ring-[var(--color-primary-400)]
```

---

## 2. Inline Component Specs

### StatusPill

```tsx
function StatusPill({ state }: { state: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-medium">
      <span className={`h-1.5 w-1.5 rounded-full ${STATE_DOT[state] ?? "bg-slate-400"}`} />
      {STATE_LABEL[state] ?? state}
    </span>
  );
}
```

### TenantBadge

```tsx
function TenantBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex rounded bg-[var(--color-primary-100)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-primary-700)]">
      {name}
    </span>
  );
}
```

### ToolBadge

```tsx
function ToolBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex rounded border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-neutral-600)]">
      {name}
    </span>
  );
}
```

### Toast Notification (dummyNotice)

```tsx
function dummyNotice(msg: string) {
  const el = document.createElement("div");
  el.textContent = msg;
  el.className = "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#1a1a2e] px-5 py-2.5 text-[13px] font-medium text-white shadow-lg";
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .3s";
    setTimeout(() => el.remove(), 300);
  }, 2500);
}
```

---

## 3. Layout Specs

### Calls Page Layout

```
Full height: h-[calc(100vh-3.5rem)] flex flex-col

Breadcrumb:  border-b border-[var(--color-border)] bg-white px-5 py-3
SubHeader:   border-b border-[var(--color-border)] bg-white px-5 py-3
Content:     flex-1 overflow-y-auto bg-white px-5 py-5
```

### Agent Builder Layout

```
Breakout:    -mx-4 -mt-6 flex h-[calc(100vh-72px)] min-h-0 overflow-hidden

Left:        w-80 border-r flex flex-col  (AssistantList, 320px)
Right:       min-w-0 flex-1 overflow-hidden bg-white  (DetailPanel)
```

### Replay Page Layout

```
Vertical stack inside PageFrame:
├─ Breadcrumb bar
├─ Header (agent + stats)
├─ Action buttons
├─ Timeline card         rounded-xl border bg-white p-5
├─ Two-column grid       lg:grid-cols-[1fr_380px] gap-5
│   ├─ Transcript panel  rounded-xl border bg-white p-5
│   └─ Event Inspector   rounded-xl border bg-white p-5
└─ Audio player card     rounded-xl border bg-white p-5
```

---

## 4. Table Specs

```
Container:    overflow-x-auto rounded-lg border border-[var(--color-border)]
Table:        w-full border-collapse text-left text-[13px]
Header:       bg-[var(--color-bg-subtle)]
Header cell:  px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-neutral-500)]
Body row:     border-t border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] cursor-pointer
Body cell:    px-4 py-3
```

---

## 5. Modal Specs

```
Overlay:      fixed inset-0 z-50 flex items-center justify-center bg-black/40
Card:         relative rounded-2xl bg-white px-7 py-6 shadow-xl max-w-lg w-full
Close button: absolute right-4 top-4 text-neutral-400 hover:text-neutral-600
```

---

## 6. MonitorBar Specs

```
Position:     fixed bottom-0 left-0 right-0 lg:left-60 z-40
Background:   bg-[#1a1a2e]
Layout:       flex items-center gap-4 px-5 py-3

Left group:
  Pulsing dot:  relative h-2.5 w-2.5
    Inner:      absolute inset-0 rounded-full bg-red-500
    Ping:       absolute inset-0 rounded-full bg-red-400 animate-ping
  Label:        text-[13px] font-medium text-white

Center:
  Waveform:     flex items-center gap-px h-6  (60 bars)
    Bar:          w-[3px] rounded-full bg-[var(--color-primary-400)]
    Height:       Math.max(4, Math.abs(Math.sin(i * 0.4) * 24 + Math.cos(i * 0.7) * 16))

Right group:
  Mute:         rounded-lg border border-white/20 px-3 py-1.5 text-[12px] text-white hover:bg-white/10
  Leave:        rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-red-700
```

---

## 7. Form Controls

```
Input/Textarea:
  rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5 text-[13px]
  focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)] focus:outline-none

Dropdown trigger:
  rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-[13px]
  hover:border-[var(--color-neutral-300)]

Dropdown menu:
  absolute z-30 mt-1 rounded-lg border border-[var(--color-border)] bg-white shadow-lg py-1
  max-h-64 overflow-y-auto

Dropdown item:
  px-3 py-2 text-[13px] hover:bg-[var(--color-bg-subtle)] cursor-pointer
  Selected: bg-[var(--color-primary-50)] text-[var(--color-primary-700)] + checkmark

Filter chip:
  rounded-full border px-3 py-1 text-[12px] font-medium
  Active:   bg-[var(--color-neutral-900)] text-white border-transparent
  Inactive: border-[var(--color-border)] text-[var(--color-neutral-600)] hover:bg-[var(--color-bg-subtle)]
```

---

## 8. Z-Index Scale

| Layer | Z-index | Usage |
|-------|---------|-------|
| Dropdowns | `z-30` | TenantDropdown, filter menus |
| Bars | `z-40` | MonitorBar |
| Modals | `z-50` | TakeoverModal, CreateAssistantModal |
| Toasts | `z-50` | dummyNotice |

---

## 9. SVG Icons Used

### Calls Page

```tsx
// Headphone icon (Listen in card)
<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
</svg>

// Lock icon (Take over card)
<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
</svg>

// Phone-off icon (End call card)
<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5a11.25 11.25 0 01-8.998-4.502m0 0A11.25 11.25 0 013.75 6.75" />
</svg>

// Clock icon (History tab)
<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
  <circle cx="12" cy="12" r="9" />
  <path strokeLinecap="round" d="M12 7v5l3 3" />
</svg>

// Chevron (dropdown, table link)
<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
</svg>
```
