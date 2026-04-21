"use client";

import { useEffect, useMemo, useState } from "react";

import { type AdminTelephonyProviderInventorySummary } from "@/components/admin-telephony-provider-form";
import { type AdminTelephonyProviderDraft } from "@/components/admin-telephony-provider-form";
import {
  createAdminTelephonyProviderAccount,
  deleteAdminTelephonyProviderAccount,
  syncAdminTelephonyNumbers,
  syncAdminTelephonyTrunks,
  testAdminTelephonyProviderAccount,
  updateAdminTelephonyProviderAccount,
  type TelephonyProviderAccountView,
  type TelephonyProviderKind,
  type TelephonyProviderPackMetadata,
} from "@/lib/api/admin-telephony";
import { useActionState } from "@/hooks/use-action-state";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";

import {
  formatProviderMetadataDraft,
  parseProviderMetadataDraft,
  providerKindLabel,
  providerOperationSupport,
  PROVIDER_EMPTY_DRAFT,
  type ProviderTableRow,
  providerOptionCanBeConnectedFromWorkspace,
  providerOptionCanSyncInventory,
  providerOptionRequiresConnectionTest,
} from "./view-models";

type InventoryMutator = () => Promise<unknown>;

type UseProviderControllerArgs = {
  providerAccounts: TelephonyProviderAccountView[];
  providerOptions: TelephonyProviderPackMetadata[];
  remainingCreateProviderOptions: TelephonyProviderPackMetadata[];
  providerInventoryByAccount: Map<string, AdminTelephonyProviderInventorySummary>;
  mutateProviderAccounts: InventoryMutator;
  mutateTrunks: InventoryMutator;
  mutateNumbers: InventoryMutator;
};

export function useProviderController({
  providerAccounts,
  providerOptions,
  remainingCreateProviderOptions,
  providerInventoryByAccount,
  mutateProviderAccounts,
  mutateTrunks,
  mutateNumbers,
}: UseProviderControllerArgs) {
  const [providerFormOpen, setProviderFormOpen] = useState(false);
  const [providerFormMode, setProviderFormMode] = useState<"create" | "edit">("create");
  const [providerDraft, setProviderDraft] = useState<AdminTelephonyProviderDraft>(PROVIDER_EMPTY_DRAFT);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [providerActionBusyKey, setProviderActionBusyKey] = useState<string | null>(null);
  const providerActions = useActionState();

  useEffect(() => {
    if (providerFormMode !== "create") {
      return;
    }
    if (remainingCreateProviderOptions.length === 0) {
      if (providerDraft.providerKind) {
        setProviderDraft((current) => ({ ...current, providerKind: "" }));
      }
      return;
    }
    if (remainingCreateProviderOptions.some((option) => option.provider_kind === providerDraft.providerKind)) {
      return;
    }
    setProviderDraft((current) => ({
      ...current,
      providerKind: remainingCreateProviderOptions[0]?.provider_kind ?? "",
    }));
  }, [providerDraft.providerKind, providerFormMode, remainingCreateProviderOptions]);

  const selectedProvider = useMemo(
    () => providerAccounts.find((account) => account.id === selectedProviderId) ?? null,
    [providerAccounts, selectedProviderId],
  );
  const selectedProviderInventory = useMemo(
    () => (selectedProvider ? (providerInventoryByAccount.get(selectedProvider.id) ?? null) : null),
    [providerInventoryByAccount, selectedProvider],
  );
  const providerOptionsByKind = useMemo(
    () => new Map(providerOptions.map((option) => [option.provider_kind, option])),
    [providerOptions],
  );

  useEffect(() => {
    if (!providerFormOpen || providerFormMode !== "edit" || !selectedProvider) {
      return;
    }
    setProviderDraft({
      providerKind: selectedProvider.provider_kind,
      displayName: selectedProvider.display_name,
      credentialRef: "",
      credentialConfigured: selectedProvider.credential_configured,
      credentialRefTouched: false,
      providerMetadata: formatProviderMetadataDraft(selectedProvider.provider_metadata),
      providerMetadataTouched: false,
    });
  }, [providerFormMode, providerFormOpen, selectedProvider]);

  async function refreshTelephonyInventory(): Promise<void> {
    await Promise.all([mutateProviderAccounts(), mutateTrunks(), mutateNumbers()]);
  }

  function openCreateProviderForm(): void {
    providerActions.clearError();
    providerActions.clearNotice();
    setProviderFormMode("create");
    setSelectedProviderId(null);
    setProviderDraft({
      providerKind: remainingCreateProviderOptions[0]?.provider_kind ?? "",
      displayName: "",
      credentialRef: "",
      credentialConfigured: false,
      credentialRefTouched: false,
      providerMetadata: "",
      providerMetadataTouched: false,
    });
    setProviderFormOpen(true);
  }

  function openProviderEditor(row: ProviderTableRow): void {
    providerActions.clearError();
    providerActions.clearNotice();
    setSelectedProviderId(row.id);
    setProviderFormMode("edit");
    setProviderFormOpen(true);
  }

  async function handleProviderSubmit(): Promise<void> {
    await providerActions.run(async () => {
      const displayName = providerDraft.displayName.trim();
      if (!displayName) {
        throw new Error("Provider display name is required.");
      }
      if (providerFormMode === "create") {
        if (!providerDraft.providerKind) {
          throw new Error("Choose a provider before adding it.");
        }
        const selectedProviderOption =
          remainingCreateProviderOptions.find((option) => option.provider_kind === providerDraft.providerKind) ?? null;
        if (!selectedProviderOption) {
          throw new Error("This workspace cannot add that provider right now.");
        }
        const providerMetadata = providerOptionCanBeConnectedFromWorkspace(selectedProviderOption)
          ? undefined
          : parseProviderMetadataDraft(providerDraft.providerMetadata);
        const created = await createAdminTelephonyProviderAccount({
          provider_kind: providerDraft.providerKind as TelephonyProviderKind,
          display_name: displayName,
          ...(providerMetadata == null ? {} : { provider_metadata: providerMetadata }),
        });
        await refreshTelephonyInventory();
        setProviderFormOpen(false);
        providerActions.showNotice(
          created.status === "connected"
            ? `${providerKindLabel(created.provider_kind)} connected.`
            : `${providerKindLabel(created.provider_kind)} added, but not connected.`,
          created.status === "connected" ? "success" : "warning",
        );
        return created;
      }

      if (!selectedProvider) {
        throw new Error("Choose a provider account before saving.");
      }
      const credentialRef = providerDraft.credentialRef.trim();
      const providerMetadata = parseProviderMetadataDraft(providerDraft.providerMetadata);
      const updated = await updateAdminTelephonyProviderAccount(selectedProvider.id, {
        display_name: displayName,
        ...(credentialRef !== ""
          ? { credential_ref: credentialRef }
          : providerDraft.credentialConfigured && providerDraft.credentialRefTouched
            ? { credential_ref: null }
            : {}),
        ...(providerMetadata != null
          ? { provider_metadata: providerMetadata }
          : providerDraft.providerMetadataTouched
            ? { provider_metadata: null }
            : {}),
      });
      await refreshTelephonyInventory();
      setProviderDraft({
        providerKind: updated.provider_kind,
        displayName: updated.display_name,
        credentialRef: "",
        credentialConfigured: updated.credential_configured,
        credentialRefTouched: false,
        providerMetadata: formatProviderMetadataDraft(updated.provider_metadata),
        providerMetadataTouched: false,
      });
      providerActions.showNotice(`Saved ${updated.display_name}.`, "success");
      return updated;
    });
  }

  async function handleProviderAction(
    actionKey: "test" | "sync-trunks" | "sync-numbers",
    action: () => Promise<void>,
  ): Promise<void> {
    setProviderActionBusyKey(actionKey);
    try {
      await action();
    } catch (error) {
      providerActions.setError(toErrorMessage(error));
    } finally {
      setProviderActionBusyKey(null);
    }
  }

  async function handleConnectProvider(providerAccountId: string): Promise<void> {
    const providerAccount = providerAccounts.find((account) => account.id === providerAccountId) ?? null;
    if (!providerAccount) {
      return;
    }
    const providerOption = providerOptionsByKind.get(providerAccount.provider_kind) ?? null;
    const providerLabel = providerKindLabel(providerAccount.provider_kind);
    await providerActions.run(async () => {
      if (!providerOptionCanSyncInventory(providerOption)) {
        providerActions.showNotice(`${providerLabel} cannot refresh inventory from this workspace.`, "warning");
        return null;
      }

      if (providerAccount.status !== "connected" && providerOptionRequiresConnectionTest(providerOption)) {
        const testResult = await testAdminTelephonyProviderAccount(providerAccountId);
        await mutateProviderAccounts();
        if (testResult.outcome !== "success" || testResult.provider_account.status !== "connected") {
          providerActions.showNotice(`${providerLabel} is not connected.`, "warning");
          return testResult;
        }
      }

      if (providerOperationSupport(providerOption, "sync_trunks")?.implemented) {
        await syncAdminTelephonyTrunks(providerAccountId);
      }
      if (providerOperationSupport(providerOption, "sync_numbers")?.implemented) {
        await syncAdminTelephonyNumbers(providerAccountId);
      }
      await refreshTelephonyInventory();
      return true;
    });
  }

  async function handleDeleteProvider(providerAccountId: string): Promise<void> {
    const providerAccount = providerAccounts.find((account) => account.id === providerAccountId) ?? null;
    if (!providerAccount) {
      return;
    }
    const providerLabel = providerKindLabel(providerAccount.provider_kind);
    await providerActions.run(async () => {
      await deleteAdminTelephonyProviderAccount(providerAccountId);
      await refreshTelephonyInventory();
      providerActions.showNotice(`${providerLabel} removed.`, "success");
      return true;
    });
  }

  async function handleTestProvider(): Promise<void> {
    if (!selectedProvider) {
      return;
    }
    await handleProviderAction("test", async () => {
      const result = await testAdminTelephonyProviderAccount(selectedProvider.id);
      await mutateProviderAccounts();
      providerActions.showNotice(result.message, result.outcome === "success" ? "success" : "warning");
    });
  }

  async function handleRefreshRoutes(): Promise<void> {
    if (!selectedProvider) {
      return;
    }
    await handleProviderAction("sync-trunks", async () => {
      const result = await syncAdminTelephonyTrunks(selectedProvider.id);
      await refreshTelephonyInventory();
      providerActions.showNotice(result.message, "success");
    });
  }

  async function handleRefreshNumbers(): Promise<void> {
    if (!selectedProvider) {
      return;
    }
    await handleProviderAction("sync-numbers", async () => {
      const result = await syncAdminTelephonyNumbers(selectedProvider.id);
      await refreshTelephonyInventory();
      providerActions.showNotice(result.message, "success");
    });
  }

  return {
    providerActions,
    providerActionBusyKey,
    providerDraft,
    providerFormMode,
    providerFormOpen,
    selectedProvider,
    selectedProviderInventory,
    setProviderDraft,
    setProviderFormOpen,
    openCreateProviderForm,
    openProviderEditor,
    handleConnectProvider,
    handleDeleteProvider,
    handleProviderSubmit,
    handleRefreshNumbers,
    handleRefreshRoutes,
    handleTestProvider,
  } as const;
}
