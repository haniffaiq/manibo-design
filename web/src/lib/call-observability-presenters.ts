import type { CallLatencyStackComponent, CallOpsRouteHotspot, CallTraceNodeSummary } from "@/lib/api/call-observability";
import type { CallRuntimeEvent } from "@/lib/api/call-history";

export function formatDurationMs(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  if (value < 1000) {
    return `${Math.round(value)} ms`;
  }

  const seconds = value / 1000;
  if (seconds < 10) {
    return `${seconds.toFixed(1)} s`;
  }
  return `${seconds.toFixed(0)} s`;
}

export function formatElapsedTime(valueMs: number): string {
  if (valueMs < 1000) {
    return `${valueMs} ms into call`;
  }

  const totalSeconds = valueMs / 1000;
  if (totalSeconds < 60) {
    const seconds = totalSeconds < 10 ? totalSeconds.toFixed(1) : totalSeconds.toFixed(0);
    return `${seconds}s into call`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}m ${seconds}s into call`;
}

function formatStackValue(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : "—";
}

export function metricSummaryLabel(metricKey: string): string {
  switch (metricKey) {
    case "llm_ttft_ms":
      return "AI response time";
    case "tts_ttfb_ms":
      return "Voice synthesis time";
    case "stt_finalize_delay_ms":
      return "Speech recognition delay";
    case "eot_to_agent_speak_ms":
      return "Turn transition delay";
    case "eot_to_llm_start_ms":
      return "Silence to thinking start";
    default:
      return metricKey.replaceAll("_", " ");
  }
}

export function stackCardDescription(component: "llm" | "stt" | "tts", stack: CallLatencyStackComponent | null): string[] {
  if (!stack) {
    return ["No provider data was saved for this call."];
  }

  const lines: string[] = [];
  lines.push(`Provider: ${formatStackValue(stack.provider)}`);
  if (component === "tts") {
    lines.push(`Voice: ${formatStackValue(stack.voice_name ?? stack.voice_id)}`);
  } else {
    lines.push(`Model: ${formatStackValue(stack.model)}`);
  }
  if (stack.language) {
    lines.push(`Language: ${stack.language}`);
  }
  return lines;
}

export function traceNodeBadgeVariant(node: CallTraceNodeSummary): "neutral" | "success" | "warning" {
  if ((node.retry_count ?? 0) > 0) {
    return "warning";
  }
  if ((node.latency_ms ?? 0) >= 1500) {
    return "warning";
  }
  return "success";
}

export function eventCategoryLabel(eventType: string): string {
  if (eventType.startsWith("llm.")) {
    return "Assistant";
  }
  if (eventType.startsWith("tts.") || eventType.startsWith("stt.")) {
    return "Voice";
  }
  if (eventType.startsWith("call.manual_takeover")) {
    return "Operator";
  }
  if (eventType.startsWith("call.escal")) {
    return "Handoff";
  }
  if (eventType.startsWith("approval.")) {
    return "Approval";
  }
  if (eventType.startsWith("billing.")) {
    return "Budget";
  }
  if (eventType.startsWith("call.")) {
    return "Call";
  }
  return "System";
}

function readPayloadString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readPayloadBoolean(payload: Record<string, unknown>, key: string): boolean | null {
  const value = payload[key];
  return typeof value === "boolean" ? value : null;
}

function titleCaseWords(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function handoffReasonLabel(reason: string): string {
  switch (reason) {
    case "urgent_medical_need":
      return "Urgent medical need";
    case "insurance_compensated_visit":
      return "Insurance or compensated visit";
    case "complex_multi_appointment_request":
      return "Complex scheduling";
    case "specialty_not_available_in_city":
      return "Specialty unavailable in this city";
    case "medical_question_out_of_scope":
      return "Medical question outside booking scope";
    default:
      return titleCaseWords(reason);
  }
}

export function eventHeadline(event: CallRuntimeEvent): string {
  switch (event.event_type) {
    case "call.escalated":
      return "Needs human help";
    case "call.escalation.transfer_requested":
      return "Urgent transfer requested";
    case "call.escalation.transfer_failed":
      return "Urgent transfer failed; join manually";
    case "call.manual_takeover.requested":
      return "Teammate is joining the call";
    case "call.manual_takeover":
      return "Teammate joined the call";
    case "call.manual_takeover.failed":
      return "Teammate could not join";
    default:
      return event.summary.trim() || event.event_type;
  }
}

export function eventFacts(event: CallRuntimeEvent): string[] {
  const facts: string[] = [];
  const turnIndex = event.payload.turn_index;
  if (typeof turnIndex === "number" && Number.isFinite(turnIndex)) {
    facts.push(`Turn ${turnIndex + 1}`);
  }

  const provider = event.payload.provider;
  if (typeof provider === "string" && provider.trim().length > 0) {
    facts.push(`Provider: ${provider}`);
  }

  const outcome = event.payload.outcome;
  if (typeof outcome === "string" && outcome.trim().length > 0) {
    facts.push(`Outcome: ${outcome}`);
  }

  const handoffReason = readPayloadString(event.payload, "reason");
  if (handoffReason) {
    facts.push(`Reason: ${handoffReasonLabel(handoffReason)}`);
  }

  const handoffSummary = readPayloadString(event.payload, "reason_summary");
  if (handoffSummary) {
    facts.push(`Staff note: ${handoffSummary}`);
  }

  const priority = readPayloadString(event.payload, "priority");
  if (priority) {
    facts.push(`Urgency: ${titleCaseWords(priority)}`);
  }

  const transferImmediately = readPayloadBoolean(event.payload, "transfer_immediately");
  if (transferImmediately) {
    facts.push("Immediate transfer requested");
  }

  return facts;
}

export function routeDisplayName(route: CallOpsRouteHotspot | null): string {
  if (!route) {
    return "No slow routes detected";
  }
  const bits = [route.node_name, route.route].filter((part) => part && part.trim().length > 0);
  return bits.join(" \u00b7 ");
}
