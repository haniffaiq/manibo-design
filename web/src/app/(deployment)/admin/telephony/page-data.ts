import { type AdminTelephonyNumberRow } from "@/components/admin-telephony-number-table";
import { type AdminTelephonyProviderInventorySummary } from "@/components/admin-telephony-provider-form";
import {
  type TelephonyNumberView,
  type TelephonyProviderAccountView,
  type TelephonyProviderPackMetadata,
  type TelephonyTrunkView,
} from "@/lib/api/admin-telephony";

import {
  providerOptionCanSyncInventory,
  assignmentStatusLabel,
  assignmentStatusVariant,
  providerKindLabel,
  providerStatusLabel,
  providerStatusVariant,
  tenantBindingFromSummary,
  type ProviderTableRow,
  type TenantPhoneBinding,
} from "./view-models";

export function buildProviderInventoryByAccount(
  providerAccounts: TelephonyProviderAccountView[],
  trunks: TelephonyTrunkView[],
  numbers: TelephonyNumberView[],
): Map<string, AdminTelephonyProviderInventorySummary> {
  const trunkCounts = new Map<string, number>();
  const boundCounts = new Map<string, number>();
  const numberCounts = new Map<string, number>();
  const liveNumberCounts = new Map<string, number>();

  for (const trunk of trunks) {
    trunkCounts.set(trunk.provider_account_id, (trunkCounts.get(trunk.provider_account_id) ?? 0) + 1);
    if (trunk.livekit_binding_id) {
      boundCounts.set(trunk.provider_account_id, (boundCounts.get(trunk.provider_account_id) ?? 0) + 1);
    }
  }

  for (const number of numbers) {
    numberCounts.set(number.provider_account_id, (numberCounts.get(number.provider_account_id) ?? 0) + 1);
    if (number.status === "assigned") {
      liveNumberCounts.set(number.provider_account_id, (liveNumberCounts.get(number.provider_account_id) ?? 0) + 1);
    }
  }

  const summary = new Map<string, AdminTelephonyProviderInventorySummary>();
  for (const account of providerAccounts) {
    summary.set(account.id, {
      trunkCount: trunkCounts.get(account.id) ?? 0,
      boundTrunkCount: boundCounts.get(account.id) ?? 0,
      numberCount: numberCounts.get(account.id) ?? 0,
      liveNumberCount: liveNumberCounts.get(account.id) ?? 0,
    });
  }
  return summary;
}

export function buildProviderTableRows(
  providerAccounts: TelephonyProviderAccountView[],
  providerInventoryByAccount: Map<string, AdminTelephonyProviderInventorySummary>,
  providerOptionsByKind: Map<string, TelephonyProviderPackMetadata>,
  searchQuery: string,
): ProviderTableRow[] {
  const query = searchQuery.trim().toLowerCase();
  const rows = providerAccounts.map((account) => {
    const inventory = providerInventoryByAccount.get(account.id);
    const providerOption = providerOptionsByKind.get(account.provider_kind) ?? null;
    const canonicalProviderLabel = providerKindLabel(account.provider_kind);
    const normalizedDisplayName = account.display_name.trim().toLowerCase();
    const providerLabel =
      normalizedDisplayName === account.provider_kind || normalizedDisplayName === canonicalProviderLabel.toLowerCase()
        ? canonicalProviderLabel
        : account.display_name;
    return {
      id: account.id,
      providerLabel,
      canConnect: account.status !== "archived" && providerOptionCanSyncInventory(providerOption),
      canDelete: account.can_delete ?? false,
      connectLabel: null,
      statusLabel: providerStatusLabel(account.status),
      statusVariant: providerStatusVariant(account.status),
      trunkCount: inventory?.trunkCount ?? 0,
      numberCount: inventory?.numberCount ?? 0,
    };
  });
  if (!query) {
    return rows;
  }
  return rows.filter((row) =>
    [row.providerLabel, row.statusLabel]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
}

function providerNameLabel(account: TelephonyProviderAccountView): string {
  const canonicalProviderLabel = providerKindLabel(account.provider_kind);
  const displayName = account.display_name.trim();
  const normalizedDisplayName = displayName.toLowerCase();
  const canonicalProviderToken = canonicalProviderLabel.toLowerCase();

  if (!displayName) {
    return canonicalProviderLabel;
  }
  if (
    normalizedDisplayName === account.provider_kind ||
    normalizedDisplayName === canonicalProviderToken ||
    normalizedDisplayName.includes(canonicalProviderToken)
  ) {
    return displayName;
  }
  return `${displayName} · ${canonicalProviderLabel}`;
}

export function buildBindingByPhoneNumber(bindings: TenantPhoneBinding[]): Map<string, TenantPhoneBinding> {
  const index = new Map<string, TenantPhoneBinding>();
  for (const binding of bindings) {
    index.set(binding.phone_number, binding);
  }
  return index;
}

export function buildProviderNameById(providerAccounts: TelephonyProviderAccountView[]): Map<string, string> {
  return new Map(
    providerAccounts.map((account) => [account.id, providerNameLabel(account)]),
  );
}

export function buildTrunkById(trunks: TelephonyTrunkView[]): Map<string, TelephonyTrunkView> {
  return new Map(trunks.map((trunk) => [trunk.id, trunk]));
}

export function buildNumberTableRows(
  numbers: TelephonyNumberView[],
  bindingByPhoneNumber: Map<string, TenantPhoneBinding>,
  resolvedBindingsByNumber: Record<string, TenantPhoneBinding | null>,
  providerNameById: Map<string, string>,
  trunkById: Map<string, TelephonyTrunkView>,
  searchQuery: string,
): AdminTelephonyNumberRow[] {
  const query = searchQuery.trim().toLowerCase();
  const rows = numbers.map((number) => {
    const binding =
      resolvedBindingsByNumber[number.e164_number] !== undefined
        ? resolvedBindingsByNumber[number.e164_number]
        : bindingByPhoneNumber.get(number.e164_number) ??
          (number.binding_summary
            ? tenantBindingFromSummary(number.binding_summary, { phoneNumber: number.e164_number })
            : null);
    const trunk = number.trunk_id ? (trunkById.get(number.trunk_id) ?? null) : null;
    const sipTrunkId = trunk?.livekit_binding_id ?? null;
    const assignmentLabel = binding?.agent_name ?? "";
    const tenantLabel = binding?.tenant_name ?? "";
    const isLive = Boolean(binding?.active && binding.routing_ready && number.status === "assigned");
    const canToggle = Boolean(binding && sipTrunkId && number.status === "assigned" && trunk?.status === "active");
    return {
      id: number.id,
      phoneNumber: number.e164_number,
      providerLabel: providerNameById.get(number.provider_account_id) ?? "Unknown",
      tenantLabel,
      assignmentLabel,
      statusLabel: assignmentStatusLabel({
        binding,
        sipTrunkId,
        numberStatus: number.status,
      }),
      statusVariant: assignmentStatusVariant({
        binding,
        sipTrunkId,
        numberStatus: number.status,
      }),
      active: isLive,
      canToggleActive: canToggle,
    };
  });
  if (!query) {
    return rows;
  }
  return rows.filter((row) =>
    [row.phoneNumber, row.providerLabel, row.tenantLabel, row.assignmentLabel]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
}
