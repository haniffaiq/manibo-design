"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@grove/ui/select";
import type { AdminTenantSummary } from "@/lib/api/tenants";

interface AdminTenantPickerProps {
  tenants: AdminTenantSummary[];
  selectedTenant: AdminTenantSummary | null;
  onSelect: (tenantId: string) => void;
  loading?: boolean;
  error?: string | null;
  triggerTestId?: string;
}

export function AdminTenantPicker({
  tenants,
  selectedTenant,
  onSelect,
  loading,
  error,
  triggerTestId = "admin-tenant-picker",
}: AdminTenantPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-medium text-[var(--color-neutral-700)]">Tenant</label>
      <div className="w-64">
        <Select
          value={selectedTenant?.id ?? ""}
          onValueChange={onSelect}
          disabled={loading || tenants.length === 0}
        >
          <SelectTrigger data-testid={triggerTestId}>
            <SelectValue placeholder={loading ? "Loading..." : "Select a tenant"} />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.slug})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error ? (
        <span className="text-sm text-[var(--color-error-700)]">{error}</span>
      ) : null}
    </div>
  );
}
