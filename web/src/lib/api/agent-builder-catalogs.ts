import { platformApiRequest } from "@/lib/api/platform";
import type {
  AgentTemplate,
  ModelProvider,
  ToolCatalogEntry,
  TranscriberProvider,
  VoiceProvider,
} from "@/lib/mock/agent-builder-fixtures";

export type {
  AgentTemplate,
  ModelOption,
  ModelProvider,
  ModelProviderId,
  ToolCatalogEntry,
  ToolParam,
  ToolParamType,
  TranscriberOption,
  TranscriberProvider,
  TranscriberProviderId,
  VoiceGender,
  VoiceOption,
  VoiceProvider,
  VoiceProviderId,
} from "@/lib/mock/agent-builder-fixtures";

export function getModelProviders(): Promise<ModelProvider[]> {
  return platformApiRequest<ModelProvider[]>("/admin/model-providers", { method: "GET" });
}

export function getVoiceProviders(): Promise<VoiceProvider[]> {
  return platformApiRequest<VoiceProvider[]>("/admin/voice-providers", { method: "GET" });
}

export function getTranscriberProviders(): Promise<TranscriberProvider[]> {
  return platformApiRequest<TranscriberProvider[]>("/admin/transcriber-providers", { method: "GET" });
}

export function getToolCatalog(): Promise<ToolCatalogEntry[]> {
  return platformApiRequest<ToolCatalogEntry[]>("/admin/tool-catalog", { method: "GET" });
}

export function getAgentTemplates(): Promise<AgentTemplate[]> {
  return platformApiRequest<AgentTemplate[]>("/admin/agent-templates", { method: "GET" });
}
