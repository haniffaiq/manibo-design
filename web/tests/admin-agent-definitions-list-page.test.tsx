import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";

const agentDefMocks = vi.hoisted(() => ({
  listAdminTenantAgentDefinitions: vi.fn(),
  createAdminTenantAgentDefinition: vi.fn(),
  getAdminTenantAgentDefinitionByName: vi.fn(),
}));

const solutionsMocks = vi.hoisted(() => ({
  listAdminTenantSolutions: vi.fn(),
}));

const navigationMocks = vi.hoisted(() => ({
  searchParams: "",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(navigationMocks.searchParams),
}));

vi.mock("@/hooks/use-tenant-picker", () => ({
  useTenantPicker: () => ({
    tenants: [{ id: "tenant-1", name: "Test Tenant", slug: "test_tenant" }],
    selectedTenantId: "tenant-1",
    selectTenant: vi.fn(),
    selectedTenant: { id: "tenant-1", name: "Test Tenant", slug: "test_tenant" },
    tenantsLoading: false,
    tenantsError: null,
  }),
}));

vi.mock("@/components/admin-tenant-picker", () => ({
  AdminTenantPicker: () => <div data-testid="admin-tenant-picker">Tenant picker</div>,
}));

vi.mock("@/lib/api/admin-agent-definitions", () => ({
  listAdminTenantAgentDefinitions: agentDefMocks.listAdminTenantAgentDefinitions,
  createAdminTenantAgentDefinition: agentDefMocks.createAdminTenantAgentDefinition,
  getAdminTenantAgentDefinitionByName: agentDefMocks.getAdminTenantAgentDefinitionByName,
}));

vi.mock("@/lib/api/solutions", () => ({
  listAdminTenantSolutions: solutionsMocks.listAdminTenantSolutions,
}));

vi.mock("@/lib/solutions", () => ({
  isBuildEnabledSolution: () => false,
}));

import DeploymentAgentDefinitionsPage from "@/app/(deployment)/admin/agent-definitions/page";

const SAMPLE_DEFINITIONS = [
  {
    id: "def-1",
    name: "reception_agent",
    status: "published" as const,
    published_version: 2,
    latest_version: 3,
    updated_at: "2026-03-15T12:00:00Z",
    created_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "def-2",
    name: "support_agent",
    status: "draft" as const,
    published_version: null,
    latest_version: 1,
    updated_at: "2026-03-20T09:00:00Z",
    created_at: "2026-03-20T00:00:00Z",
  },
];

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 }}>
      <DeploymentAgentDefinitionsPage />
    </SWRConfig>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DeploymentAgentDefinitionsPage", () => {
  it("has page title Agents", async () => {
    agentDefMocks.listAdminTenantAgentDefinitions.mockResolvedValue(SAMPLE_DEFINITIONS);
    solutionsMocks.listAdminTenantSolutions.mockResolvedValue({ solutions: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Agents")).toBeTruthy();
    });
  });

  it("Actions column has an edit button with pencil icon", async () => {
    agentDefMocks.listAdminTenantAgentDefinitions.mockResolvedValue(SAMPLE_DEFINITIONS);
    solutionsMocks.listAdminTenantSolutions.mockResolvedValue({ solutions: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("admin-agent-definitions-table")).toBeTruthy();
    });

    // Each definition row should have an edit button
    const editButton = screen.getByTestId("admin-agent-definitions-edit-def-1");
    expect(editButton).toBeTruthy();
    expect(editButton.getAttribute("aria-label")).toBe("Edit reception_agent");

    const editButton2 = screen.getByTestId("admin-agent-definitions-edit-def-2");
    expect(editButton2).toBeTruthy();
    expect(editButton2.getAttribute("aria-label")).toBe("Edit support_agent");
  });

  it("columns are not sortable (no sort arrows in headers)", async () => {
    agentDefMocks.listAdminTenantAgentDefinitions.mockResolvedValue(SAMPLE_DEFINITIONS);
    solutionsMocks.listAdminTenantSolutions.mockResolvedValue({ solutions: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("admin-agent-definitions-table")).toBeTruthy();
    });

    const table = screen.getByTestId("admin-agent-definitions-table");
    // SortIndicator uses 8x8 viewBox SVGs; none should be present
    const sortIndicators = table.querySelectorAll("thead svg[viewBox='0 0 8 8']");
    expect(sortIndicators.length).toBe(0);
  });

  it("Actions column header text is present", async () => {
    agentDefMocks.listAdminTenantAgentDefinitions.mockResolvedValue(SAMPLE_DEFINITIONS);
    solutionsMocks.listAdminTenantSolutions.mockResolvedValue({ solutions: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("admin-agent-definitions-table")).toBeTruthy();
    });

    const table = screen.getByTestId("admin-agent-definitions-table");
    const headers = table.querySelectorAll("th");
    const headerTexts = Array.from(headers).map((th) => th.textContent?.trim());
    expect(headerTexts).toContain("Actions");
  });
});
