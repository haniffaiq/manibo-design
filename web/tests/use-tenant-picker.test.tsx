import { renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const tenantPickerMocks = vi.hoisted(() => ({
  listAdminTenants: vi.fn(),
}));

vi.mock("@/lib/api/tenants", () => ({
  listAdminTenants: tenantPickerMocks.listAdminTenants,
}));

import { useTenantPicker } from "@/hooks/use-tenant-picker";

function wrapper({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 }}>{children}</SWRConfig>;
}

const TENANT = {
  id: "tenant-prod",
  name: "Tenant Prod",
  slug: "tenant-prod",
  status: "active" as const,
  environment: "production" as const,
  ui_locale: "en" as const,
  created_at: "2026-03-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("useTenantPicker", () => {
  it("includes all tenants by default and auto-selects the first", async () => {
    tenantPickerMocks.listAdminTenants.mockResolvedValueOnce([TENANT]);

    const { result } = renderHook(() => useTenantPicker({ swrKey: "admin-tenants-default" }), { wrapper });

    await waitFor(() => {
      expect(result.current.selectedTenantId).toBe(TENANT.id);
    });

    expect(tenantPickerMocks.listAdminTenants).toHaveBeenCalledWith(500, 0, { include_non_production: true });
  });

  it("excludes non-production when page opts out explicitly", async () => {
    tenantPickerMocks.listAdminTenants.mockResolvedValueOnce([TENANT]);

    renderHook(() => useTenantPicker({ swrKey: "admin-tenants-prod-only", includeNonProduction: false }), { wrapper });

    await waitFor(() => {
      expect(tenantPickerMocks.listAdminTenants).toHaveBeenCalledWith(500, 0, { include_non_production: false });
    });
  });
});
