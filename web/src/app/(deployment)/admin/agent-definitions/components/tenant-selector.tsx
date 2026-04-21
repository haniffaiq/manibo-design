"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@grove/ui/select";
import type { AdminTenantSummary } from "@/lib/api/tenants";

export interface TenantSelectorProps {
  tenants: AdminTenantSummary[];
  selectedTenantId: string | null;
  onChange: (tenantId: string) => void;
  loading?: boolean;
}

/**
 * Tenant selector for the assistants list header. Filters out non-active
 * tenants since you can't manage agents for them.
 */
export function TenantSelector({ tenants, selectedTenantId, onChange, loading }: TenantSelectorProps) {
  const usable = tenants.filter((t) => t.status !== "offboarded");

  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
        Tenant
      </label>
      <Select value={selectedTenantId ?? undefined} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading tenants…" : "Select a tenant"} />
        </SelectTrigger>
        <SelectContent>
          {usable.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              <span className="flex items-center gap-2">
                <span className="font-medium">{tenant.name}</span>
                <span className="text-[11px] uppercase tracking-wide text-[var(--color-neutral-500)]">
                  {tenant.environment}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
