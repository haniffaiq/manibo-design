import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";

const adminSolutionsMocks = vi.hoisted(() => ({
  listAdminTenantSolutions: vi.fn(),
}));

vi.mock("@/hooks/use-tenant-picker", () => ({
  useTenantPicker: () => ({
    tenants: [{ id: "tenant-1", name: "Tenant One", slug: "tenant-one" }],
    selectedTenantId: "tenant-1",
    selectTenant: vi.fn(),
    selectedTenant: { id: "tenant-1", name: "Tenant One", slug: "tenant-one" },
    tenantsLoading: false,
    tenantsError: null,
  }),
}));

vi.mock("@/components/admin-tenant-picker", () => ({
  AdminTenantPicker: () => <div data-testid="admin-tenant-picker">Tenant picker</div>,
}));

vi.mock("@/lib/api/solutions", () => ({
  listAdminTenantSolutions: adminSolutionsMocks.listAdminTenantSolutions,
  updateAdminTenantSolution: vi.fn(),
}));

vi.mock("@/lib/solutions", () => ({
  formatSolutionLabel: (solutionName: string) => solutionName,
  isBuildEnabledSolution: (solutionName: string) => solutionName === "appointment_booking",
}));

import AdminSolutionsPage from "@/app/(deployment)/admin/solutions/page";

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 }}>
      <AdminSolutionsPage />
    </SWRConfig>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminSolutionsPage", () => {
  it("shows only shipped solutions in the access table", async () => {
    adminSolutionsMocks.listAdminTenantSolutions.mockResolvedValueOnce({
      solutions: [
        {
          solution_name: "appointment_booking",
          enabled: true,
          version: "1.0.0",
          description: "Bookings",
          requires_enabled: [],
          optional_enabled: [],
          desired_revision: null,
          active_revision: null,
        },
        {
          solution_name: "driver_verification",
          enabled: true,
          version: "1.0.0",
          description: "Driver workflows",
          requires_enabled: [],
          optional_enabled: [],
          desired_revision: null,
          active_revision: null,
        },
        {
          solution_name: "telematics_ingestion",
          enabled: false,
          version: "1.0.0",
          description: "Inbound telematics",
          requires_enabled: [],
          optional_enabled: [],
          desired_revision: null,
          active_revision: null,
        },
      ],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("admin-solutions-toggle-appointment_booking").getAttribute("aria-checked")).toBe("true");
    });

    expect(screen.queryByTestId("admin-solutions-toggle-driver_verification")).toBeNull();
    expect(screen.queryByTestId("admin-solutions-toggle-telematics_ingestion")).toBeNull();
  });

  it("has page title Solutions", async () => {
    adminSolutionsMocks.listAdminTenantSolutions.mockResolvedValueOnce({ solutions: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Solutions")).toBeTruthy();
    });
  });

  it("does not render a search input", async () => {
    adminSolutionsMocks.listAdminTenantSolutions.mockResolvedValueOnce({ solutions: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Solutions")).toBeTruthy();
    });

    expect(screen.queryByPlaceholderText("Search...")).toBeNull();
    expect(screen.queryByPlaceholderText("Search")).toBeNull();
  });

  it("does not render a column visibility toggle", async () => {
    adminSolutionsMocks.listAdminTenantSolutions.mockResolvedValueOnce({ solutions: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Solutions")).toBeTruthy();
    });

    expect(screen.queryByLabelText("Toggle columns")).toBeNull();
    expect(screen.queryByTestId("data-table-column-toggle")).toBeNull();
  });
});
