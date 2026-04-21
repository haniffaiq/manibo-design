"use client";

import { useMemo, useState } from "react";
import { type TelephonyNumberView } from "@/lib/api/admin-telephony";

import { tenantBindingFromSummary, type TenantPhoneBinding } from "./view-models";

interface UseSelectedNumberBindingArgs {
  bindingByPhoneNumber: Map<string, TenantPhoneBinding>;
  selectedNumber: TelephonyNumberView | null;
}

export function useSelectedNumberBinding({
  bindingByPhoneNumber,
  selectedNumber,
}: UseSelectedNumberBindingArgs) {
  const [resolvedBindingsByNumber, setResolvedBindingsByNumber] = useState<Record<string, TenantPhoneBinding | null>>(
    {},
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

  function rememberBinding(phoneNumber: string, binding: TenantPhoneBinding | null): void {
    setResolvedBindingsByNumber((current) => ({ ...current, [phoneNumber]: binding }));
  }

  return {
    selectedNumberBinding,
    selectedNumberBindingLookupPending,
    rememberBinding,
  } as const;
}
