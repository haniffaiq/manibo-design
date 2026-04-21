"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";

import { Button } from "@grove/ui/button";
import { DataTable, type DataTableColumn } from "@grove/ui/data-table";

import {
  AdminTelephonyNumberPicker,
  type AdminTelephonyAttachableNumberOption,
} from "@/components/admin-telephony-number-picker";
import { StatusMessage } from "@/components/status-message";
import {
  getAdminTenantTelephonyPolicy,
  listAdminTelephonyNumbers,
  listAdminTelephonyProviderAccounts,
  listAdminTelephonyTrunks,
  type TelephonyNumberView,
} from "@/lib/api/admin-telephony";
import {
  createAdminTenantPhoneChannel,
  listAdminTenantPhoneChannels,
  type AdminPhoneChannelRecord,
} from "@/lib/api/phone-numbers";
import { useActionState } from "@/hooks/use-action-state";
import * as swrKeys from "@/lib/swr-keys";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";

interface ChannelsPanelProps {
  tenantId: string;
  definitionId: string;
  assistantName: string | undefined;
  assistantStatus: string | undefined;
}

type AttachableNumber = AdminTelephonyAttachableNumberOption & {
  defaultActive: boolean;
  livekitBindingId: string;
};

type AttachedChannelRow = {
  id: string;
  channelType: string;
  channel: string;
};

const EMPTY_NUMBERS: TelephonyNumberView[] = [];
const EMPTY_TENANT_PHONE_NUMBERS: AdminPhoneChannelRecord[] = [];
const EMPTY_ATTACHABLE_NUMBERS: AttachableNumber[] = [];
const EMPTY_PROVIDER_LABELS = new Map<string, string>();

export function ChannelsPanel({
  tenantId,
  definitionId,
  assistantName,
  assistantStatus,
}: ChannelsPanelProps) {
  const isPublished = assistantStatus === "published";
  const telephonyHref =
    `/admin/telephony?tab=numbers&tenant_id=${encodeURIComponent(tenantId)}&assistant_id=${encodeURIComponent(definitionId)}#numbers`;
  const [pickerOpen, setPickerOpen] = useState(false);
  const attachActions = useActionState();

  const {
    data: telephonyNumbers,
    error: numbersError,
    isLoading: numbersLoading,
    mutate: mutateTelephonyNumbers,
  } = useSWR(
    swrKeys.adminTelephonyNumbers(null),
    ([, providerAccountId]) =>
      listAdminTelephonyNumbers({
        providerAccountId: providerAccountId ?? undefined,
      }),
    { revalidateOnFocus: false },
  );
  const {
    data: telephonyTrunks,
    error: trunksError,
    isLoading: trunksLoading,
  } = useSWR(
    swrKeys.adminTelephonyTrunks(null),
    ([, providerAccountId]) =>
      listAdminTelephonyTrunks({
        providerAccountId: providerAccountId ?? undefined,
      }),
    { revalidateOnFocus: false },
  );
  const {
    data: providerAccounts,
    error: providerAccountsError,
    isLoading: providerAccountsLoading,
  } = useSWR(
    swrKeys.adminTelephonyProviderAccounts(false),
    ([, includeArchived]) => listAdminTelephonyProviderAccounts(includeArchived),
    { revalidateOnFocus: false },
  );
  const {
    data: tenantPolicy,
    error: tenantPolicyError,
    isLoading: tenantPolicyLoading,
  } = useSWR(
    tenantId ? swrKeys.adminTenantTelephonyPolicy(tenantId) : null,
    ([, currentTenantId]) => getAdminTenantTelephonyPolicy(currentTenantId),
    { revalidateOnFocus: false },
  );
  const {
    data: tenantPhoneNumbers,
    error: tenantPhoneNumbersError,
    isLoading: tenantPhoneNumbersLoading,
    mutate: mutateTenantPhoneNumbers,
  } = useSWR(
    tenantId ? swrKeys.adminPhoneChannels(tenantId) : null,
    ([, currentTenantId]) => listAdminTenantPhoneChannels(currentTenantId),
    { revalidateOnFocus: false },
  );

  const numbersData = telephonyNumbers ?? EMPTY_NUMBERS;
  const tenantPhoneNumbersData = tenantPhoneNumbers?.phone_channels ?? EMPTY_TENANT_PHONE_NUMBERS;
  const providerLabelById = useMemo(
    () =>
      providerAccounts?.reduce((labels, account) => {
        labels.set(account.id, account.display_name);
        return labels;
      }, new Map<string, string>()) ?? EMPTY_PROVIDER_LABELS,
    [providerAccounts],
  );
  const trunkById = useMemo(
    () => new Map((telephonyTrunks ?? []).map((trunk) => [trunk.id, trunk])),
    [telephonyTrunks],
  );
  const attachedPhoneNumbersByTenantRouting = useMemo(
    () => new Set(tenantPhoneNumbersData.map((number) => number.phone_number)),
    [tenantPhoneNumbersData],
  );

  const attachedChannelRows = useMemo<AttachedChannelRow[]>(() => {
    const rows: AttachedChannelRow[] = [];
    const seenPhoneNumbers = new Set<string>();

    for (const number of numbersData) {
      if (
        number.binding_summary?.tenant_id !== tenantId
        || number.binding_summary?.agent_definition_id !== definitionId
      ) {
        continue;
      }
      seenPhoneNumbers.add(number.e164_number);
      rows.push({
        id: number.id,
        channelType: "Phone",
        channel: number.e164_number,
      });
    }

    for (const binding of tenantPhoneNumbersData) {
      if (binding.agent_definition_id !== definitionId || seenPhoneNumbers.has(binding.phone_number)) {
        continue;
      }
      rows.push({
        id: binding.id,
        channelType: "Phone",
        channel: binding.phone_number,
      });
    }

    return rows;
  }, [definitionId, numbersData, tenantId, tenantPhoneNumbersData]);

  const attachableNumbers = useMemo<AttachableNumber[]>(
    () =>
      numbersData.flatMap((number) => {
        if (
          number.binding_summary != null
          || attachedPhoneNumbersByTenantRouting.has(number.e164_number)
          || number.status === "released"
          || !number.trunk_id
        ) {
          return EMPTY_ATTACHABLE_NUMBERS;
        }
        const trunk = trunkById.get(number.trunk_id);
        if (!trunk?.livekit_binding_id || trunk.status !== "active") {
          return EMPTY_ATTACHABLE_NUMBERS;
        }
        return [{
          id: number.id,
          phoneNumber: number.e164_number,
          providerLabel: providerLabelById.get(number.provider_account_id) ?? "Deployment-managed provider",
          readinessLabel: number.status === "assigned" ? "Ready" : "Paused until sync",
          readinessVariant: number.status === "assigned" ? "success" : "warning",
          livekitBindingId: trunk.livekit_binding_id,
          defaultActive: number.status === "assigned",
        }];
      }),
    [attachedPhoneNumbersByTenantRouting, numbersData, providerLabelById, trunkById],
  );

  const pickerBlockedReason = useMemo(() => {
    if (!isPublished) {
      return "Publish this assistant before attaching a live number.";
    }
    if (tenantPolicyLoading) {
      return null;
    }
    if (tenantPolicy?.allows_deployment_default === false) {
      return "This tenant is BYO-only. Deployment-managed numbers stay blocked here because tenant-managed telephony is not self-serve in this workspace yet.";
    }
    return null;
  }, [isPublished, tenantPolicy?.allows_deployment_default, tenantPolicyLoading]);

  const fetchError =
    numbersError
    ?? trunksError
    ?? providerAccountsError
    ?? tenantPolicyError
    ?? tenantPhoneNumbersError;
  const channelsLoading =
    numbersLoading || trunksLoading || providerAccountsLoading || tenantPolicyLoading || tenantPhoneNumbersLoading;

  async function handleAttachNumber(numberId: string): Promise<void> {
    const selectedNumber = attachableNumbers.find((number) => number.id === numberId) ?? null;
    if (!selectedNumber) {
      attachActions.setError("Choose a synced deployment number before attaching it.");
      return;
    }
    if (pickerBlockedReason) {
      attachActions.setError(pickerBlockedReason);
      return;
    }
    await attachActions.run(async () => {
      await createAdminTenantPhoneChannel(tenantId, {
        phone_number: selectedNumber.phoneNumber,
        sip_trunk_id: selectedNumber.livekitBindingId,
        agent_definition_id: definitionId,
        active: selectedNumber.defaultActive,
      });
      await Promise.all([mutateTelephonyNumbers(), mutateTenantPhoneNumbers()]);
      attachActions.showNotice(
        selectedNumber.defaultActive
          ? `Attached ${selectedNumber.phoneNumber}.`
          : `Attached ${selectedNumber.phoneNumber}. It stays paused until provider sync marks it assigned.`,
        selectedNumber.defaultActive ? "success" : "warning",
      );
      setPickerOpen(false);
      return true;
    });
  }

  const channelColumns: DataTableColumn<AttachedChannelRow>[] = [
    {
      id: "channelType",
      header: "Type",
      cell: (row) => <span className="text-[var(--color-neutral-600)]">{row.channelType}</span>,
    },
    {
      id: "channel",
      header: "Output",
      cell: (row) => <span className="font-medium text-[var(--color-neutral-900)]">{row.channel}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Attached channels</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              attachActions.clearError();
              attachActions.clearNotice();
              setPickerOpen(true);
            }}
            disabled={!isPublished}
          >
            Attach existing number
          </Button>
          <Link
            href={telephonyHref}
            className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-medium text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]"
          >
            Open Telephony
          </Link>
        </div>
      </div>

      {!isPublished ? (
        <StatusMessage variant="warning">
          Publish this assistant before attaching a live number.
        </StatusMessage>
      ) : null}

      {tenantPolicy?.allows_deployment_default === false ? (
        <StatusMessage variant="warning">
          This tenant is BYO-only. Deployment-managed numbers stay blocked here because tenant-managed telephony is not self-serve in this workspace yet.
        </StatusMessage>
      ) : null}

      {fetchError ? (
        <StatusMessage variant="error">Failed to load channels.</StatusMessage>
      ) : null}

      {!pickerOpen && attachActions.notice ? (
        <StatusMessage variant={attachActions.notice.variant}>{attachActions.notice.message}</StatusMessage>
      ) : null}

      <DataTable
        columns={channelColumns}
        rows={attachedChannelRows}
        rowKey="id"
        emptyState="No channels attached."
        layout="auto"
        loading={channelsLoading}
      />

      <AdminTelephonyNumberPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        assistantName={assistantName?.trim() || "this assistant"}
        loading={channelsLoading}
        loadError={fetchError ? toErrorMessage(fetchError) : null}
        blockedReason={pickerBlockedReason}
        busy={attachActions.busy}
        error={attachActions.error}
        notice={attachActions.notice}
        numbers={attachableNumbers}
        onAttach={handleAttachNumber}
      />
    </div>
  );
}
