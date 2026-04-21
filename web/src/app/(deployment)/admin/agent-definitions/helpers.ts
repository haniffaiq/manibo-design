import { toErrorMessage } from "@grove/web-shared/lib/error-message";

import { platformApiRequest } from "@/lib/api/platform";

export type {
  AdminAgentDefinitionArtifact,
  AdminAgentDefinitionStatus,
  AdminAgentDefinitionSummary,
  AdminAgentDefinitionVersionDetail,
  AdminAgentDefinitionVersionStatus,
} from "@/lib/api/admin-agent-definitions";

export type { PlatformDefaultsSummary } from "@/lib/api/admin-settings";
export type { AdminTenantSummary } from "@/lib/api/tenants";

export const EMPTY_TENANTS: import("@/lib/api/tenants").AdminTenantSummary[] = [];
export const EMPTY_DEFINITIONS: import("@/lib/api/admin-agent-definitions").AdminAgentDefinitionSummary[] = [];
export const EMPTY_VERSIONS: import("@/lib/api/admin-agent-definitions").AdminAgentDefinitionVersionDetail[] = [];
export const EMPTY_PLATFORM_DEFAULTS: import("@/lib/api/admin-settings").PlatformDefaultsSummary[] = [];
export const AGENT_NAME_PATTERN = /^[a-z][a-z0-9_-]{1,63}$/;

export type AgentStarter = {
  key: string;
  title: string;
  recommended_definition_name: string;
  solution: string;
  summary: string;
  yaml: string;
};

export const EMPTY_STARTERS: AgentStarter[] = [];

export async function getAgentStarters(): Promise<AgentStarter[]> {
  try {
    return await platformApiRequest<AgentStarter[]>("/admin/agent-starters");
  } catch {
    return [];
  }
}

export function normalizeDefinitionName(value: string): string {
  const collapsed = value
    .trim()
    .toLowerCase()
    .replace(/['\".,()]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  const withoutLeadingNoise = collapsed.replace(/^[^a-z]+/, "");
  return withoutLeadingNoise.slice(0, 64);
}

export { toErrorMessage };

export function toGovernedAssistantErrorMessage(error: unknown): string {
  const message = toErrorMessage(error);
  if (message.includes("No platform defaults versions exist")) {
    return "Create a starting settings version in Admin Settings before creating a governed assistant draft.";
  }
  if (message.includes("Platform defaults storage is not initialized")) {
    return "Platform settings are not initialized yet. Run the public schema migrations and seed one starting settings version before creating governed assistant drafts.";
  }
  return message;
}

export function formatDate(iso: string | null): string {
  if (!iso) {
    return "-";
  }
  return new Date(iso).toLocaleString();
}

export function definitionStatusLabel(
  status: import("@/lib/api/admin-agent-definitions").AdminAgentDefinitionStatus,
): string {
  if (status === "published") return "Live";
  if (status === "draft") return "Draft";
  if (status === "retired") return "Archived";
  return status;
}

export function versionStatusLabel(
  status: import("@/lib/api/admin-agent-definitions").AdminAgentDefinitionVersionStatus,
): string {
  if (status === "published") return "Live";
  if (status === "previously_published") return "Previously live";
  if (status === "draft") return "Draft";
  if (status === "in_review") return "Under review";
  if (status === "rejected") return "Rejected";
  if (status === "archived") return "Archived";
  return status;
}

export function definitionStatusVariant(
  status: import("@/lib/api/admin-agent-definitions").AdminAgentDefinitionStatus,
): "success" | "warning" | "neutral" {
  if (status === "published") {
    return "success";
  }
  if (status === "draft") {
    return "warning";
  }
  return "neutral";
}

export function versionStatusVariant(
  status: import("@/lib/api/admin-agent-definitions").AdminAgentDefinitionVersionStatus,
): "success" | "warning" | "neutral" | "error" {
  if (status === "published") {
    return "success";
  }
  if (status === "rejected") {
    return "error";
  }
  if (status === "draft" || status === "in_review") {
    return "warning";
  }
  return "neutral";
}

export function defaultVersionYaml(name: string): string {
  return `name: ${name}\nmission: describe your agent mission\n`;
}

export function applyYamlName(sourceYaml: string, name: string): string {
  if (/^name:\s*.+$/m.test(sourceYaml)) {
    return sourceYaml.replace(/^name:\s*.+$/m, `name: ${name}`);
  }

  const lines = sourceYaml.split("\n");
  const agentBlockIndex = lines.findIndex((line) => line.trim() === "agent:");
  if (agentBlockIndex >= 0) {
    for (let index = agentBlockIndex + 1; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line.trim()) {
        continue;
      }
      if (/^[^\s]/.test(line)) {
        break;
      }
      if (/^\s+name:\s*.+$/.test(line)) {
        lines[index] = line.replace(/^\s+name:\s*.+$/, (match) => match.replace(/name:\s*.+$/, `name: ${name}`));
        return lines.join("\n");
      }
    }
  }
  return `name: ${name}\n${sourceYaml}`;
}

export function findStarterByKey(starterKey: string | null | undefined, starters: AgentStarter[]): AgentStarter | null {
  if (!starterKey) {
    return null;
  }
  return starters.find((starter) => starter.key === starterKey) ?? null;
}

export function findMatchingStarter(name: string, starters: AgentStarter[]): AgentStarter | null {
  const normalized = normalizeDefinitionName(name);
  return starters.find((s) => normalized === s.recommended_definition_name) ?? null;
}

export function initialVersionYaml(name: string, starters: AgentStarter[], starterKey?: string | null): string {
  if (starterKey === "blank") {
    return defaultVersionYaml(name);
  }
  const match = findStarterByKey(starterKey, starters) ?? findMatchingStarter(name, starters);
  if (match) {
    return applyYamlName(match.yaml, name);
  }
  return defaultVersionYaml(name);
}

export function definitionTrafficLabel(
  definition: import("@/lib/api/admin-agent-definitions").AdminAgentDefinitionSummary,
): string {
  if (definition.published_version != null) {
    return `v${definition.published_version} live`;
  }
  if (definition.status === "retired") {
    return "Archived";
  }
  return "Not live";
}

export function extractYamlField(sourceYaml: string, field: string): string | null {
  const pattern = new RegExp(`^${field}:\\s*(.+)$`, "m");
  const match = sourceYaml.match(pattern);
  return match?.[1]?.trim() ?? null;
}

export function missionPreview(
  version: import("@/lib/api/admin-agent-definitions").AdminAgentDefinitionVersionDetail,
): string {
  return extractYamlField(version.source_yaml, "mission") ?? "No mission line found in this YAML.";
}

export function versionChangeSummary(
  version: import("@/lib/api/admin-agent-definitions").AdminAgentDefinitionVersionDetail,
): string[] {
  const changes = [
    `Source ${version.source_yaml_hash.slice(0, 8)}`,
    `Compiled ${version.compiled_hash.slice(0, 8)}`,
  ];
  return changes;
}

export type DefinitionRef = {
  id: string;
  name: string;
};

export type DefinitionRouteFocus = {
  tenantId: string | null;
  definitionId: string | null;
  definitionName: string | null;
  version: number | null;
  source: string | null;
};

export function parseDefinitionRouteFocus(search: string): DefinitionRouteFocus | null {
  const params = new URLSearchParams(search);
  const tenantId = params.get("tenant_id");
  const definitionId = params.get("definition_id");
  const definitionName = params.get("definition_name");
  const versionRaw = params.get("version");
  const source = params.get("source");
  const version = versionRaw && /^\d+$/.test(versionRaw) ? Number.parseInt(versionRaw, 10) : null;

  if (!tenantId && !definitionId && !definitionName && version == null && !source) {
    return null;
  }

  return {
    tenantId,
    definitionId,
    definitionName,
    version,
    source,
  };
}
