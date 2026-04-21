"use client";

import { type BadgeVariant } from "@grove/ui/badge";
import { type DataTableColumn } from "@grove/ui/data-table";

import { type AdminAgentDefinitionSummary } from "@/lib/api/admin-agent-definitions";
import {
  type TelephonyNumberBindingSummary,
  type TelephonyNumberStatus,
  type TelephonyProviderAccountStatus,
  type TelephonyProviderOperation,
  type TelephonyProviderOperationSupport,
  type TelephonyProviderAccountView,
  type TelephonyProviderKind,
  type TelephonyProviderPackMetadata,
  type TelephonyTenantPolicyView,
  type TelephonyTrunkView,
} from "@/lib/api/admin-telephony";
import { type AdminPhoneChannelRecord } from "@/lib/api/phone-numbers";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";

export type TenantPhoneBinding = AdminPhoneChannelRecord & {
  tenant_name: string;
  tenant_slug: string;
};

export type ProviderTableRow = {
  id: string;
  providerLabel: string;
  canConnect: boolean;
  canDelete: boolean;
  connectLabel: string | null;
  statusLabel: string;
  statusVariant: BadgeVariant;
  trunkCount: number;
  numberCount: number;
};

export type NumberEditorDraft = {
  tenantId: string;
  agentDefinitionId: string;
  active: boolean;
};

type AssignmentStatusArgs = {
  binding: TenantPhoneBinding | null;
  sipTrunkId: string | null;
  numberStatus: TelephonyNumberStatus;
};

type NumberEditorBlockedReasonArgs = {
  hasSelectedNumber: boolean;
  bindingLookupPending: boolean;
  allowsDeploymentDefault: boolean | null;
  draftTenantId: string;
  draftTenantStatus: string | null;
  publishedAssistantCount: number;
};

export const PROVIDER_EMPTY_DRAFT = {
  providerKind: "",
  displayName: "",
  credentialRef: "",
  credentialConfigured: false,
  credentialRefTouched: false,
  providerMetadata: "",
  providerMetadataTouched: false,
} as const;

export const NUMBER_EMPTY_DRAFT: NumberEditorDraft = {
  tenantId: "",
  agentDefinitionId: "",
  active: false,
};

export function resolveInitialAdminTelephonyTab({
  requestedTabParam,
  requestedTenantId,
  requestedAssistantId,
}: {
  requestedTabParam: string | null;
  requestedTenantId: string;
  requestedAssistantId: string;
}): "providers" | "numbers" {
  if (requestedTabParam != null) {
    return requestedTabParam === "numbers" ? "numbers" : "providers";
  }
  return requestedTenantId || requestedAssistantId ? "numbers" : "providers";
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

export function providerKindLabel(providerKind: TelephonyProviderKind): string {
  return providerKind === "telnyx" ? "Telnyx" : "Genesys";
}

export function providerOptionCanBeConnectedFromWorkspace(option: TelephonyProviderPackMetadata): boolean {
  return option.capability_matrix.some(
    (capability) => capability.capability === "telephony.connect_provider_account" && capability.enabled,
  );
}

export function providerOperationSupport(
  option: TelephonyProviderPackMetadata | null,
  operation: TelephonyProviderOperation,
): TelephonyProviderOperationSupport | null {
  return option?.operations.find((item) => item.operation === operation) ?? null;
}

export function providerOptionCanSyncInventory(option: TelephonyProviderPackMetadata | null): boolean {
  return ["sync_trunks", "sync_numbers"].some((operation) => {
    const support = providerOperationSupport(option, operation as TelephonyProviderOperation);
    return Boolean(support?.implemented && support.mode !== "unsupported");
  });
}

export function providerOptionRequiresConnectionTest(option: TelephonyProviderPackMetadata | null): boolean {
  const support = providerOperationSupport(option, "validate_account");
  return Boolean(support?.implemented && support.mode === "managed");
}

export function formatProviderMetadataDraft(providerMetadata: Record<string, unknown>): string {
  return Object.keys(providerMetadata).length === 0 ? "" : JSON.stringify(providerMetadata, null, 2);
}

export function parseProviderMetadataDraft(raw: string): Record<string, unknown> | undefined {
  const normalized = raw.trim();
  if (!normalized) {
    return undefined;
  }
  const parsed = JSON.parse(normalized) as unknown;
  if (parsed == null || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("Provider metadata must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

export function collapseLoadError(...errors: Array<Error | unknown | null | undefined>): string | null {
  const firstError = errors.find((error) => error != null);
  return firstError == null ? null : toErrorMessage(firstError);
}

export function providerStatusVariant(status: TelephonyProviderAccountStatus): BadgeVariant {
  if (status === "connected") {
    return "success";
  }
  if (status === "degraded" || status === "validating") {
    return "warning";
  }
  if (status === "disconnected" || status === "archived") {
    return "error";
  }
  return "neutral";
}

export function providerStatusLabel(status: TelephonyProviderAccountStatus): string {
  if (status === "draft") return "Needs secret";
  if (status === "validating") return "Checking connection";
  if (status === "connected") return "Connected";
  if (status === "degraded") return "Needs attention";
  if (status === "disconnected") return "Disconnected";
  return "Archived";
}

export function assignmentStatusVariant({ binding, numberStatus }: AssignmentStatusArgs): BadgeVariant {
  if (binding?.active && binding.routing_ready && numberStatus === "assigned") {
    return "success";
  }
  if (binding != null) {
    return "warning";
  }
  return "neutral";
}

export function assignmentStatusLabel({ binding, numberStatus }: AssignmentStatusArgs): string {
  if (binding?.active && binding.routing_ready && numberStatus === "assigned") {
    return "Ready";
  }
  return "Needs attention";
}

export function numberHelperText({ binding, sipTrunkId, numberStatus }: AssignmentStatusArgs): string | null {
  if (!sipTrunkId) {
    return "This number is not ready for assignment yet. Sync provider inventory and try again.";
  }
  if (binding == null) {
    return "Choose a tenant and assistant to assign this number.";
  }
  if (!binding.active) {
    return "This number is assigned, but routing is paused.";
  }
  if (!binding.routing_ready || numberStatus !== "assigned") {
    return "This number is assigned, but routing still needs attention before calls can flow.";
  }
  return null;
}

export function policyVariant(policy: TelephonyTenantPolicyView | null): BadgeVariant {
  if (!policy) {
    return "neutral";
  }
  if (policy.mode === "default_with_byo_override") {
    return "success";
  }
  if (policy.mode === "byo_only") {
    return "warning";
  }
  return "neutral";
}

export function policyLabel(policy: TelephonyTenantPolicyView | null): string {
  if (!policy) {
    return "Policy unavailable";
  }
  if (policy.mode === "default_only") {
    return "Deployment default only";
  }
  if (policy.mode === "default_with_byo_override") {
    return "Default plus tenant BYO";
  }
  return "Tenant BYO only";
}

export function policyHelperText(policy: TelephonyTenantPolicyView | null): string {
  if (!policy) {
    return "Select a tenant to see how deployment-managed telephony is allowed here.";
  }
  if (policy.mode === "default_only") {
    return "This tenant can use deployment-managed telephony, but tenant-owned BYO providers are blocked.";
  }
  if (policy.mode === "default_with_byo_override") {
    return "Deployment telephony is allowed here, but tenant-owned providers win when both exist.";
  }
  return "This tenant is BYO-only. Deployment-managed numbers stay blocked here because tenant-managed telephony is not self-serve in this workspace yet.";
}

export function requestedAssistantIdForTenant(
  assistants: AdminAgentDefinitionSummary[],
  requestedAssistantId: string,
): string {
  if (assistants.some((assistant) => assistant.id === requestedAssistantId)) {
    return requestedAssistantId;
  }
  return assistants[0]?.id ?? "";
}

export function defaultAssignmentActive(numberStatus: TelephonyNumberStatus | null): boolean {
  return numberStatus === "assigned";
}

export function numberEditorBlockedReason({
  hasSelectedNumber,
  bindingLookupPending,
  allowsDeploymentDefault,
  draftTenantId,
  draftTenantStatus,
  publishedAssistantCount,
}: NumberEditorBlockedReasonArgs): string | null {
  if (!hasSelectedNumber) {
    return "Select a number to review or assign it.";
  }
  if (bindingLookupPending) {
    return "Loading the current assignment for this number.";
  }
  if (allowsDeploymentDefault === false) {
    return "This tenant is BYO-only. Deployment-managed numbers stay blocked here because tenant-managed telephony is not self-serve in this workspace yet.";
  }
  if (!draftTenantId) {
    return "Choose a tenant before assigning this number.";
  }
  if (draftTenantStatus != null && draftTenantStatus !== "active") {
    return "Only active tenants can receive deployment-managed number assignments.";
  }
  if (publishedAssistantCount === 0) {
    return "Publish an assistant for this tenant before attaching a number.";
  }
  return null;
}

export function decorateTenantBinding(
  binding: AdminPhoneChannelRecord,
  {
    tenantName,
    tenantSlug,
  }: {
    tenantName: string;
    tenantSlug: string;
  },
): TenantPhoneBinding {
  return {
    ...binding,
    tenant_name: tenantName,
    tenant_slug: tenantSlug,
  };
}

export function tenantBindingFromSummary(
  summary: TelephonyNumberBindingSummary,
  {
    phoneNumber,
  }: {
    phoneNumber: string;
  },
): TenantPhoneBinding {
  return {
    id: summary.id,
    tenant_id: summary.tenant_id,
    phone_number: phoneNumber,
    sip_trunk_id: summary.sip_trunk_id,
    active: summary.active,
    agent_definition_id: summary.agent_definition_id,
    agent_name: summary.agent_name,
    agent_status: summary.agent_status,
    published_version: summary.published_version,
    routing_ready: summary.routing_ready,
    created_at: summary.created_at,
    tenant_name: summary.tenant_name ?? summary.tenant_id,
    tenant_slug: summary.tenant_slug ?? summary.tenant_id,
  };
}

function statusDotColor(variant: BadgeVariant): string {
  if (variant === "success") return "bg-emerald-500";
  if (variant === "warning") return "bg-amber-500";
  if (variant === "error") return "bg-red-500";
  return "bg-neutral-400";
}

export const PROVIDER_COLUMNS: DataTableColumn<ProviderTableRow>[] = [
  {
    id: "provider",
    header: "Provider",
    width: "34%",
    className: "!align-middle",
    cell: (row) => <span className="font-medium text-[var(--color-neutral-900)]">{row.providerLabel}</span>,
  },
  {
    id: "trunks",
    header: "Trunks",
    width: "16%",
    className: "!align-middle",
    cell: (row) => <span className="text-sm text-[var(--color-neutral-700)]">{row.trunkCount}</span>,
  },
  {
    id: "numbers",
    header: "Numbers",
    width: "16%",
    className: "!align-middle",
    cell: (row) => <span className="text-sm text-[var(--color-neutral-700)]">{row.numberCount}</span>,
  },
  {
    id: "status",
    header: "Status",
    width: "12%",
    className: "!align-middle",
    cell: (row) => (
      <span className="inline-flex items-center gap-2 text-sm text-[var(--color-neutral-700)]">
        <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${statusDotColor(row.statusVariant)}`} />
        {row.statusLabel}
      </span>
    ),
  },
];
