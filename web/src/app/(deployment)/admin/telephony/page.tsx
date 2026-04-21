"use client";

import { useEffect, useMemo, useRef } from "react";

import useSWR from "swr";

import { AdminPageShell } from "@/components/admin-page-shell";
import { listAdminTenantAgentDefinitions } from "@/lib/api/admin-agent-definitions";
import {
  getAdminTenantTelephonyPolicy,
  listAdminTelephonyNumbers,
  listAdminTelephonyProviderAccounts,
  listAdminTelephonyProviderOptions,
  listAdminTelephonyTrunks,
  syncAdminTelephonyNumbers,
  syncAdminTelephonyTrunks,
} from "@/lib/api/admin-telephony";
import {
  createAdminTenantPhoneChannel,
  deleteAdminTenantPhoneChannel,
  listAdminTenantPhoneChannels,
  updateAdminTenantPhoneChannel,
} from "@/lib/api/phone-numbers";
import { listAdminTenants } from "@/lib/api/tenants";
import { useActionState } from "@/hooks/use-action-state";
import * as swrKeys from "@/lib/swr-keys";

import { NumbersTab } from "./numbers-tab";
import {
  buildBindingByPhoneNumber,
  buildNumberTableRows,
  buildProviderInventoryByAccount,
  buildProviderNameById,
  buildProviderTableRows,
  buildTrunkById,
} from "./page-data";
import * as pageSupport from "./page-support";
import { ProvidersTab } from "./providers-tab";
import { useAdminTelephonyRouteState } from "./use-admin-telephony-route-state";
import { useNumberEditorState } from "./use-number-editor-state";
import { useProviderController } from "./use-provider-controller";
import {
  collapseLoadError,
  decorateTenantBinding,
  defaultAssignmentActive,
  numberEditorBlockedReason,
  type ProviderTableRow,
  requestedAssistantIdForTenant,
  type TenantPhoneBinding,
} from "./view-models";

export default function AdminTelephonyPage() {
  const numberActions = useActionState();
  const {
    data: providerOptions,
    error: providerOptionsError,
    isLoading: providerOptionsLoading,
  } = useSWR(swrKeys.adminTelephonyProviderOptions(), listAdminTelephonyProviderOptions, {
    revalidateOnFocus: false,
  });
  const {
    data: providerAccounts,
    error: providerAccountsError,
    isLoading: providerAccountsLoading,
    mutate: mutateProviderAccounts,
  } = useSWR(
    swrKeys.adminTelephonyProviderAccounts(false),
    ([, includeArchived]) => listAdminTelephonyProviderAccounts(includeArchived),
    { revalidateOnFocus: false },
  );
  const {
    data: trunks,
    error: trunksError,
    isLoading: trunksLoading,
    mutate: mutateTrunks,
  } = useSWR(
    swrKeys.adminTelephonyTrunks(null),
    ([, providerAccountId]) =>
      listAdminTelephonyTrunks({
        providerAccountId: providerAccountId ?? undefined,
      }),
    { revalidateOnFocus: false },
  );
  const {
    data: numbers,
    error: numbersError,
    isLoading: numbersLoading,
    mutate: mutateNumbers,
  } = useSWR(
    swrKeys.adminTelephonyNumbers(null),
    ([, providerAccountId]) =>
      listAdminTelephonyNumbers({
        providerAccountId: providerAccountId ?? undefined,
      }),
    { revalidateOnFocus: false },
  );
  const {
    data: tenants,
    error: tenantsError,
  } = useSWR(
    swrKeys.adminPhoneChannelsTenants(),
    () => listAdminTenants(500, 0, { include_non_production: true }),
    { revalidateOnFocus: false },
  );
  const deploymentTenants = tenants ?? pageSupport.EMPTY_TENANTS;
  const activeTenants = useMemo(
    () => deploymentTenants.filter((tenant) => tenant.status === "active"),
    [deploymentTenants],
  );
  const {
    activeTab,
    requestedAssistantId,
    requestedTenantId,
    selectedTenantId,
    setSelectedTenantId,
  } = useAdminTelephonyRouteState({ activeTenants });
  const providersSectionRef = useRef<HTMLDivElement | null>(null);
  const numbersSectionRef = useRef<HTMLDivElement | null>(null);
  const {
    data: selectedTenantBindings,
    error: bindingsError,
    isLoading: bindingsLoading,
    mutate: mutateBindings,
  } = useSWR(
    selectedTenantId ? swrKeys.adminPhoneChannels(selectedTenantId) : null,
    ([, tenantId]) => listAdminTenantPhoneChannels(tenantId),
    { revalidateOnFocus: false },
  );
  const {
    data: selectedTenantPolicy,
    error: selectedTenantPolicyError,
  } = useSWR(
    selectedTenantId ? swrKeys.adminTenantTelephonyPolicy(selectedTenantId) : null,
    ([, tenantId]) => getAdminTenantTelephonyPolicy(tenantId),
    { revalidateOnFocus: false },
  );
  const {
    data: assistants,
    error: assistantsError,
    isLoading: assistantsLoading,
  } = useSWR(
    selectedTenantId ? swrKeys.adminAgentDefinitionsForPhoneChannels(selectedTenantId) : null,
    ([, tenantId]) => listAdminTenantAgentDefinitions(tenantId),
    { revalidateOnFocus: false },
  );
  const publishedAssistants = useMemo(
    () =>
      (assistants ?? pageSupport.EMPTY_ASSISTANTS).filter(
        (assistant) => assistant.status === "published" && assistant.published_version != null,
      ),
    [assistants],
  );
  const [providerAccountsData, providerOptionsData, trunksData, numbersData] = [
    providerAccounts ?? pageSupport.EMPTY_PROVIDER_ACCOUNTS,
    providerOptions ?? pageSupport.EMPTY_PROVIDER_OPTIONS,
    trunks ?? pageSupport.EMPTY_TRUNKS,
    numbers ?? pageSupport.EMPTY_NUMBERS,
  ];
  const remainingCreateProviderOptions = useMemo(
    () =>
      providerOptionsData.filter(
        (option) => !providerAccountsData.some((account) => account.provider_kind === option.provider_kind),
      ),
    [providerAccountsData, providerOptionsData],
  );
  const selectedTenant = useMemo(
    () => deploymentTenants.find((tenant) => tenant.id === selectedTenantId) ?? null,
    [deploymentTenants, selectedTenantId],
  );
  const bindingsData = useMemo(() => {
    if (!selectedTenant) {
      return pageSupport.EMPTY_BINDINGS as TenantPhoneBinding[];
    }
    return (selectedTenantBindings?.phone_channels ?? []).map((binding) =>
      decorateTenantBinding(binding, {
        tenantName: selectedTenant.name,
        tenantSlug: selectedTenant.slug,
      }),
    );
  }, [selectedTenant, selectedTenantBindings]);
  const providerInventoryByAccount = useMemo(
    () => buildProviderInventoryByAccount(providerAccountsData, trunksData, numbersData),
    [numbersData, providerAccountsData, trunksData],
  );
  const providerOptionsByKind = useMemo(
    () => new Map(providerOptionsData.map((option) => [option.provider_kind, option])),
    [providerOptionsData],
  );
  const providerTableRows = useMemo<ProviderTableRow[]>(
    () => buildProviderTableRows(providerAccountsData, providerInventoryByAccount, providerOptionsByKind, ""),
    [providerAccountsData, providerInventoryByAccount, providerOptionsByKind],
  );
  const {
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
  } = useProviderController({
    providerAccounts: providerAccountsData,
    providerOptions: providerOptionsData,
    remainingCreateProviderOptions,
    providerInventoryByAccount,
    mutateProviderAccounts,
    mutateTrunks,
    mutateNumbers,
  });
  const bindingByPhoneNumber = useMemo(() => buildBindingByPhoneNumber(bindingsData), [bindingsData]);
  const providerNameById = useMemo(() => buildProviderNameById(providerAccountsData), [providerAccountsData]);
  const trunkById = useMemo(() => buildTrunkById(trunksData), [trunksData]);
  const rawNumberTableRows = useMemo(
    () => buildNumberTableRows(numbersData, bindingByPhoneNumber, {}, providerNameById, trunkById, ""),
    [bindingByPhoneNumber, numbersData, providerNameById, trunkById],
  );
  const {
    numberDraft,
    numberEditorOpen,
    resolvedBindingsByNumber,
    selectedNumber,
    selectedNumberBinding,
    selectedNumberBindingLookupPending,
    rememberBinding,
    setNumberDraft,
    setNumberEditorOpen,
    handleNumberDraftChange,
    selectNumberRow,
  } = useNumberEditorState({
    numberTableRows: rawNumberTableRows,
    numbers: numbersData,
    bindingByPhoneNumber,
    selectedTenantId,
    setSelectedTenantId,
    publishedAssistants,
    requestedAssistantId,
    numberActions,
  });
  const numberTableRows = useMemo(
    () =>
      buildNumberTableRows(
        numbersData,
        bindingByPhoneNumber,
        resolvedBindingsByNumber,
        providerNameById,
        trunkById,
        "",
      ),
    [bindingByPhoneNumber, numbersData, providerNameById, resolvedBindingsByNumber, trunkById],
  );
  const selectedDraftTenant = useMemo(
    () => deploymentTenants.find((tenant) => tenant.id === numberDraft.tenantId) ?? null,
    [deploymentTenants, numberDraft.tenantId],
  );

  useEffect(() => {
    if (!requestedTenantId && !requestedAssistantId && activeTab === "providers") {
      return;
    }
    const target = activeTab === "numbers" ? numbersSectionRef.current : providersSectionRef.current;
    if (!target) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, requestedAssistantId, requestedTenantId]);

  const liveRoutingToggleDisabled = selectedNumberBinding == null && selectedNumber?.status !== "assigned";
  const providerLoadError = collapseLoadError(providerOptionsError, providerAccountsError, trunksError, numbersError);
  const numbersLoadError = collapseLoadError(
    tenantsError,
    bindingsError,
    selectedTenantPolicyError,
    assistantsError,
  );
  const numberEditorBlockedReasonValue = useMemo(
    () =>
      numberEditorBlockedReason({
        hasSelectedNumber: selectedNumber != null,
        bindingLookupPending: selectedNumberBindingLookupPending,
        allowsDeploymentDefault: selectedTenantPolicy?.allows_deployment_default ?? null,
        draftTenantId: numberDraft.tenantId,
        draftTenantStatus: selectedDraftTenant?.status ?? null,
        publishedAssistantCount: publishedAssistants.length,
      }),
    [
      numberDraft.tenantId,
      publishedAssistants.length,
      selectedDraftTenant?.status,
      selectedNumberBindingLookupPending,
      selectedTenantPolicy?.allows_deployment_default,
    ],
  );

  async function resolveNumberRoutingTarget(numberId: string): Promise<string | null> {
    const currentNumber = numbersData.find((number) => number.id === numberId) ?? null;
    if (!currentNumber) {
      return null;
    }
    const currentTrunk = currentNumber.trunk_id ? (trunkById.get(currentNumber.trunk_id) ?? null) : null;
    if (currentTrunk?.status === "active" && currentTrunk.livekit_binding_id) {
      return currentTrunk.livekit_binding_id;
    }

    const syncedTrunks = await syncAdminTelephonyTrunks(currentNumber.provider_account_id);
    const syncedNumbers = await syncAdminTelephonyNumbers(currentNumber.provider_account_id);
    await Promise.all([mutateProviderAccounts(), mutateTrunks(), mutateNumbers()]);

    const syncedTrunkById = new Map(syncedTrunks.trunks.map((trunk) => [trunk.id, trunk]));
    const syncedNumber =
      syncedNumbers.numbers.find((number) => number.id === numberId) ??
      syncedNumbers.numbers.find((number) => number.e164_number === currentNumber.e164_number) ??
      null;
    if (!syncedNumber?.trunk_id) {
      return null;
    }
    const syncedTrunk = syncedTrunkById.get(syncedNumber.trunk_id) ?? null;
    if (!syncedTrunk || syncedTrunk.status !== "active" || !syncedTrunk.livekit_binding_id) {
      return null;
    }
    return syncedTrunk.livekit_binding_id;
  }

  async function resolveNumberSaveSipTrunkId({
    requestedActive,
  }: {
    requestedActive: boolean;
  }): Promise<string | null> {
    if (selectedNumberBinding && !requestedActive) {
      return selectedNumberBinding.sip_trunk_id;
    }
    if (!selectedNumber) {
      return null;
    }
    return resolveNumberRoutingTarget(selectedNumber.id);
  }

  async function handleNumberSave(): Promise<void> {
    await numberActions.run(async () => {
      if (!selectedNumber) {
        throw new Error("Select a number before assigning it.");
      }
      if (numberEditorBlockedReasonValue) {
        throw new Error(numberEditorBlockedReasonValue);
      }
      const requestedActive = selectedNumberBinding
        ? numberDraft.active
        : selectedNumber.status === "assigned" && numberDraft.active;
      const sipTrunkId = await resolveNumberSaveSipTrunkId({ requestedActive });
      if (!sipTrunkId) {
        throw new Error("This number is not ready for assignment yet. Sync provider inventory and try again.");
      }
      if (selectedNumberBinding) {
        const updated = await updateAdminTenantPhoneChannel(selectedNumberBinding.tenant_id, selectedNumberBinding.id, {
          phone_number: selectedNumber.e164_number,
          sip_trunk_id: sipTrunkId,
          agent_definition_id: numberDraft.agentDefinitionId,
          active: requestedActive,
        });
        await Promise.all([mutateBindings(), mutateNumbers()]);
        rememberBinding(
          selectedNumber.e164_number,
          decorateTenantBinding(updated, {
            tenantName: selectedNumberBinding.tenant_name,
            tenantSlug: selectedNumberBinding.tenant_slug,
          }),
        );
        setNumberEditorOpen(false);
        return true;
      }
      const created = await createAdminTenantPhoneChannel(numberDraft.tenantId, {
        phone_number: selectedNumber.e164_number,
        sip_trunk_id: sipTrunkId,
        agent_definition_id: numberDraft.agentDefinitionId,
        active: requestedActive,
      });
      const targetTenant = deploymentTenants.find((tenant) => tenant.id === numberDraft.tenantId) ?? selectedTenant;
      await Promise.all([mutateBindings(), mutateNumbers()]);
      rememberBinding(
        selectedNumber.e164_number,
        decorateTenantBinding(created, {
          tenantName: targetTenant?.name ?? numberDraft.tenantId,
          tenantSlug: targetTenant?.slug ?? numberDraft.tenantId,
        }),
      );
      if (selectedTenantId !== numberDraft.tenantId) {
        setSelectedTenantId(numberDraft.tenantId);
      }
      setNumberEditorOpen(false);
      return true;
    });
  }

  async function handleNumberRelease(): Promise<void> {
    if (!selectedNumberBinding) {
      return;
    }
    await numberActions.run(async () => {
      await deleteAdminTenantPhoneChannel(selectedNumberBinding.tenant_id, selectedNumberBinding.id);
      await Promise.all([mutateBindings(), mutateNumbers()]);
      if (selectedNumber) {
        rememberBinding(selectedNumber.e164_number, null);
      }
      setNumberDraft({
        tenantId: selectedTenantId,
        agentDefinitionId: requestedAssistantIdForTenant(publishedAssistants, requestedAssistantId),
        active: selectedNumber ? defaultAssignmentActive(selectedNumber.status) : false,
      });
      setNumberEditorOpen(false);
      return true;
    });
  }

  return (
    <AdminPageShell
      title="Telephony"
      error={providerLoadError ?? numbersLoadError}
      notice={providerActions.notice}
    >
      <div id="providers" ref={providersSectionRef} data-testid="admin-telephony-providers-section">
        <ProvidersTab
          canCreateProvider={!providerOptionsLoading && remainingCreateProviderOptions.length > 0}
          providerBusy={providerActions.busy}
          providerAccountsLoading={providerAccountsLoading}
          trunksLoading={trunksLoading}
          numbersLoading={numbersLoading}
          providerTableRows={providerTableRows}
          onOpenCreateProviderForm={openCreateProviderForm}
          onOpenProviderEditor={openProviderEditor}
          onConnectProvider={handleConnectProvider}
          onDeleteProvider={handleDeleteProvider}
          providerFormOpen={providerFormOpen}
          providerFormMode={providerFormMode}
          providerDraft={providerDraft}
          providerOptions={providerOptionsData}
          createProviderOptions={remainingCreateProviderOptions}
          selectedProvider={selectedProvider}
          inventorySummary={selectedProviderInventory}
          providerError={providerActions.error}
          providerNotice={providerActions.notice?.message ?? null}
          actionBusyKey={providerActionBusyKey}
          onCloseProviderForm={() => setProviderFormOpen(false)}
          onSubmitProvider={handleProviderSubmit}
          onDraftChange={setProviderDraft}
          onTestConnection={handleTestProvider}
          onRefreshRoutes={handleRefreshRoutes}
          onRefreshNumbers={handleRefreshNumbers}
        />
      </div>
      <div id="numbers" ref={numbersSectionRef} data-testid="admin-telephony-numbers-section">
        <NumbersTab
          numbersLoadError={numbersLoadError}
          activeTenants={activeTenants}
          numberTableRows={numberTableRows}
          numbersLoading={numbersLoading}
          bindingsLoading={bindingsLoading}
          onSelectRow={selectNumberRow}
          numberEditorOpen={numberEditorOpen}
          onCloseNumberEditor={() => setNumberEditorOpen(false)}
          selectedNumberBinding={selectedNumberBinding}
          numberError={numberActions.error}
          numberBusy={numberActions.busy}
          onReleaseNumber={handleNumberRelease}
          onSaveNumber={handleNumberSave}
          numberDraft={numberDraft}
          onNumberDraftChange={handleNumberDraftChange}
          assistantsLoading={assistantsLoading}
          publishedAssistants={publishedAssistants}
          selectedNumberLabel={selectedNumber?.e164_number ?? ""}
          liveRoutingToggleDisabled={liveRoutingToggleDisabled}
        />
      </div>
    </AdminPageShell>
  );
}
