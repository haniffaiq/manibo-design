"use client";

import { useEffect, useMemo, useState } from "react";

import { type AdminTelephonyNumberRow } from "@/components/admin-telephony-number-table";
import { type AdminAgentDefinitionSummary } from "@/lib/api/admin-agent-definitions";
import { type TelephonyNumberView } from "@/lib/api/admin-telephony";

import {
  defaultAssignmentActive,
  NUMBER_EMPTY_DRAFT,
  type NumberEditorDraft,
  requestedAssistantIdForTenant,
  tenantBindingFromSummary,
  type TenantPhoneBinding,
} from "./view-models";

type NumberActionControls = {
  clearError: () => void;
  clearNotice: () => void;
};

type UseNumberEditorStateArgs = {
  numberTableRows: AdminTelephonyNumberRow[];
  numbers: TelephonyNumberView[];
  bindingByPhoneNumber: Map<string, TenantPhoneBinding>;
  selectedTenantId: string;
  setSelectedTenantId: (tenantId: string) => void;
  publishedAssistants: AdminAgentDefinitionSummary[];
  requestedAssistantId: string;
  numberActions: NumberActionControls;
};

export function useNumberEditorState({
  numberTableRows,
  numbers,
  bindingByPhoneNumber,
  selectedTenantId,
  setSelectedTenantId,
  publishedAssistants,
  requestedAssistantId,
  numberActions,
}: UseNumberEditorStateArgs) {
  const [selectedNumberId, setSelectedNumberId] = useState<string | null>(null);
  const [numberEditorOpen, setNumberEditorOpen] = useState(false);
  const [pendingTenantSyncFromSelectedRow, setPendingTenantSyncFromSelectedRow] = useState(false);
  const [numberDraft, setNumberDraft] = useState<NumberEditorDraft>(NUMBER_EMPTY_DRAFT);
  const [resolvedBindingsByNumber, setResolvedBindingsByNumber] = useState<Record<string, TenantPhoneBinding | null>>(
    {},
  );

  useEffect(() => {
    if (numberTableRows.length === 0) {
      setSelectedNumberId(null);
      setNumberEditorOpen(false);
      setPendingTenantSyncFromSelectedRow(false);
      return;
    }
    if (selectedNumberId && numberTableRows.some((row) => row.id === selectedNumberId)) {
      return;
    }
    setPendingTenantSyncFromSelectedRow(false);
    setSelectedNumberId(numberTableRows[0]?.id ?? null);
  }, [numberTableRows, selectedNumberId]);

  const selectedNumber = useMemo(
    () => numbers.find((number) => number.id === selectedNumberId) ?? null,
    [numbers, selectedNumberId],
  );
  const selectedNumberPhoneNumber = selectedNumber?.e164_number ?? null;
  const selectedNumberBinding = useMemo(() => {
    if (!selectedNumberPhoneNumber) {
      return null;
    }
    const tenantBinding = bindingByPhoneNumber.get(selectedNumberPhoneNumber);
    if (tenantBinding) {
      return tenantBinding;
    }
    const rememberedBinding = resolvedBindingsByNumber[selectedNumberPhoneNumber];
    if (rememberedBinding !== undefined) {
      return rememberedBinding;
    }
    if (selectedNumber?.binding_summary) {
      return tenantBindingFromSummary(selectedNumber.binding_summary, {
        phoneNumber: selectedNumberPhoneNumber,
      });
    }
    return null;
  }, [bindingByPhoneNumber, resolvedBindingsByNumber, selectedNumber, selectedNumberPhoneNumber]);
  const selectedNumberBindingLookupPending = false;

  useEffect(() => {
    if (!pendingTenantSyncFromSelectedRow || selectedNumberBindingLookupPending) {
      return;
    }
    if (selectedNumberBinding && selectedTenantId !== selectedNumberBinding.tenant_id) {
      setSelectedTenantId(selectedNumberBinding.tenant_id);
    }
    setPendingTenantSyncFromSelectedRow(false);
  }, [
    pendingTenantSyncFromSelectedRow,
    selectedNumberBinding,
    selectedNumberBindingLookupPending,
    selectedTenantId,
    setSelectedTenantId,
  ]);

  useEffect(() => {
    if (!selectedNumber) {
      setNumberDraft(NUMBER_EMPTY_DRAFT);
      return;
    }
    if (selectedNumberBinding) {
      setNumberDraft({
        tenantId: selectedNumberBinding.tenant_id,
        agentDefinitionId:
          selectedNumberBinding.agent_definition_id ??
          requestedAssistantIdForTenant(publishedAssistants, requestedAssistantId),
        active: selectedNumberBinding.active,
      });
      return;
    }
    setNumberDraft({
      tenantId: selectedTenantId,
      agentDefinitionId: requestedAssistantIdForTenant(publishedAssistants, requestedAssistantId),
      active: defaultAssignmentActive(selectedNumber.status),
    });
  }, [
    publishedAssistants,
    requestedAssistantId,
    selectedNumber,
    selectedNumberBinding,
    selectedTenantId,
  ]);

  function handleNumberDraftChange(nextDraft: NumberEditorDraft): void {
    setNumberDraft(nextDraft);
    if (!selectedNumberBinding && nextDraft.tenantId && nextDraft.tenantId !== selectedTenantId) {
      setSelectedTenantId(nextDraft.tenantId);
    }
  }

  function selectNumberRow(row: AdminTelephonyNumberRow): void {
    setPendingTenantSyncFromSelectedRow(true);
    setSelectedNumberId(row.id);
    setNumberEditorOpen(true);
    numberActions.clearError();
    numberActions.clearNotice();
  }

  function rememberBinding(phoneNumber: string, binding: TenantPhoneBinding | null): void {
    setResolvedBindingsByNumber((current) => ({ ...current, [phoneNumber]: binding }));
  }

  return {
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
  } as const;
}
