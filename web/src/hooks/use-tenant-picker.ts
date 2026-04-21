"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { listAdminTenants, type AdminTenantSummary } from "@/lib/api/tenants";

const EMPTY_TENANTS: AdminTenantSummary[] = [];

interface UseTenantPickerOptions {
  swrKey: string;
  includeNonProduction?: boolean;
  initialTenantId?: string;
  onTenantChange?: (tenantId: string) => void;
}

// Default includes non-production so admin pages show all manageable tenants.
export function useTenantPicker({ swrKey, includeNonProduction = true, initialTenantId, onTenantChange }: UseTenantPickerOptions) {
  const [selectedTenantId, setSelectedTenantId] = useState(initialTenantId ?? "");

  const {
    data: tenantsData,
    error: tenantsError,
    isLoading: tenantsLoading,
  } = useSWR(swrKey, () => listAdminTenants(500, 0, { include_non_production: includeNonProduction }), {
    revalidateOnFocus: false,
  });

  const tenants = tenantsData ?? EMPTY_TENANTS;

  useEffect(() => {
    if (!selectedTenantId && tenants.length > 0) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [selectedTenantId, tenants]);

  function selectTenant(tenantId: string): void {
    setSelectedTenantId(tenantId);
    onTenantChange?.(tenantId);
  }

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) ?? null;

  return {
    tenants,
    selectedTenantId,
    selectTenant,
    selectedTenant,
    tenantsLoading,
    tenantsError,
  } as const;
}
