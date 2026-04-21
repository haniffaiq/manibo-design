"use client";

import { useMemo } from "react";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { Input } from "@grove/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@grove/ui/select";
import { ActionBuilderCard } from "@/components/action-builder-card";
import { StatusMessage } from "@/components/status-message";
import type {
  TelephonyProviderAccountView,
  TelephonyProviderOperation,
  TelephonyProviderOperationSupport,
  TelephonyProviderPackMetadata,
} from "@/lib/api/admin-telephony";

export interface AdminTelephonyProviderDraft {
  providerKind: string;
  displayName: string;
  credentialRef: string;
  credentialConfigured: boolean;
  credentialRefTouched: boolean;
  providerMetadata: string;
  providerMetadataTouched: boolean;
}

export interface AdminTelephonyProviderInventorySummary {
  trunkCount: number;
  boundTrunkCount: number;
  numberCount: number;
  liveNumberCount: number;
}

interface AdminTelephonyProviderFormProps {
  open: boolean;
  mode: "create" | "edit";
  draft: AdminTelephonyProviderDraft;
  providerOptions: TelephonyProviderPackMetadata[];
  createProviderOptions: TelephonyProviderPackMetadata[];
  selectedProvider: TelephonyProviderAccountView | null;
  inventorySummary: AdminTelephonyProviderInventorySummary | null;
  busy: boolean;
  error: string | null;
  notice: string | null;
  actionBusyKey: string | null;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  onDraftChange: (nextDraft: AdminTelephonyProviderDraft) => void;
  onTestConnection: () => Promise<void>;
  onRefreshRoutes: () => Promise<void>;
  onRefreshNumbers: () => Promise<void>;
}

type ProviderActionDescriptor = {
  key: "test" | "sync-trunks" | "sync-numbers";
  label: string;
  busyLabel: string;
  operation: TelephonyProviderOperation;
};

const PROVIDER_ACTIONS: ProviderActionDescriptor[] = [
  {
    key: "test",
    label: "Test connection",
    busyLabel: "Testing…",
    operation: "validate_account",
  },
  {
    key: "sync-trunks",
    label: "Refresh routes",
    busyLabel: "Refreshing routes…",
    operation: "sync_trunks",
  },
  {
    key: "sync-numbers",
    label: "Refresh numbers",
    busyLabel: "Refreshing numbers…",
    operation: "sync_numbers",
  },
];

function providerStatusVariant(status: TelephonyProviderAccountView["status"]): "neutral" | "success" | "warning" | "error" {
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

function providerStatusLabel(status: TelephonyProviderAccountView["status"]): string {
  if (status === "draft") return "Needs secret";
  if (status === "validating") return "Checking connection";
  if (status === "connected") return "Connected";
  if (status === "degraded") return "Needs attention";
  if (status === "disconnected") return "Disconnected";
  return "Archived";
}

function providerOperationUnavailableReason(support: TelephonyProviderOperationSupport | null): string | null {
  if (support == null) {
    return "This provider operation is not available in this deployment.";
  }
  if (support.mode === "unsupported") {
    return support.notes ?? "This provider does not support that action.";
  }
  if (!support.implemented) {
    return support.notes ?? "This provider action is not implemented in this deployment yet.";
  }
  return null;
}

function providerImportSeedKey(operation: TelephonyProviderOperation): "trunks" | "numbers" | null {
  if (operation === "sync_trunks") {
    return "trunks";
  }
  if (operation === "sync_numbers") {
    return "numbers";
  }
  return null;
}

function providerHasImportSeed(
  provider: TelephonyProviderAccountView | null,
  operation: TelephonyProviderOperation,
): boolean {
  const seedKey = providerImportSeedKey(operation);
  if (!provider || seedKey == null) {
    return true;
  }
  return Array.isArray(provider.provider_metadata[seedKey]);
}

export function AdminTelephonyProviderForm({
  open,
  mode,
  draft,
  providerOptions,
  createProviderOptions,
  selectedProvider,
  inventorySummary,
  busy,
  error,
  notice,
  actionBusyKey,
  onClose,
  onSubmit,
  onDraftChange,
  onTestConnection,
  onRefreshRoutes,
  onRefreshNumbers,
}: AdminTelephonyProviderFormProps) {
  const selectedProviderOption = useMemo(
    () =>
      (mode === "create" ? createProviderOptions : providerOptions).find((option) =>
        option.provider_kind === (mode === "edit" ? selectedProvider?.provider_kind : draft.providerKind),
      ) ?? null,
    [createProviderOptions, draft.providerKind, mode, providerOptions, selectedProvider?.provider_kind],
  );
  const showCreateMetadataField =
    mode === "create" &&
    selectedProviderOption != null &&
    !selectedProviderOption.capability_matrix.some(
      (capability) => capability.capability === "telephony.connect_provider_account" && capability.enabled,
    );

  const providerOperationSupport = useMemo(
    () => new Map((selectedProviderOption?.operations ?? []).map((operation) => [operation.operation, operation])),
    [selectedProviderOption],
  );

  function actionDisabledReason(operation: TelephonyProviderOperation): string | undefined {
    const support = providerOperationSupport.get(operation) ?? null;
    const operationReason = providerOperationUnavailableReason(support);
    if (operationReason) {
      return operationReason;
    }
    if (support?.mode === "import_only" && !providerHasImportSeed(selectedProvider, operation)) {
      return support.notes ?? "This import-only provider action needs server-seeded provider metadata first.";
    }
    if (selectedProvider && !selectedProvider.credential_configured && support?.mode === "managed") {
      return "Add a server-side secret reference before testing or syncing this provider.";
    }
    return undefined;
  }

  function actionIsDisabled(operation: TelephonyProviderOperation): boolean {
    return actionDisabledReason(operation) != null;
  }

  return (
    <ActionBuilderCard
      open={open}
      title={mode === "create" ? "Add provider" : "Provider details"}
      description=""
      closeLabel="Close telephony editor"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void onSubmit()} disabled={busy}>
            {mode === "create" ? "Add provider" : "Save provider"}
          </Button>
        </>
      }
      dataTestId="admin-telephony-provider-form"
    >
      {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}
      {notice ? <StatusMessage variant="success">{notice}</StatusMessage> : null}

      {mode === "edit" && selectedProvider ? (
        <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">Status</p>
            <div className="mt-2">
              <Badge variant={providerStatusVariant(selectedProvider.status)}>
                {providerStatusLabel(selectedProvider.status)}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">Ownership</p>
            <p className="mt-2 text-sm text-[var(--color-neutral-900)]">
              {selectedProvider.owner_scope === "deployment" ? "Deployment default" : "Tenant-owned"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">Inventory</p>
            <p className="mt-2 text-sm text-[var(--color-neutral-900)]">
              {inventorySummary
                ? `${inventorySummary.trunkCount} routes · ${inventorySummary.numberCount} numbers`
                : "No synced inventory yet"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">Last check</p>
            <p className="mt-2 text-sm text-[var(--color-neutral-900)]">
              {selectedProvider.control_plane?.last_test_message ?? "Connection has not been tested yet."}
            </p>
          </div>
        </div>
      ) : null}

      {mode === "edit" && selectedProvider ? (
        <div className="flex flex-wrap gap-2">
          {PROVIDER_ACTIONS.map((action) => {
            const disabledReason = actionDisabledReason(action.operation);
            const disabled = busy || actionBusyKey !== null || actionIsDisabled(action.operation);
            const onClick =
              action.key === "test"
                ? () => void onTestConnection()
                : action.key === "sync-trunks"
                  ? () => void onRefreshRoutes()
                  : () => void onRefreshNumbers();
            return (
              <Button
                key={action.key}
                variant="secondary"
                size="sm"
                onClick={onClick}
                disabled={disabled}
                disabledReason={disabledReason}
              >
                {actionBusyKey === action.key ? action.busyLabel : action.label}
              </Button>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-neutral-700)]">Provider</label>
          {mode === "create" ? (
              <Select
                value={draft.providerKind}
                onValueChange={(value) => onDraftChange({ ...draft, providerKind: value })}
                disabled={busy || createProviderOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  {createProviderOptions.map((option) => (
                    <SelectItem key={option.provider_kind} value={option.provider_kind}>
                      {option.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
            </Select>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-neutral-900)]">
              {selectedProviderOption?.display_name ?? selectedProvider?.provider_kind ?? "Unknown provider"}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-neutral-700)]">Display name</label>
          <Input
            value={draft.displayName}
            onChange={(event) => onDraftChange({ ...draft, displayName: event.target.value })}
            placeholder="Example: Primary Telnyx"
            disabled={busy}
          />
        </div>
      </div>

      {mode === "edit" ? (
        <div className="space-y-2">
          <label
            htmlFor="admin-telephony-provider-credential-ref"
            className="text-sm font-medium text-[var(--color-neutral-700)]"
          >
            Replace secret reference
          </label>
          <Input
            id="admin-telephony-provider-credential-ref"
            value={draft.credentialRef}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                credentialRef: event.target.value,
                credentialRefTouched: true,
              })
            }
            placeholder="env://TELNYX_API_KEY"
            disabled={busy}
          />
          <div className="flex items-start justify-between gap-3">
            {draft.credentialConfigured ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() =>
                  onDraftChange({
                    ...draft,
                    credentialRef: "",
                    credentialRefTouched: true,
                  })
                }
              >
                Clear saved secret
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {mode === "edit" || showCreateMetadataField ? (
        <div className="space-y-2">
          <label htmlFor="admin-telephony-provider-metadata" className="text-sm font-medium text-[var(--color-neutral-700)]">
            Provider metadata JSON
          </label>
          <textarea
            id="admin-telephony-provider-metadata"
            value={draft.providerMetadata}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                providerMetadata: event.target.value,
                providerMetadataTouched: true,
              })
            }
            placeholder='{"trunks":[...],"numbers":[...]}'
            disabled={busy}
            className="min-h-32 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm text-[var(--color-neutral-900)] shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          />
        </div>
      ) : null}
    </ActionBuilderCard>
  );
}
