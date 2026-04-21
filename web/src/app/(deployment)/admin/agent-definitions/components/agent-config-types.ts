/**
 * Working-state shape used by the new agent-builder detail panel and its
 * 5 tabs. Independent from the backend `AdminAgentDefinitionVersion`
 * shape — designed to be friendly to form binding.
 */

export type FirstMessageMode = "assistant_speaks_first" | "user_speaks_first" | "wait_for_greeting";

export interface ModelConfig {
  provider: string;
  model: string;
  first_message_mode: FirstMessageMode;
  first_message: string;
  system_prompt: string;
  temperature: number;
}

export interface VoiceConfig {
  provider: string;
  voice: string;
  language: string;
}

export interface ToolConfig {
  /** Tool catalog id (matches `ToolCatalogEntry.id`). */
  id: string;
  enabled: boolean;
  /** Per-tool overrides keyed by param name. Free-form string values for now. */
  overrides: Record<string, string>;
}

export interface AnalysisFieldConfig {
  name: string;
  json_path: string;
  type: "string" | "number" | "boolean" | "enum";
}

export interface AnalysisConfig {
  summary_prompt: string;
  success_criteria: string;
  fields: AnalysisFieldConfig[];
}

export interface AdvancedConfig {
  transcriber_provider: string;
  transcriber_model: string;
  language_detection: boolean;
  recording_retention_days: number;
  pii_redaction: boolean;
}

export interface AgentBuilderConfig {
  model: ModelConfig;
  voice: VoiceConfig;
  tools: ToolConfig[];
  analysis: AnalysisConfig;
  advanced: AdvancedConfig;
}

export const DEFAULT_AGENT_CONFIG: AgentBuilderConfig = {
  model: {
    provider: "openai",
    model: "gpt-4o-mini",
    first_message_mode: "assistant_speaks_first",
    first_message: "Halo, ada yang bisa saya bantu?",
    system_prompt: "You are a helpful voice assistant.",
    temperature: 0.7,
  },
  voice: {
    provider: "azure",
    voice: "id-ID-GadisNeural",
    language: "id-ID",
  },
  tools: [],
  analysis: {
    summary_prompt: "Summarise the call in 2-3 sentences, focusing on the caller's request and the outcome.",
    success_criteria: "The caller's request was acknowledged and either fulfilled or escalated.",
    fields: [],
  },
  advanced: {
    transcriber_provider: "deepgram",
    transcriber_model: "nova-2",
    language_detection: false,
    recording_retention_days: 45,
    pii_redaction: true,
  },
};
