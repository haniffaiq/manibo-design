/**
 * Mock fixtures for the rebuilt agent-builder workbench.
 *
 * Backs the mock dispatcher routes:
 *   /admin/model-providers          → modelProviderCatalog
 *   /admin/voice-providers          → voiceProviderCatalog
 *   /admin/transcriber-providers    → transcriberProviderCatalog
 *   /admin/tool-catalog             → toolCatalog
 *   /admin/agent-templates          → agentTemplates
 *
 * Plus client-side-only fixtures (not served via dispatcher):
 *   liveTestStream  — scripted transcript + log frames for the simulated
 *                     live-test session
 *   mockRecordings  — list of past test recordings used by the playback bar
 */

/* ------------------------------------------------------------------ */
/*  Model provider catalog                                             */
/* ------------------------------------------------------------------ */

export type ModelProviderId = "openai" | "anthropic" | "google";

export interface ModelOption {
  id: string;
  label: string;
  context_window: number;
  notes?: string;
}

export interface ModelProvider {
  id: ModelProviderId;
  label: string;
  models: ModelOption[];
}

export const modelProviderCatalog: ModelProvider[] = [
  {
    id: "openai",
    label: "OpenAI",
    models: [
      { id: "gpt-4o", label: "GPT-4o", context_window: 128000 },
      { id: "gpt-4o-mini", label: "GPT-4o mini", context_window: 128000, notes: "Lower cost" },
      { id: "gpt-4.1", label: "GPT-4.1", context_window: 1000000, notes: "Long context" },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo", context_window: 128000 },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic",
    models: [
      { id: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", context_window: 200000 },
      { id: "claude-3-5-haiku", label: "Claude 3.5 Haiku", context_window: 200000, notes: "Fastest" },
      { id: "claude-3-opus", label: "Claude 3 Opus", context_window: 200000 },
    ],
  },
  {
    id: "google",
    label: "Google",
    models: [
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", context_window: 2000000, notes: "Long context" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", context_window: 1000000, notes: "Fastest" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Voice (TTS) provider catalog                                       */
/* ------------------------------------------------------------------ */

export type VoiceProviderId = "azure" | "elevenlabs" | "openai_tts";
export type VoiceGender = "female" | "male" | "neutral";

export interface VoiceOption {
  id: string;
  label: string;
  gender: VoiceGender;
  language: string;
}

export interface VoiceProvider {
  id: VoiceProviderId;
  label: string;
  voices: VoiceOption[];
}

export const voiceProviderCatalog: VoiceProvider[] = [
  {
    id: "azure",
    label: "Azure",
    voices: [
      { id: "id-ID-ArdiNeural", label: "Ardi", gender: "male", language: "id-ID" },
      { id: "id-ID-GadisNeural", label: "Gadis", gender: "female", language: "id-ID" },
      { id: "en-US-JennyNeural", label: "Jenny", gender: "female", language: "en-US" },
      { id: "en-US-GuyNeural", label: "Guy", gender: "male", language: "en-US" },
    ],
  },
  {
    id: "elevenlabs",
    label: "ElevenLabs",
    voices: [
      { id: "rachel", label: "Rachel", gender: "female", language: "en-US" },
      { id: "antoni", label: "Antoni", gender: "male", language: "en-US" },
      { id: "bella", label: "Bella", gender: "female", language: "en-US" },
      { id: "adam", label: "Adam", gender: "male", language: "en-US" },
    ],
  },
  {
    id: "openai_tts",
    label: "OpenAI TTS",
    voices: [
      { id: "alloy", label: "Alloy", gender: "neutral", language: "en-US" },
      { id: "echo", label: "Echo", gender: "male", language: "en-US" },
      { id: "fable", label: "Fable", gender: "neutral", language: "en-US" },
      { id: "onyx", label: "Onyx", gender: "male", language: "en-US" },
      { id: "nova", label: "Nova", gender: "female", language: "en-US" },
      { id: "shimmer", label: "Shimmer", gender: "female", language: "en-US" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Transcriber (STT) provider catalog                                 */
/* ------------------------------------------------------------------ */

export type TranscriberProviderId = "deepgram" | "openai_whisper" | "azure_stt";

export interface TranscriberOption {
  id: string;
  label: string;
  notes?: string;
}

export interface TranscriberProvider {
  id: TranscriberProviderId;
  label: string;
  models: TranscriberOption[];
}

export const transcriberProviderCatalog: TranscriberProvider[] = [
  {
    id: "deepgram",
    label: "Deepgram",
    models: [
      { id: "nova-2", label: "Nova-2", notes: "Best accuracy" },
      { id: "nova-2-conversationalai", label: "Nova-2 Conversational" },
      { id: "enhanced", label: "Enhanced" },
    ],
  },
  {
    id: "openai_whisper",
    label: "OpenAI Whisper",
    models: [{ id: "whisper-1", label: "Whisper-1" }],
  },
  {
    id: "azure_stt",
    label: "Azure Speech",
    models: [
      { id: "azure-stt-standard", label: "Standard" },
      { id: "azure-stt-conversational", label: "Conversational" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Tool catalog                                                       */
/* ------------------------------------------------------------------ */

export type ToolParamType = "string" | "number" | "boolean" | "enum";

export interface ToolParam {
  name: string;
  type: ToolParamType;
  required: boolean;
  description: string;
  enumValues?: string[];
}

export interface ToolCatalogEntry {
  id: string;
  name: string;
  category: "scheduling" | "messaging" | "lookup" | "handoff";
  description: string;
  icon: string;
  params: ToolParam[];
}

export const toolCatalog: ToolCatalogEntry[] = [
  {
    id: "lookup_slots",
    name: "lookup_slots",
    category: "scheduling",
    description: "Find open clinic appointment slots for a given date range and specialty.",
    icon: "calendar",
    params: [
      { name: "specialty", type: "string", required: true, description: "Medical specialty, e.g. dermatology." },
      { name: "city", type: "string", required: false, description: "Filter by city." },
      { name: "from_date", type: "string", required: true, description: "ISO date, inclusive." },
      { name: "to_date", type: "string", required: true, description: "ISO date, inclusive." },
    ],
  },
  {
    id: "create_booking",
    name: "create_booking",
    category: "scheduling",
    description: "Create a confirmed booking for the caller in the chosen slot.",
    icon: "calendar-plus",
    params: [
      { name: "slot_id", type: "string", required: true, description: "Slot identifier from lookup_slots." },
      { name: "patient_name", type: "string", required: true, description: "Caller's full name." },
      { name: "patient_phone", type: "string", required: true, description: "Phone in E.164 format." },
      { name: "notes", type: "string", required: false, description: "Free-form note for the clinic." },
    ],
  },
  {
    id: "send_sms",
    name: "send_sms",
    category: "messaging",
    description: "Send an SMS confirmation or reminder to a phone number.",
    icon: "message",
    params: [
      { name: "phone", type: "string", required: true, description: "Recipient phone in E.164." },
      { name: "body", type: "string", required: true, description: "SMS body, 1–320 chars." },
    ],
  },
  {
    id: "transfer_to_human",
    name: "transfer_to_human",
    category: "handoff",
    description: "Hand off the call to a live human operator queue.",
    icon: "user-headset",
    params: [
      { name: "queue", type: "enum", required: true, description: "Operator queue id.", enumValues: ["clinic-front-desk", "billing", "vip"] },
      { name: "reason", type: "string", required: false, description: "Why the agent is escalating." },
    ],
  },
  {
    id: "lookup_customer",
    name: "lookup_customer",
    category: "lookup",
    description: "Look up an existing customer record by phone or email.",
    icon: "search",
    params: [
      { name: "phone", type: "string", required: false, description: "Phone in E.164." },
      { name: "email", type: "string", required: false, description: "Email address." },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Agent templates (used by the create wizard)                        */
/* ------------------------------------------------------------------ */

export interface AgentTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  defaults: {
    model_provider: ModelProviderId;
    model_id: string;
    voice_provider: VoiceProviderId;
    voice_id: string;
    language: string;
    first_message_mode: "assistant_speaks_first" | "user_speaks_first" | "wait_for_greeting";
    first_message: string;
    system_prompt: string;
    tools: string[];
  };
}

export const agentTemplates: AgentTemplate[] = [
  {
    id: "tpl_blank",
    name: "Blank",
    tagline: "Start from scratch",
    description: "An empty assistant with sensible defaults. Configure everything yourself.",
    icon: "file",
    defaults: {
      model_provider: "openai",
      model_id: "gpt-4o-mini",
      voice_provider: "azure",
      voice_id: "id-ID-GadisNeural",
      language: "id-ID",
      first_message_mode: "assistant_speaks_first",
      first_message: "Halo, ada yang bisa saya bantu?",
      system_prompt: "You are a helpful voice assistant. Speak in clear, friendly Bahasa Indonesia.",
      tools: [],
    },
  },
  {
    id: "tpl_booking",
    name: "Booking Assistant",
    tagline: "Clinic appointment scheduler",
    description: "Books appointments, reschedules, and confirms slots. Wired to lookup_slots, create_booking, and send_sms.",
    icon: "calendar-check",
    defaults: {
      model_provider: "openai",
      model_id: "gpt-4o",
      voice_provider: "azure",
      voice_id: "id-ID-GadisNeural",
      language: "id-ID",
      first_message_mode: "assistant_speaks_first",
      first_message: "Halo, terima kasih sudah menelepon. Saya asisten penjadwalan, ingin membuat janji untuk kapan?",
      system_prompt: "You are a clinic scheduling assistant. Help callers find and confirm appointment slots. Always confirm patient name and phone before booking.",
      tools: ["lookup_slots", "create_booking", "send_sms", "transfer_to_human"],
    },
  },
  {
    id: "tpl_driver_verification",
    name: "Driver Verification",
    tagline: "Identity verification by voice",
    description: "Outbound calls that verify driver identity and document status with structured data extraction.",
    icon: "shield-check",
    defaults: {
      model_provider: "openai",
      model_id: "gpt-4o",
      voice_provider: "azure",
      voice_id: "id-ID-ArdiNeural",
      language: "id-ID",
      first_message_mode: "assistant_speaks_first",
      first_message: "Selamat siang, saya menelepon untuk verifikasi data pengemudi. Apakah benar saya berbicara dengan Bapak/Ibu yang bersangkutan?",
      system_prompt: "You verify driver identity for a logistics platform. Confirm full name, ID number, and license expiry. Escalate any mismatch.",
      tools: ["lookup_customer", "transfer_to_human"],
    },
  },
  {
    id: "tpl_lead_capture",
    name: "Lead Capture",
    tagline: "Inbound lead intake",
    description: "Greets inbound callers, captures contact details, and qualifies the lead before handoff.",
    icon: "phone-incoming",
    defaults: {
      model_provider: "anthropic",
      model_id: "claude-3-5-haiku",
      voice_provider: "elevenlabs",
      voice_id: "rachel",
      language: "en-US",
      first_message_mode: "assistant_speaks_first",
      first_message: "Hi, thanks for calling! I'd love to learn a bit about what you're looking for — could you start with your name?",
      system_prompt: "You are an inbound lead intake agent. Capture name, company, email, and the prospect's main need. Stay warm and concise.",
      tools: ["lookup_customer", "send_sms", "transfer_to_human"],
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Live test stream (client-side fixture, not served via dispatcher)  */
/* ------------------------------------------------------------------ */

export type LiveTestFrameKind =
  | "log"
  | "transcript_user"
  | "transcript_agent"
  | "level"
  | "ended";

export interface LiveTestFrame {
  delayMs: number;
  kind: LiveTestFrameKind;
  payload: {
    text?: string;
    eventType?: string;
    summary?: string;
    micLevel?: number;
    agentLevel?: number;
  };
}

export const liveTestStream: LiveTestFrame[] = [
  { delayMs: 0, kind: "log", payload: { eventType: "session.created", summary: "Browser voice session created." } },
  { delayMs: 250, kind: "log", payload: { eventType: "call.up", summary: "Mic stream connected, agent online." } },
  { delayMs: 500, kind: "level", payload: { micLevel: 0.05, agentLevel: 0.4 } },
  { delayMs: 700, kind: "transcript_agent", payload: { text: "Halo, terima kasih sudah menelepon. Ada yang bisa saya bantu hari ini?" } },
  { delayMs: 1100, kind: "log", payload: { eventType: "tts.spoken", summary: "Greeting played to caller." } },
  { delayMs: 1400, kind: "level", payload: { micLevel: 0.55, agentLevel: 0.05 } },
  { delayMs: 2100, kind: "transcript_user", payload: { text: "Halo, saya mau buat janji kontrol untuk hari Jumat." } },
  { delayMs: 2300, kind: "log", payload: { eventType: "stt.final", summary: "Captured user utterance." } },
  { delayMs: 2400, kind: "log", payload: { eventType: "llm.start", summary: "GPT-4o invoked." } },
  { delayMs: 3200, kind: "log", payload: { eventType: "tool.lookup_slots.start", summary: "Looking up slots for Friday." } },
  { delayMs: 3700, kind: "log", payload: { eventType: "tool.lookup_slots.ok", summary: "Found 3 slots." } },
  { delayMs: 3900, kind: "level", payload: { micLevel: 0.05, agentLevel: 0.5 } },
  { delayMs: 4100, kind: "transcript_agent", payload: { text: "Tentu, hari Jumat ada slot jam sepuluh pagi, dua siang, atau empat sore. Mana yang cocok?" } },
  { delayMs: 5200, kind: "level", payload: { micLevel: 0.5, agentLevel: 0.05 } },
  { delayMs: 5800, kind: "transcript_user", payload: { text: "Yang dua siang saja." } },
  { delayMs: 6000, kind: "log", payload: { eventType: "stt.final", summary: "User chose 14:00 slot." } },
  { delayMs: 6300, kind: "log", payload: { eventType: "tool.create_booking.start", summary: "Creating booking." } },
  { delayMs: 7000, kind: "log", payload: { eventType: "tool.create_booking.ok", summary: "Booking confirmed." } },
  { delayMs: 7100, kind: "level", payload: { micLevel: 0.05, agentLevel: 0.45 } },
  { delayMs: 7300, kind: "transcript_agent", payload: { text: "Sudah saya catat, Jumat jam dua siang. SMS konfirmasi akan dikirim ke nomor Anda. Ada lagi yang bisa saya bantu?" } },
  { delayMs: 8500, kind: "transcript_user", payload: { text: "Tidak, terima kasih." } },
  { delayMs: 8800, kind: "transcript_agent", payload: { text: "Sama-sama, sampai jumpa." } },
  { delayMs: 9200, kind: "log", payload: { eventType: "call.ended", summary: "Call ended normally." } },
  { delayMs: 9300, kind: "ended", payload: {} },
];

/* ------------------------------------------------------------------ */
/*  Mock recordings (for the playback bar)                             */
/* ------------------------------------------------------------------ */

export interface MockRecording {
  id: string;
  call_id: string;
  label: string;
  duration_ms: number;
  created_at: string;
  /** Path under /public — served as a static asset by Next. */
  url: string;
}

export const mockRecordings: MockRecording[] = [
  {
    id: "rec_001",
    call_id: "call_01JCALL0099",
    label: "Booking — Friday 14:00 (2026-04-16 09:32)",
    duration_ms: 252000,
    created_at: "2026-04-16T09:32:00Z",
    url: "/mock-recordings/sample-call-01.mp3",
  },
  {
    id: "rec_002",
    call_id: "call_01JCALL0098",
    label: "Reschedule — Tuesday 10:00 (2026-04-16 08:11)",
    duration_ms: 184000,
    created_at: "2026-04-16T08:11:00Z",
    url: "/mock-recordings/sample-call-01.mp3",
  },
  {
    id: "rec_003",
    call_id: "call_01JCALL0097",
    label: "Driver verification (2026-04-15 16:48)",
    duration_ms: 312000,
    created_at: "2026-04-15T16:48:00Z",
    url: "/mock-recordings/sample-call-01.mp3",
  },
];
