import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";

const tenantMocks = vi.hoisted(() => ({
  listAdminTenants: vi.fn(),
  onboardAdminTenant: vi.fn(),
  offboardAdminTenant: vi.fn(),
  updateAdminTenantStatus: vi.fn(),
  updateAdminTenantLocale: vi.fn(),
}));

vi.mock("@/lib/api/tenants", () => ({
  listAdminTenants: tenantMocks.listAdminTenants,
  onboardAdminTenant: tenantMocks.onboardAdminTenant,
  offboardAdminTenant: tenantMocks.offboardAdminTenant,
  updateAdminTenantStatus: tenantMocks.updateAdminTenantStatus,
  updateAdminTenantLocale: tenantMocks.updateAdminTenantLocale,
}));

// OverflowMenu uses Radix DropdownMenu portals which don't render in JSDOM.
vi.mock("@grove/ui/overflow-menu", () => ({
  OverflowMenu: ({ items, "data-testid": testId }: {
    items: { label: string; onClick: () => void; testId?: string; destructive?: boolean }[];
    "data-testid"?: string;
  }) => (
    <div data-testid={testId}>
      {items.map((item) => (
        <button key={item.label} data-testid={item.testId} onClick={item.onClick}>
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

// Select uses Radix portals. Provide a lightweight stub.
vi.mock("@grove/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children, ...props }: { children: React.ReactNode; "data-testid"?: string; className?: string }) => <button {...props}>{children}</button>,
  SelectValue: () => <span>value</span>,
}));

import DeploymentTenantsPage from "@/app/(deployment)/admin/tenants/page";

const SAMPLE_TENANTS = [
  {
    id: "t-1",
    name: "Acme Corp",
    slug: "acme_corp",
    status: "active" as const,
    environment: "production" as const,
    ui_locale: "en" as const,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
];

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 }}>
      <DeploymentTenantsPage />
    </SWRConfig>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DeploymentTenantsPage", () => {
  it("renders without a search input", async () => {
    tenantMocks.listAdminTenants.mockResolvedValue(SAMPLE_TENANTS);
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("admin-tenants-table")).toBeTruthy();
    });

    expect(screen.queryByPlaceholderText("Search...")).toBeNull();
    expect(screen.queryByPlaceholderText("Search")).toBeNull();
  });

  it("renders Actions column header", async () => {
    tenantMocks.listAdminTenants.mockResolvedValue(SAMPLE_TENANTS);
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("admin-tenants-table")).toBeTruthy();
    });

    const table = screen.getByTestId("admin-tenants-table");
    const headers = table.querySelectorAll("th");
    const headerTexts = Array.from(headers).map((th) => th.textContent?.trim());
    expect(headerTexts).toContain("Actions");
  });

  it("columns are not sortable (no sort buttons in headers)", async () => {
    tenantMocks.listAdminTenants.mockResolvedValue(SAMPLE_TENANTS);
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("admin-tenants-table")).toBeTruthy();
    });

    const table = screen.getByTestId("admin-tenants-table");
    const headerButtons = table.querySelectorAll("thead button");
    // The only buttons in the thead should be from mocked Select triggers, not sort buttons.
    // Real sort buttons have SortIndicator SVGs; our headers should have none since
    // no columns have sortable=true and no onSort is provided.
    const sortIndicators = table.querySelectorAll("thead svg[viewBox='0 0 8 8']");
    expect(sortIndicators.length).toBe(0);
  });

  it("does not render a column visibility toggle (settings gear)", async () => {
    tenantMocks.listAdminTenants.mockResolvedValue(SAMPLE_TENANTS);
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("admin-tenants-table")).toBeTruthy();
    });

    // No column toggle gear / settings icon
    expect(screen.queryByLabelText("Toggle columns")).toBeNull();
    expect(screen.queryByTestId("data-table-column-toggle")).toBeNull();
  });
});
