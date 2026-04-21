import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const routeState = vi.hoisted(() => ({
  definitionId: "definition-1",
  searchParams: new URLSearchParams("tenant_id=tenant-1"),
}));

const pageMocks = vi.hoisted(() => ({
  archiveAdminTenantAgentDefinitionVersion: vi.fn(),
  createAdminTenantAgentDefinitionVersion: vi.fn(),
  getAdminTenantAgentDefinition: vi.fn(),
  getAdminTenantAgentDefinitionArtifactByName: vi.fn(),
  getAgentStarters: vi.fn(),
  listAdminTenantAgentDefinitionVersions: vi.fn(),
  listAdminTenantSolutions: vi.fn(),
  listPlatformDefaults: vi.fn(),
  listTestCalls: vi.fn(),
  publishAdminTenantAgentDefinitionVersion: vi.fn(),
  retireAdminTenantAgentDefinition: vi.fn(),
  reviewAdminTenantAgentDefinitionVersion: vi.fn(),
  submitAdminTenantAgentDefinitionVersion: vi.fn(),
  updateAdminTenantAgentDefinitionVersion: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: routeState.definitionId }),
  useSearchParams: () => routeState.searchParams,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/page-frame", () => ({
  PageFrame: ({ children }: { children: ReactNode }) => <div data-testid="page-frame">{children}</div>,
}));

vi.mock("@/app/(deployment)/admin/agent-definitions/structured-agent-editor", () => ({
  StructuredAgentEditor: ({ value }: { value: string }) => <pre data-testid="structured-agent-editor">{value}</pre>,
}));

vi.mock("@/app/(deployment)/admin/agent-definitions/yaml-flow-preview", () => ({
  YamlFlowPreview: ({ yaml }: { yaml: string }) => <div data-testid="yaml-flow-preview">{yaml}</div>,
}));

vi.mock("@/lib/api/admin-agent-definitions", () => ({
  archiveAdminTenantAgentDefinitionVersion: pageMocks.archiveAdminTenantAgentDefinitionVersion,
  createAdminTenantAgentDefinitionVersion: pageMocks.createAdminTenantAgentDefinitionVersion,
  getAdminTenantAgentDefinition: pageMocks.getAdminTenantAgentDefinition,
  getAdminTenantAgentDefinitionArtifactByName: pageMocks.getAdminTenantAgentDefinitionArtifactByName,
  listAdminTenantAgentDefinitionVersions: pageMocks.listAdminTenantAgentDefinitionVersions,
  listTestCalls: pageMocks.listTestCalls,
  publishAdminTenantAgentDefinitionVersion: pageMocks.publishAdminTenantAgentDefinitionVersion,
  retireAdminTenantAgentDefinition: pageMocks.retireAdminTenantAgentDefinition,
  reviewAdminTenantAgentDefinitionVersion: pageMocks.reviewAdminTenantAgentDefinitionVersion,
  submitAdminTenantAgentDefinitionVersion: pageMocks.submitAdminTenantAgentDefinitionVersion,
  updateAdminTenantAgentDefinitionVersion: pageMocks.updateAdminTenantAgentDefinitionVersion,
}));

vi.mock("@/lib/api/admin-settings", () => ({
  listPlatformDefaults: pageMocks.listPlatformDefaults,
}));

vi.mock("@/lib/api/solutions", () => ({
  listAdminTenantSolutions: pageMocks.listAdminTenantSolutions,
}));

vi.mock("@/lib/solutions", () => ({
  isBuildEnabledSolution: (solutionName: string) => solutionName === "appointment_booking",
}));

vi.mock("@/app/(deployment)/admin/agent-definitions/helpers", async () => {
  const actual = await vi.importActual<typeof import("@/app/(deployment)/admin/agent-definitions/helpers")>(
    "@/app/(deployment)/admin/agent-definitions/helpers",
  );
  return {
    ...actual,
    getAgentStarters: pageMocks.getAgentStarters,
  };
});

import AgentDefinitionDetailPage from "@/app/(deployment)/admin/agent-definitions/[id]/page";

const BASE_DEFINITION = {
  id: "definition-1",
  tenant_id: "tenant-1",
  name: "clinic_registrator",
  status: "published" as const,
  published_version: 3,
  created_at: "2026-03-28T10:00:00Z",
  updated_at: "2026-03-28T10:00:00Z",
};

const BASE_VERSION = {
  id: "version-3",
  agent_definition_id: "definition-1",
  tenant_id: "tenant-1",
  version: 3,
  status: "published" as const,
  source_yaml: "name: clinic_registrator\nmission: current provider mission\n",
  source_yaml_hash: "abc12345",
  compiled_hash: "def67890",
  model_policy_snapshot_ref: null,
  platform_defaults_version: "clinic_default_v1",
  created_at: "2026-03-28T10:00:00Z",
  submitted_at: "2026-03-28T10:10:00Z",
  published_at: "2026-03-28T10:20:00Z",
  review_decision: "approved" as const,
  review_reason: null,
  review_submitted_at: "2026-03-28T10:15:00Z",
  review_decided_at: "2026-03-28T10:18:00Z",
};

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 }}>
      <AgentDefinitionDetailPage />
    </SWRConfig>,
  );
}

async function waitForPageReady() {
  await waitFor(() => {
    expect(pageMocks.getAdminTenantAgentDefinition).toHaveBeenCalledWith("tenant-1", "definition-1");
  });
  await screen.findByRole("heading", { name: "clinic_registrator" });
}

beforeEach(() => {
  routeState.definitionId = "definition-1";
  routeState.searchParams = new URLSearchParams("tenant_id=tenant-1");
  window.sessionStorage.clear();

  pageMocks.getAdminTenantAgentDefinition.mockResolvedValue(BASE_DEFINITION);
  pageMocks.listAdminTenantAgentDefinitionVersions.mockResolvedValue([BASE_VERSION]);
  pageMocks.listPlatformDefaults.mockResolvedValue([
    {
      version: "clinic_default_v1",
      config_yaml_hash: "hash-1",
      created_by: "operator@example.com",
      created_at: "2026-03-28T09:00:00Z",
    },
  ]);
  pageMocks.getAgentStarters.mockResolvedValue([]);
  pageMocks.listAdminTenantSolutions.mockResolvedValue({
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
    ],
  });
  pageMocks.getAdminTenantAgentDefinitionArtifactByName.mockResolvedValue({
    agent_definition_id: "definition-1",
    tenant_id: "tenant-1",
    name: "clinic_registrator",
    version: 3,
    compiled_hash: "compiled-1",
    compiled_config: {
      mission: "provider mission",
      provider: "clinic",
    },
  });
  pageMocks.archiveAdminTenantAgentDefinitionVersion.mockResolvedValue({ status: "archived" });
  pageMocks.retireAdminTenantAgentDefinition.mockResolvedValue({ status: "retired" });
  pageMocks.createAdminTenantAgentDefinitionVersion.mockResolvedValue({ version: 4 });
  pageMocks.publishAdminTenantAgentDefinitionVersion.mockResolvedValue({ status: "published" });
  pageMocks.reviewAdminTenantAgentDefinitionVersion.mockResolvedValue({ status: "approved" });
  pageMocks.submitAdminTenantAgentDefinitionVersion.mockResolvedValue({ status: "submitted" });
  pageMocks.updateAdminTenantAgentDefinitionVersion.mockResolvedValue({
    version: 3,
    status: "draft",
    source_yaml_hash: "updated-hash",
    compiled_hash: "updated-compiled",
  });
  pageMocks.listTestCalls.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.sessionStorage.clear();
});

describe("AgentDefinitionDetailPage", () => {
  it("defers draft-authoring fetches until the new version form is opened", async () => {
    renderPage();
    await waitForPageReady();

    expect(pageMocks.listPlatformDefaults).not.toHaveBeenCalled();
    expect(pageMocks.getAgentStarters).not.toHaveBeenCalled();
    expect(pageMocks.listAdminTenantSolutions).not.toHaveBeenCalled();

    (await screen.findByTestId("admin-agent-definitions-open-new-version")).click();

    await waitFor(() => {
      expect(pageMocks.listPlatformDefaults).toHaveBeenCalledTimes(0);
      expect(pageMocks.getAgentStarters).toHaveBeenCalledTimes(1);
      expect(pageMocks.listAdminTenantSolutions).toHaveBeenCalledWith("tenant-1");
    });
  });

  it("creates a draft even when no platform defaults version exists yet", async () => {
    pageMocks.listPlatformDefaults.mockResolvedValue([]);

    renderPage();
    await waitForPageReady();

    await waitFor(() => {
      expect(screen.getByTestId("admin-agent-definitions-open-new-version")).toBeTruthy();
    });
    screen.getByTestId("admin-agent-definitions-open-new-version").click();

    await waitFor(() => {
      expect(screen.getByTestId("structured-agent-editor").textContent).toContain("clinic_registrator");
    });
    expect(screen.queryByTestId("admin-agent-definitions-platform-defaults-prerequisite")).toBeNull();
    expect(screen.getByTestId("admin-agent-definitions-version-submit").hasAttribute("disabled")).toBe(false);

    screen.getByTestId("admin-agent-definitions-version-submit").click();

    await waitFor(() => {
      expect(pageMocks.createAdminTenantAgentDefinitionVersion).toHaveBeenCalledWith(
        "tenant-1",
        "definition-1",
        expect.objectContaining({
          source_yaml: "name: clinic_registrator\nmission: current provider mission",
        }),
      );
    });
  });

  it("creates a new version without sending platform defaults explicitly", async () => {
    pageMocks.listPlatformDefaults.mockResolvedValue([
      {
        version: "clinic_default_v2",
        config_yaml_hash: "hash-2",
        created_by: "operator@example.com",
        created_at: "2026-03-28T11:00:00Z",
      },
      {
        version: "clinic_default_v1",
        config_yaml_hash: "hash-1",
        created_by: "operator@example.com",
        created_at: "2026-03-28T09:00:00Z",
      },
    ]);

    renderPage();
    await waitForPageReady();

    screen.getByTestId("admin-agent-definitions-open-new-version").click();
    await waitFor(() => {
      expect(screen.getByTestId("admin-agent-definitions-version-submit")).toBeTruthy();
    });
    screen.getByTestId("admin-agent-definitions-version-submit").click();

    await waitFor(() => {
      expect(pageMocks.createAdminTenantAgentDefinitionVersion).toHaveBeenCalledWith(
        "tenant-1",
        "definition-1",
        expect.objectContaining({
          source_yaml: "name: clinic_registrator\nmission: current provider mission",
        }),
      );
    });
  });

  it("retires the assistant and shows the operator notice", async () => {
    renderPage();
    await waitForPageReady();

    screen.getByTestId("admin-agent-definitions-retire").click();

    await waitFor(() => {
      expect(pageMocks.retireAdminTenantAgentDefinition).toHaveBeenCalledWith("tenant-1", "definition-1");
    });

    await waitFor(() => {
      expect(screen.getByTestId("admin-agent-definitions-action-notice").textContent).toContain(
        "Retired assistant clinic_registrator",
      );
    });
  });

  it("shows the retire guard when live phone routing still points at the assistant", async () => {
    pageMocks.retireAdminTenantAgentDefinition.mockRejectedValue(
      new Error(
        "Cannot retire: assistant is still assigned to active phone-number routing. Pause or reassign those numbers first.",
      ),
    );

    renderPage();
    await waitForPageReady();

    screen.getByTestId("admin-agent-definitions-retire").click();

    await waitFor(() => {
      expect(pageMocks.retireAdminTenantAgentDefinition).toHaveBeenCalledWith("tenant-1", "definition-1");
    });

    expect(screen.getByTestId("admin-agent-definitions-action-error").textContent).toContain(
      "Pause or reassign those numbers first.",
    );
    expect(screen.queryByTestId("admin-agent-definitions-action-notice")).toBeNull();
  });

  it("publishes a previously live version without re-review", async () => {
    pageMocks.listAdminTenantAgentDefinitionVersions.mockResolvedValue([
      BASE_VERSION,
      {
        ...BASE_VERSION,
        id: "version-2",
        version: 2,
        status: "previously_published" as const,
        source_yaml: "name: clinic_registrator\nmission: previous provider mission\n",
        source_yaml_hash: "previous-hash",
        compiled_hash: "previous-compiled",
      },
    ]);

    renderPage();
    await waitForPageReady();

    screen.getByTestId("admin-agent-definition-publish-2").click();

    await waitFor(() => {
      expect(pageMocks.publishAdminTenantAgentDefinitionVersion).toHaveBeenCalledWith("tenant-1", "definition-1", 2);
    });

    expect(pageMocks.submitAdminTenantAgentDefinitionVersion).not.toHaveBeenCalled();
    expect(pageMocks.reviewAdminTenantAgentDefinitionVersion).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId("admin-agent-definitions-action-notice").textContent).toContain(
        "Published clinic_registrator v2",
      );
    });
  });

  it("shows archive controls for non-live versions and archives after confirmation", async () => {
    pageMocks.listAdminTenantAgentDefinitionVersions.mockResolvedValue([
      BASE_VERSION,
      {
        ...BASE_VERSION,
        id: "version-2",
        version: 2,
        status: "previously_published" as const,
        source_yaml_hash: "previous-hash",
        compiled_hash: "previous-compiled",
      },
      {
        ...BASE_VERSION,
        id: "version-1",
        version: 1,
        status: "rejected" as const,
        published_at: null,
        review_decision: "rejected" as const,
      },
    ]);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();
    await waitForPageReady();

    expect(screen.getByTestId("admin-agent-definition-archive-2")).toBeTruthy();
    expect(screen.getByTestId("admin-agent-definition-archive-1")).toBeTruthy();

    screen.getByTestId("admin-agent-definition-archive-2").click();

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith("Archive v2? Archived versions cannot be published again.");
      expect(pageMocks.archiveAdminTenantAgentDefinitionVersion).toHaveBeenCalledWith("tenant-1", "definition-1", 2);
    });

    await waitFor(() => {
      expect(screen.getByTestId("admin-agent-definitions-action-notice").textContent).toContain(
        "Archived clinic_registrator v2",
      );
    });
  });
});
