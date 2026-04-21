"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { type AdminTenantSummary } from "@/lib/api/tenants";

import { resolveInitialAdminTelephonyTab } from "./view-models";

export function useAdminTelephonyRouteState({
  activeTenants,
}: {
  activeTenants: AdminTenantSummary[];
}): {
  activeTab: "providers" | "numbers";
  requestedAssistantId: string;
  requestedTenantId: string;
  selectedTenantId: string;
  setActiveTab: (value: "providers" | "numbers") => void;
  setSelectedTenantId: (value: string) => void;
} {
  const searchParams = useSearchParams();
  const requestedTenantId = searchParams.get("tenant_id") ?? "";
  const requestedAssistantId = searchParams.get("assistant_id") ?? "";
  const requestedTabParam = searchParams.get("tab");
  const resolvedActiveTab = resolveInitialAdminTelephonyTab({
    requestedTabParam,
    requestedTenantId,
    requestedAssistantId,
  });
  const [activeTab, setActiveTab] = useState<"providers" | "numbers">(resolvedActiveTab);
  const [selectedTenantId, setSelectedTenantId] = useState("");

  useEffect(() => {
    setActiveTab(resolvedActiveTab);
  }, [resolvedActiveTab]);

  useEffect(() => {
    if (activeTenants.length === 0) {
      return;
    }
    const routeTenant = activeTenants.find((tenant) => tenant.id === requestedTenantId) ?? activeTenants[0] ?? null;
    if (!routeTenant) {
      return;
    }
    setSelectedTenantId((current) => {
      const currentStillActive = activeTenants.some((tenant) => tenant.id === current);
      if (requestedTenantId) {
        return routeTenant.id;
      }
      if (!current || !currentStillActive) {
        return routeTenant.id;
      }
      return current;
    });
  }, [activeTenants, requestedTenantId]);

  return {
    activeTab,
    requestedAssistantId,
    requestedTenantId,
    selectedTenantId,
    setActiveTab,
    setSelectedTenantId,
  };
}
