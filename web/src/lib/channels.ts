import type { AdminPhoneChannelRecord } from "@/lib/api/phone-numbers";

export type AdminChannelType = "phone" | "email" | "web_chat" | "widget" | "whatsapp";
export type AdminChannelRuntimeState = "live" | "needs_setup" | "paused";

export interface AdminChannelTypeDefinition {
  type: AdminChannelType;
  label: string;
  icon: string;
  available: boolean;
  description: string;
}

export interface AdminPhoneChannelSummary {
  id: string;
  type: "phone";
  endpoint: string;
  routing_id: string;
  assistant_id: string | null;
  assistant_name: string | null;
  published_version: number | null;
  active: boolean;
  routing_ready: boolean;
  runtime_state: AdminChannelRuntimeState;
  created_at: string;
}

export const ADMIN_CHANNEL_TYPES: readonly AdminChannelTypeDefinition[] = [
  {
    type: "phone",
    label: "Phone",
    icon: "\u260E",
    available: true,
    description: "Connect public phone numbers and route live calls to one published assistant.",
  },
  {
    type: "email",
    label: "Email",
    icon: "\u2709",
    available: false,
    description: "Handle inbound mailboxes and route messages into the same assistant runtime later.",
  },
  {
    type: "web_chat",
    label: "Web Chat",
    icon: "\u{1F4AC}",
    available: false,
    description: "Hosted browser chat for tenant-owned sites.",
  },
  {
    type: "widget",
    label: "Widget",
    icon: "\u25A3",
    available: false,
    description: "Embeddable assistant widget for third-party websites.",
  },
  {
    type: "whatsapp",
    label: "WhatsApp",
    icon: "\u{1F4F1}",
    available: false,
    description: "Business messaging routed through an approved WhatsApp sender later.",
  },
] as const;

export function toAdminPhoneChannelSummary(record: AdminPhoneChannelRecord): AdminPhoneChannelSummary {
  return {
    id: record.id,
    type: "phone",
    endpoint: record.phone_number,
    routing_id: record.sip_trunk_id,
    assistant_id: record.agent_definition_id,
    assistant_name: record.agent_name,
    published_version: record.published_version,
    active: record.active,
    routing_ready: record.routing_ready,
    runtime_state: record.active ? (record.routing_ready ? "live" : "needs_setup") : "paused",
    created_at: record.created_at,
  };
}

export function adminChannelRuntimeLabel(state: AdminChannelRuntimeState): string {
  if (state === "live") {
    return "Ready";
  }
  if (state === "paused") {
    return "Paused";
  }
  return "Needs attention";
}

export function adminChannelRuntimeVariant(state: AdminChannelRuntimeState): "success" | "warning" | "neutral" {
  if (state === "live") {
    return "success";
  }
  if (state === "paused") {
    return "neutral";
  }
  return "warning";
}
