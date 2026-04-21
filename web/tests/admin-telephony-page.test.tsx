"use client";

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const telephonyMocks = vi.hoisted(() => ({
  listAdminTelephonyProviderOptions: vi.fn(),
  listAdminTelephonyProviderAccounts: vi.fn(),
  listAdminTelephonyTrunks: vi.fn(),
  listAdminTelephonyNumbers: vi.fn(),
  getAdminTenantTelephonyPolicy: vi.fn(),
  createAdminTelephonyProviderAccount: vi.fn(),
  updateAdminTelephonyProviderAccount: vi.fn(),
  testAdminTelephonyProviderAccount: vi.fn(),
  syncAdminTelephonyTrunks: vi.fn(),
  syncAdminTelephonyNumbers: vi.fn(),
  deleteAdminTelephonyProviderAccount: vi.fn(),
}));

const tenantMocks = vi.hoisted(() => ({
  listAdminTenants: vi.fn(),
}));

const phoneNumberMocks = vi.hoisted(() => ({
  listAdminTenantPhoneChannels: vi.fn(),
  listAdminTenantPhoneNumbers: vi.fn(),
  createAdminTenantPhoneChannel: vi.fn(),
  createAdminTenantPhoneNumber: vi.fn(),
  updateAdminTenantPhoneChannel: vi.fn(),
  updateAdminTenantPhoneNumber: vi.fn(),
  deleteAdminTenantPhoneChannel: vi.fn(),
  deleteAdminTenantPhoneNumber: vi.fn(),
}));

const agentDefinitionMocks = vi.hoisted(() => ({
  listAdminTenantAgentDefinitions: vi.fn(),
}));

const navigationMocks = vi.hoisted(() => ({
  searchParams: "",
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(navigationMocks.searchParams),
}));

vi.mock("@/lib/api/admin-telephony", () => ({
  listAdminTelephonyProviderOptions: telephonyMocks.listAdminTelephonyProviderOptions,
  listAdminTelephonyProviderAccounts: telephonyMocks.listAdminTelephonyProviderAccounts,
  listAdminTelephonyTrunks: telephonyMocks.listAdminTelephonyTrunks,
  listAdminTelephonyNumbers: telephonyMocks.listAdminTelephonyNumbers,
  getAdminTenantTelephonyPolicy: telephonyMocks.getAdminTenantTelephonyPolicy,
  createAdminTelephonyProviderAccount: telephonyMocks.createAdminTelephonyProviderAccount,
  updateAdminTelephonyProviderAccount: telephonyMocks.updateAdminTelephonyProviderAccount,
  testAdminTelephonyProviderAccount: telephonyMocks.testAdminTelephonyProviderAccount,
  syncAdminTelephonyTrunks: telephonyMocks.syncAdminTelephonyTrunks,
  syncAdminTelephonyNumbers: telephonyMocks.syncAdminTelephonyNumbers,
  deleteAdminTelephonyProviderAccount: telephonyMocks.deleteAdminTelephonyProviderAccount,
}));

vi.mock("@/lib/api/tenants", () => ({
  listAdminTenants: tenantMocks.listAdminTenants,
}));

vi.mock("@/lib/api/phone-numbers", () => ({
  listAdminTenantPhoneChannels: phoneNumberMocks.listAdminTenantPhoneChannels,
  listAdminTenantPhoneNumbers: phoneNumberMocks.listAdminTenantPhoneNumbers,
  createAdminTenantPhoneChannel: phoneNumberMocks.createAdminTenantPhoneChannel,
  createAdminTenantPhoneNumber: phoneNumberMocks.createAdminTenantPhoneNumber,
  updateAdminTenantPhoneChannel: phoneNumberMocks.updateAdminTenantPhoneChannel,
  updateAdminTenantPhoneNumber: phoneNumberMocks.updateAdminTenantPhoneNumber,
  deleteAdminTenantPhoneChannel: phoneNumberMocks.deleteAdminTenantPhoneChannel,
  deleteAdminTenantPhoneNumber: phoneNumberMocks.deleteAdminTenantPhoneNumber,
}));

vi.mock("@/lib/api/admin-agent-definitions", () => ({
  listAdminTenantAgentDefinitions: agentDefinitionMocks.listAdminTenantAgentDefinitions,
}));

// Mock the number table to avoid Radix DropdownMenu portal issues in JSDOM.
// The real component uses OverflowMenu (Radix portal), which does not render in JSDOM.
vi.mock("@/components/admin-telephony-number-table", () => ({
  AdminTelephonyNumberTable: ({ rows, loading, onSelectRow }: {
    rows: { id: string; phoneNumber: string; tenantLabel: string; assignmentLabel: string; statusLabel: string; providerLabel: string }[];
    loading: boolean;
    onSelectRow: (row: { id: string; phoneNumber: string; tenantLabel: string }) => void;
  }) => (
    <div data-testid="admin-telephony-number-table">
      {loading ? <p>Loading numbers...</p> : null}
      {!loading && rows.length === 0 ? <p>No numbers synced yet.</p> : null}
      <table>
        <thead>
          <tr>
            <th>Number</th>
            <th>Provider</th>
            <th>Tenant</th>
            <th>Assistant</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.phoneNumber}</td>
              <td>{row.providerLabel}</td>
              <td>{row.tenantLabel}</td>
              <td>{row.assignmentLabel}</td>
              <td>{row.statusLabel}</td>
              <td>
                <button
                  data-testid={`number-actions-${row.id}`}
                  onClick={() => onSelectRow(row)}
                >
                  {row.tenantLabel ? "Edit assignment" : "Assign number"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
}));

import AdminTelephonyPage from "@/app/(deployment)/admin/telephony/page";

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
let scrollTargets: string[] = [];

function renderPageTree() {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 }}>
      <AdminTelephonyPage />
    </SWRConfig>
  );
}

function renderPage() {
  return render(renderPageTree());
}

beforeEach(() => {
  scrollTargets = [];
  HTMLElement.prototype.scrollIntoView = vi.fn(function (this: HTMLElement) {
    scrollTargets.push(this.id);
  });
  navigationMocks.searchParams = "";
  telephonyMocks.listAdminTelephonyProviderOptions.mockResolvedValue([
    {
      provider_kind: "telnyx",
      display_name: "Telnyx",
      capability_matrix: [
        {
          capability: "telephony.connect_provider_account",
          enabled: true,
          notes: null,
        },
      ],
      operations: [
        {
          operation: "validate_account",
          mode: "managed",
          implemented: true,
          notes: null,
        },
        {
          operation: "sync_trunks",
          mode: "managed",
          implemented: true,
          notes: null,
        },
        {
          operation: "sync_numbers",
          mode: "managed",
          implemented: true,
          notes: null,
        },
      ],
    },
  ]);
  telephonyMocks.listAdminTelephonyProviderAccounts.mockResolvedValue([
    {
      id: "provider-1",
      owner_scope: "deployment",
      owner_tenant_id: null,
      provider_kind: "telnyx",
      display_name: "Primary Telnyx",
      status: "connected",
      capability_snapshot: ["telephony.connect_provider_account", "telephony.sync_numbers"],
      provider_metadata: {},
      control_plane: {
        last_tested_at: "2026-04-04T10:00:00Z",
        last_test_outcome: "success",
        last_test_message: "Connected",
        last_test_probe: "provider.connectivity",
      },
      credential_configured: true,
      created_at: "2026-04-04T09:00:00Z",
      updated_at: "2026-04-04T10:00:00Z",
    },
  ]);
  telephonyMocks.listAdminTelephonyTrunks.mockResolvedValue([
    {
      id: "trunk-1",
      provider_account_id: "provider-1",
      display_name: "Inbound trunk",
      direction: "inbound",
      transport_kind: "sip",
      provider_resource_id: "resource-1",
      livekit_binding_id: "lk-trunk-1",
      status: "active",
      config: {},
      control_plane: null,
      created_at: "2026-04-04T09:00:00Z",
      updated_at: "2026-04-04T10:00:00Z",
    },
  ]);
  telephonyMocks.listAdminTelephonyNumbers.mockResolvedValue([
    {
      id: "number-1",
      provider_account_id: "provider-1",
      trunk_id: "trunk-1",
      e164_number: "+15551230000",
      provider_number_id: "telnyx-number-1",
      status: "inventory",
      source: "purchased",
      capability_snapshot: ["telephony.assign_published_assistant"],
      number_metadata: {},
      control_plane: null,
      created_at: "2026-04-04T09:00:00Z",
      updated_at: "2026-04-04T10:00:00Z",
    },
  ]);
  telephonyMocks.getAdminTenantTelephonyPolicy.mockResolvedValue({
    tenant_id: "tenant-1",
    mode: "default_with_byo_override",
    allows_deployment_default: true,
    allows_tenant_byo: true,
    usable_provider_account_source: "deployment_default",
    deployment_provider_account_count: 1,
    tenant_provider_account_count: 0,
    updated_at: "2026-04-04T10:00:00Z",
  });
  tenantMocks.listAdminTenants.mockResolvedValue([
    {
      id: "tenant-1",
      name: "Clinic One",
      slug: "clinic-one",
      status: "active",
      environment: "production",
      ui_locale: "en",
      created_at: "2026-04-04T09:00:00Z",
      updated_at: "2026-04-04T10:00:00Z",
    },
  ]);
  phoneNumberMocks.listAdminTenantPhoneChannels.mockResolvedValue({ phone_channels: [] });
  phoneNumberMocks.listAdminTenantPhoneNumbers.mockResolvedValue({ phone_numbers: [] });
  phoneNumberMocks.createAdminTenantPhoneChannel.mockImplementation(phoneNumberMocks.createAdminTenantPhoneNumber);
  phoneNumberMocks.updateAdminTenantPhoneChannel.mockImplementation(phoneNumberMocks.updateAdminTenantPhoneNumber);
  phoneNumberMocks.deleteAdminTenantPhoneChannel.mockImplementation(phoneNumberMocks.deleteAdminTenantPhoneNumber);
  agentDefinitionMocks.listAdminTenantAgentDefinitions.mockResolvedValue([
    {
      id: "agent-1",
      tenant_id: "tenant-1",
      name: "Appointment Intake",
      status: "published",
      published_version: 3,
      created_at: "2026-04-04T09:00:00Z",
      updated_at: "2026-04-04T10:00:00Z",
    },
  ]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
});

describe("AdminTelephonyPage", () => {
  it("renders both providers and numbers sections on the same page", async () => {
    navigationMocks.searchParams = "tenant_id=tenant-1&assistant_id=agent-1";

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Provider accounts")).toBeTruthy();
    });
    expect(screen.getByRole("heading", { name: "Numbers" })).toBeTruthy();
  });

  it("renders both provider accounts and numbers sections regardless of query params", async () => {
    navigationMocks.searchParams = "tenant_id=tenant-1";

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Provider accounts")).toBeTruthy();
    });
    expect(screen.getByRole("heading", { name: "Numbers" })).toBeTruthy();
  });

  it("scrolls to the numbers section for telephony number deep links", async () => {
    navigationMocks.searchParams = "tab=numbers&tenant_id=tenant-1&assistant_id=agent-1";

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("admin-telephony-numbers-section")).toBeTruthy();
    });
    await waitFor(() => {
      expect(scrollTargets).toContain("numbers");
    });
  });

  it("resyncs tenant-scoped fetches when the URL query changes after mount", async () => {
    navigationMocks.searchParams = "tenant_id=tenant-1&assistant_id=agent-1";
    tenantMocks.listAdminTenants.mockResolvedValue([
      {
        id: "tenant-1",
        name: "Clinic One",
        slug: "clinic-one",
        status: "active",
        environment: "production",
        ui_locale: "en",
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
      {
        id: "tenant-2",
        name: "Clinic Two",
        slug: "clinic-two",
        status: "active",
        environment: "production",
        ui_locale: "en",
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    telephonyMocks.getAdminTenantTelephonyPolicy.mockImplementation(async (tenantId: string) => ({
      tenant_id: tenantId,
      mode: "default_with_byo_override",
      allows_deployment_default: true,
      allows_tenant_byo: true,
      usable_provider_account_source: "deployment_default",
      deployment_provider_account_count: 1,
      tenant_provider_account_count: 0,
      updated_at: "2026-04-04T10:00:00Z",
    }));

    const view = renderPage();

    await waitFor(() => {
      expect(telephonyMocks.getAdminTenantTelephonyPolicy).toHaveBeenCalledWith("tenant-1");
    });

    navigationMocks.searchParams = "tenant_id=tenant-2";
    view.rerender(renderPageTree());

    await waitFor(() => {
      expect(telephonyMocks.getAdminTenantTelephonyPolicy).toHaveBeenCalledWith("tenant-2");
    });
  });

  it("keeps the requested tenant until an operator explicitly selects a bound number", async () => {
    navigationMocks.searchParams = "tenant_id=tenant-1&assistant_id=agent-1";
    tenantMocks.listAdminTenants.mockResolvedValue([
      {
        id: "tenant-1",
        name: "Clinic One",
        slug: "clinic-one",
        status: "active",
        environment: "production",
        ui_locale: "en",
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
      {
        id: "tenant-2",
        name: "Clinic Two",
        slug: "clinic-two",
        status: "active",
        environment: "production",
        ui_locale: "en",
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    telephonyMocks.getAdminTenantTelephonyPolicy.mockImplementation(async (tenantId: string) => ({
      tenant_id: tenantId,
      mode: "default_with_byo_override",
      allows_deployment_default: true,
      allows_tenant_byo: true,
      usable_provider_account_source: "deployment_default",
      deployment_provider_account_count: 1,
      tenant_provider_account_count: 0,
      updated_at: "2026-04-04T10:00:00Z",
    }));
    agentDefinitionMocks.listAdminTenantAgentDefinitions.mockImplementation(async (tenantId: string) => [
      {
        id: tenantId === "tenant-1" ? "agent-1" : "agent-2",
        tenant_id: tenantId,
        name: tenantId === "tenant-1" ? "Appointment Intake" : "Overflow Desk",
        status: "published",
        published_version: 3,
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    telephonyMocks.listAdminTelephonyNumbers.mockResolvedValue([
      {
        id: "number-2",
        provider_account_id: "provider-1",
        trunk_id: "trunk-1",
        e164_number: "+15551230000",
        provider_number_id: "telnyx-number-2",
        status: "assigned",
        source: "purchased",
        capability_snapshot: ["telephony.assign_published_assistant"],
        number_metadata: {},
        control_plane: null,
        binding_summary: {
          id: "binding-2",
          tenant_id: "tenant-2",
          tenant_name: "Clinic Two",
          tenant_slug: "clinic-two",
          sip_trunk_id: "lk-trunk-1",
          active: true,
          agent_definition_id: "agent-2",
          agent_name: "Overflow Desk",
          agent_status: "published",
          published_version: 3,
          routing_ready: true,
          created_at: "2026-04-04T10:05:00Z",
        },
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
      {
        id: "number-1",
        provider_account_id: "provider-1",
        trunk_id: "trunk-1",
        e164_number: "+15551239999",
        provider_number_id: "telnyx-number-1",
        status: "inventory",
        source: "purchased",
        capability_snapshot: ["telephony.assign_published_assistant"],
        number_metadata: {},
        control_plane: null,
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(telephonyMocks.getAdminTenantTelephonyPolicy).toHaveBeenCalledWith("tenant-1");
    });
    expect(telephonyMocks.getAdminTenantTelephonyPolicy).not.toHaveBeenCalledWith("tenant-2");
    expect(agentDefinitionMocks.listAdminTenantAgentDefinitions).not.toHaveBeenCalledWith("tenant-2");

    await waitFor(() => {
      expect(screen.getByText("+15551230000")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("number-actions-number-2"));

    await waitFor(() => {
      expect(telephonyMocks.getAdminTenantTelephonyPolicy).toHaveBeenCalledWith("tenant-2");
    });
    await waitFor(() => {
      expect(agentDefinitionMocks.listAdminTenantAgentDefinitions).toHaveBeenCalledWith("tenant-2");
    });
  });

  it("renders synced provider inventory and hides manual add when installed providers are already configured", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Primary Telnyx").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Provider accounts")).toBeTruthy();
    expect(screen.getAllByText("Connected").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Add provider" })).toBeNull();
  });

  it("renders a simplified provider table with only provider, inventory, status, and actions columns", async () => {
    telephonyMocks.listAdminTelephonyProviderAccounts.mockResolvedValue([
      {
        id: "provider-1",
        owner_scope: "deployment",
        owner_tenant_id: null,
        provider_kind: "telnyx",
        display_name: "Telnyx",
        status: "disconnected",
        capability_snapshot: ["telephony.connect_provider_account"],
        provider_metadata: {},
        control_plane: {
          last_tested_at: "2026-04-04T10:00:00Z",
          last_test_outcome: "failure",
          last_test_message: "Environment variable 'TELNYX_API_KEY' not set.",
          last_test_probe: "secret_ref.resolve",
        },
        credential_configured: true,
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    telephonyMocks.listAdminTelephonyTrunks.mockResolvedValue([]);
    telephonyMocks.listAdminTelephonyNumbers.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Telnyx").length).toBeGreaterThan(0);
    });

    const providerTable = screen.getAllByRole("table")[0]!;

    // Provider table has Provider, Trunks, Numbers, Status, Actions columns
    expect(within(providerTable).getByRole("columnheader", { name: "Provider" })).toBeTruthy();
    expect(within(providerTable).getByRole("columnheader", { name: "Trunks" })).toBeTruthy();
    expect(within(providerTable).getByRole("columnheader", { name: "Numbers" })).toBeTruthy();
    expect(within(providerTable).getByRole("columnheader", { name: "Status" })).toBeTruthy();
    expect(within(providerTable).getByRole("columnheader", { name: "Actions" })).toBeTruthy();
    expect(within(providerTable).queryByRole("columnheader", { name: "Ownership" })).toBeNull();
    expect(within(providerTable).queryByRole("columnheader", { name: "Capabilities" })).toBeNull();
    expect(within(providerTable).queryByRole("columnheader", { name: "Inventory" })).toBeNull();
    // Desktop table has "Sync inventory" button, mobile card has "Sync provider" button
    expect(screen.getByRole("button", { name: "Sync inventory" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sync provider" })).toBeTruthy();
    expect(screen.queryByText(/TELNYX_API_KEY/)).toBeNull();
    expect(screen.queryByText(/Environment variable/i)).toBeNull();
  });

  it("opens provider details from the provider list and saves provider edits", async () => {
    telephonyMocks.updateAdminTelephonyProviderAccount.mockResolvedValue({
      id: "provider-1",
      owner_scope: "deployment",
      owner_tenant_id: null,
      provider_kind: "telnyx",
      display_name: "Primary Telnyx 2",
      status: "connected",
      capability_snapshot: ["telephony.connect_provider_account", "telephony.sync_numbers"],
      provider_metadata: {},
      control_plane: {
        last_tested_at: "2026-04-04T10:00:00Z",
        last_test_outcome: "success",
        last_test_message: "Connected",
        last_test_probe: "provider.connectivity",
      },
      credential_configured: true,
      created_at: "2026-04-04T09:00:00Z",
      updated_at: "2026-04-04T10:10:00Z",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("telephony-provider-edit-desktop-provider-1")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("telephony-provider-edit-desktop-provider-1"));

    await waitFor(() => {
      expect(screen.getByTestId("admin-telephony-provider-form")).toBeTruthy();
    });

    expect(screen.getByRole("button", { name: "Test connection" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Refresh routes" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Refresh numbers" })).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("Example: Primary Telnyx"), {
      target: { value: "Primary Telnyx 2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save provider" }));

    await waitFor(() => {
      expect(telephonyMocks.updateAdminTelephonyProviderAccount).toHaveBeenCalledWith("provider-1", {
        display_name: "Primary Telnyx 2",
      });
    });
  });

  it("lets operators delete a provider account from the provider table", async () => {
    let providerAccountsState = [
      {
        id: "provider-1",
        owner_scope: "deployment",
        owner_tenant_id: null,
        provider_kind: "telnyx",
        display_name: "Primary Telnyx",
        status: "connected",
        can_delete: true,
        capability_snapshot: ["telephony.connect_provider_account", "telephony.sync_numbers"],
        provider_metadata: {},
        control_plane: {
          last_tested_at: "2026-04-04T10:00:00Z",
          last_test_outcome: "success",
          last_test_message: "Connected",
          last_test_probe: "provider.connectivity",
        },
        credential_configured: true,
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ];
    telephonyMocks.listAdminTelephonyProviderAccounts.mockImplementation(async () => providerAccountsState);
    telephonyMocks.deleteAdminTelephonyProviderAccount.mockImplementation(async (providerAccountId: string) => {
      providerAccountsState = providerAccountsState.filter((account) => account.id !== providerAccountId);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("telephony-provider-delete-provider-1")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("telephony-provider-delete-provider-1"));

    await waitFor(() => {
      expect(screen.getByTestId("telephony-provider-confirm-delete")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("telephony-provider-confirm-delete"));

    await waitFor(() => {
      expect(telephonyMocks.deleteAdminTelephonyProviderAccount).toHaveBeenCalledWith("provider-1");
    });
  });

  it("does not show delete for deployment-managed default providers", async () => {
    telephonyMocks.listAdminTelephonyProviderAccounts.mockResolvedValue([
      {
        id: "provider-1",
        owner_scope: "deployment",
        owner_tenant_id: null,
        provider_kind: "telnyx",
        display_name: "Telnyx",
        status: "connected",
        can_delete: false,
        capability_snapshot: ["telephony.connect_provider_account", "telephony.sync_numbers"],
        provider_metadata: {},
        control_plane: {
          last_tested_at: "2026-04-04T10:00:00Z",
          last_test_outcome: "success",
          last_test_message: "Connected",
          last_test_probe: "provider.connectivity",
        },
        credential_configured: true,
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Telnyx").length).toBeGreaterThan(0);
    });

    expect(screen.queryByTestId("telephony-provider-delete-provider-1")).toBeNull();
    expect(screen.queryByTestId("telephony-provider-delete-mobile-provider-1")).toBeNull();
  });

  it("creates a paused assignment for inventory numbers when the trunk is already routed", async () => {
    telephonyMocks.syncAdminTelephonyTrunks.mockResolvedValue({
      provider_account_id: "provider-1",
      synced_at: "2026-04-04T10:04:00Z",
      created_count: 0,
      updated_count: 1,
      trunks: [
        {
          id: "trunk-1",
          provider_account_id: "provider-1",
          display_name: "Inbound trunk",
          direction: "inbound",
          transport_kind: "sip",
          provider_resource_id: "resource-1",
          livekit_binding_id: "lk-trunk-1",
          status: "active",
          config: {},
          control_plane: null,
          created_at: "2026-04-04T09:00:00Z",
          updated_at: "2026-04-04T10:04:00Z",
        },
      ],
      message: "Imported provider trunks",
    });
    telephonyMocks.syncAdminTelephonyNumbers.mockResolvedValue({
      provider_account_id: "provider-1",
      synced_at: "2026-04-04T10:05:00Z",
      created_count: 0,
      updated_count: 1,
      released_count: 0,
      retained_assigned_count: 0,
      numbers: [
        {
          id: "number-1",
          provider_account_id: "provider-1",
          trunk_id: "trunk-1",
          e164_number: "+15551230000",
          provider_number_id: "telnyx-number-1",
          status: "assigned",
          source: "purchased",
          capability_snapshot: ["telephony.assign_published_assistant"],
          number_metadata: {},
          control_plane: null,
          created_at: "2026-04-04T09:00:00Z",
          updated_at: "2026-04-04T10:05:00Z",
        },
      ],
      message: "Imported provider numbers",
    });
    phoneNumberMocks.createAdminTenantPhoneChannel.mockResolvedValue({
      id: "binding-1",
      tenant_id: "tenant-1",
      phone_number: "+15551230000",
      sip_trunk_id: "lk-trunk-1",
      active: true,
      agent_definition_id: "agent-1",
      agent_name: "Appointment Intake",
      agent_status: "published",
      published_version: 3,
      routing_ready: true,
      created_at: "2026-04-04T10:05:00Z",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("+15551230000")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("number-actions-number-1"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Assign" }));

    await waitFor(() => {
      expect(phoneNumberMocks.createAdminTenantPhoneChannel).toHaveBeenCalledWith("tenant-1", {
        phone_number: "+15551230000",
        sip_trunk_id: "lk-trunk-1",
        agent_definition_id: "agent-1",
        active: false,
      });
    });
    expect(telephonyMocks.syncAdminTelephonyTrunks).not.toHaveBeenCalled();
    expect(telephonyMocks.syncAdminTelephonyNumbers).not.toHaveBeenCalled();
  });

  it("allows assigning an unbound provider-assigned number with active routing", async () => {
    telephonyMocks.listAdminTelephonyNumbers.mockResolvedValue([
      {
        id: "number-1",
        provider_account_id: "provider-1",
        trunk_id: "trunk-1",
        e164_number: "+15551230000",
        provider_number_id: "telnyx-number-1",
        status: "assigned",
        source: "purchased",
        capability_snapshot: ["telephony.assign_published_assistant"],
        number_metadata: {},
        control_plane: null,
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    phoneNumberMocks.createAdminTenantPhoneChannel.mockResolvedValue({
      id: "binding-assigned",
      tenant_id: "tenant-1",
      phone_number: "+15551230000",
      sip_trunk_id: "lk-trunk-1",
      active: true,
      agent_definition_id: "agent-1",
      agent_name: "Appointment Intake",
      agent_status: "published",
      published_version: 3,
      routing_ready: true,
      created_at: "2026-04-04T10:05:00Z",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("+15551230000")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("number-actions-number-1"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Assign" }));

    await waitFor(() => {
      expect(phoneNumberMocks.createAdminTenantPhoneChannel).toHaveBeenCalledWith("tenant-1", {
        phone_number: "+15551230000",
        sip_trunk_id: "lk-trunk-1",
        agent_definition_id: "agent-1",
        active: true,
      });
    });
    expect(telephonyMocks.syncAdminTelephonyTrunks).not.toHaveBeenCalled();
    expect(telephonyMocks.syncAdminTelephonyNumbers).not.toHaveBeenCalled();
  });

  it("repairs degraded routing before saving a bound number", async () => {
    telephonyMocks.listAdminTelephonyNumbers.mockResolvedValue([
      {
        id: "number-1",
        provider_account_id: "provider-1",
        trunk_id: "trunk-1",
        e164_number: "+15551230000",
        provider_number_id: "telnyx-number-1",
        status: "degraded",
        source: "purchased",
        capability_snapshot: ["telephony.assign_published_assistant"],
        number_metadata: {},
        control_plane: null,
        binding_summary: {
          id: "binding-1",
          tenant_id: "tenant-1",
          tenant_name: "Clinic One",
          tenant_slug: "clinic-one",
          sip_trunk_id: "lk-trunk-1",
          active: true,
          agent_definition_id: null,
          agent_name: null,
          agent_status: null,
          published_version: null,
          routing_ready: false,
          created_at: "2026-04-04T10:05:00Z",
        },
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    telephonyMocks.syncAdminTelephonyTrunks.mockResolvedValue({
      provider_account_id: "provider-1",
      synced_at: "2026-04-04T10:04:00Z",
      created_count: 0,
      updated_count: 1,
      trunks: [
        {
          id: "trunk-1",
          provider_account_id: "provider-1",
          display_name: "Inbound trunk",
          direction: "inbound",
          transport_kind: "sip",
          provider_resource_id: "resource-1",
          livekit_binding_id: "lk-trunk-1",
          status: "active",
          config: {},
          control_plane: null,
          created_at: "2026-04-04T09:00:00Z",
          updated_at: "2026-04-04T10:04:00Z",
        },
      ],
      message: "Imported provider trunks",
    });
    telephonyMocks.syncAdminTelephonyNumbers.mockResolvedValue({
      provider_account_id: "provider-1",
      synced_at: "2026-04-04T10:05:00Z",
      created_count: 0,
      updated_count: 1,
      released_count: 0,
      retained_assigned_count: 0,
      numbers: [
        {
          id: "number-1",
          provider_account_id: "provider-1",
          trunk_id: "trunk-1",
          e164_number: "+15551230000",
          provider_number_id: "telnyx-number-1",
          status: "assigned",
          source: "purchased",
          capability_snapshot: ["telephony.assign_published_assistant"],
          number_metadata: {},
          control_plane: null,
          binding_summary: {
            id: "binding-1",
            tenant_id: "tenant-1",
            tenant_name: "Clinic One",
            tenant_slug: "clinic-one",
            sip_trunk_id: "lk-trunk-1",
            active: true,
            agent_definition_id: null,
            agent_name: null,
            agent_status: null,
            published_version: null,
            routing_ready: false,
            created_at: "2026-04-04T10:05:00Z",
          },
          created_at: "2026-04-04T09:00:00Z",
          updated_at: "2026-04-04T10:05:00Z",
        },
      ],
      message: "Imported provider numbers",
    });
    phoneNumberMocks.updateAdminTenantPhoneChannel.mockResolvedValue({
      id: "binding-1",
      tenant_id: "tenant-1",
      phone_number: "+15551230000",
      sip_trunk_id: "lk-trunk-1",
      active: true,
      agent_definition_id: "agent-1",
      agent_name: "Appointment Intake",
      agent_status: "published",
      published_version: 3,
      routing_ready: true,
      created_at: "2026-04-04T10:05:00Z",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("+15551230000")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("number-actions-number-1"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    expect(screen.getByRole("button", { name: "Save assignment" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Release" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Assign" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Save assignment" }));

    await waitFor(() => {
      expect(phoneNumberMocks.updateAdminTenantPhoneChannel).toHaveBeenCalledWith("tenant-1", "binding-1", {
        phone_number: "+15551230000",
        sip_trunk_id: "lk-trunk-1",
        agent_definition_id: "agent-1",
        active: true,
      });
    });
  });

  it("shows a generic error when a number still cannot be prepared for assignment", async () => {
    telephonyMocks.listAdminTelephonyNumbers.mockResolvedValue([
      {
        id: "number-1",
        provider_account_id: "provider-1",
        trunk_id: "trunk-1",
        e164_number: "+15551230000",
        provider_number_id: "telnyx-number-1",
        status: "assigned",
        source: "purchased",
        capability_snapshot: ["telephony.assign_published_assistant"],
        number_metadata: {},
        control_plane: null,
        binding_summary: {
          id: "binding-1",
          tenant_id: "tenant-1",
          tenant_name: "Clinic One",
          tenant_slug: "clinic-one",
          sip_trunk_id: "lk-trunk-1",
          active: true,
          agent_definition_id: "agent-1",
          agent_name: "Appointment Intake",
          agent_status: "published",
          published_version: 3,
          routing_ready: false,
          created_at: "2026-04-04T10:05:00Z",
        },
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    telephonyMocks.listAdminTelephonyTrunks.mockResolvedValue([
      {
        id: "trunk-1",
        provider_account_id: "provider-1",
        display_name: "Inbound SIP",
        trunk_uri: "sip:inbound@example.com",
        status: "degraded",
        linked_number_count: 1,
        livekit_binding_id: "lk-trunk-1",
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    telephonyMocks.syncAdminTelephonyTrunks.mockResolvedValue({
      provider_account_id: "provider-1",
      synced_at: "2026-04-04T10:04:00Z",
      created_count: 0,
      updated_count: 1,
      trunks: [
        {
          id: "trunk-1",
          provider_account_id: "provider-1",
          display_name: "Inbound SIP",
          direction: "inbound",
          transport_kind: "sip",
          provider_resource_id: "resource-1",
          livekit_binding_id: "lk-trunk-1",
          status: "degraded",
          config: {},
          control_plane: null,
          created_at: "2026-04-04T09:00:00Z",
          updated_at: "2026-04-04T10:04:00Z",
        },
      ],
      message: "Imported provider trunks",
    });
    telephonyMocks.syncAdminTelephonyNumbers.mockResolvedValue({
      provider_account_id: "provider-1",
      synced_at: "2026-04-04T10:05:00Z",
      created_count: 0,
      updated_count: 1,
      released_count: 0,
      retained_assigned_count: 0,
      numbers: [
        {
          id: "number-1",
          provider_account_id: "provider-1",
          trunk_id: "trunk-1",
          e164_number: "+15551230000",
          provider_number_id: "telnyx-number-1",
          status: "assigned",
          source: "purchased",
          capability_snapshot: ["telephony.assign_published_assistant"],
          number_metadata: {},
          control_plane: null,
          binding_summary: {
            id: "binding-1",
            tenant_id: "tenant-1",
            tenant_name: "Clinic One",
            tenant_slug: "clinic-one",
            sip_trunk_id: "lk-trunk-1",
            active: true,
            agent_definition_id: "agent-1",
            agent_name: "Appointment Intake",
            agent_status: "published",
            published_version: 3,
            routing_ready: false,
            created_at: "2026-04-04T10:05:00Z",
          },
          created_at: "2026-04-04T09:00:00Z",
          updated_at: "2026-04-04T10:05:00Z",
        },
      ],
      message: "Imported provider numbers",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("+15551230000")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("number-actions-number-1"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    expect(screen.getByRole("button", { name: "Save assignment" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Release" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Assign" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Save assignment" }));

    await waitFor(() => {
      expect(screen.getByText("This number is not ready for assignment yet. Sync provider inventory and try again.")).toBeTruthy();
    });
  });

  it("remembers assignments created for a tenant chosen in the number editor modal", async () => {
    tenantMocks.listAdminTenants.mockResolvedValue([
      {
        id: "tenant-1",
        name: "Clinic One",
        slug: "clinic-one",
        status: "active",
        environment: "production",
        ui_locale: "en",
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
      {
        id: "tenant-2",
        name: "North Clinic",
        slug: "north-clinic",
        status: "active",
        environment: "production",
        ui_locale: "en",
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    telephonyMocks.getAdminTenantTelephonyPolicy.mockImplementation(async (tenantId: string) => ({
      tenant_id: tenantId,
      mode: "default_with_byo_override",
      allows_deployment_default: true,
      allows_tenant_byo: true,
      usable_provider_account_source: "deployment_default",
      deployment_provider_account_count: 1,
      tenant_provider_account_count: 0,
      updated_at: "2026-04-04T10:00:00Z",
    }));
    agentDefinitionMocks.listAdminTenantAgentDefinitions.mockImplementation(async (tenantId: string) => [
      {
        id: tenantId === "tenant-2" ? "agent-2" : "agent-1",
        tenant_id: tenantId,
        name: tenantId === "tenant-2" ? "North Intake" : "Appointment Intake",
        status: "published",
        published_version: tenantId === "tenant-2" ? 4 : 3,
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    phoneNumberMocks.listAdminTenantPhoneChannels.mockResolvedValue({ phone_channels: [] });
    phoneNumberMocks.createAdminTenantPhoneChannel.mockResolvedValue({
      id: "binding-2",
      tenant_id: "tenant-2",
      phone_number: "+15551230000",
      sip_trunk_id: "lk-trunk-1",
      active: true,
      agent_definition_id: "agent-2",
      agent_name: "North Intake",
      agent_status: "published",
      published_version: 4,
      routing_ready: true,
      created_at: "2026-04-04T10:05:00Z",
    });
    phoneNumberMocks.updateAdminTenantPhoneChannel.mockResolvedValue({
      id: "binding-2",
      tenant_id: "tenant-2",
      phone_number: "+15551230000",
      sip_trunk_id: "lk-trunk-1",
      active: true,
      agent_definition_id: "agent-2",
      agent_name: "North Intake",
      agent_status: "published",
      published_version: 4,
      routing_ready: true,
      created_at: "2026-04-04T10:05:00Z",
    });
    telephonyMocks.syncAdminTelephonyTrunks.mockResolvedValue({
      provider_account_id: "provider-1",
      synced_at: "2026-04-04T10:04:00Z",
      created_count: 0,
      updated_count: 1,
      trunks: [
        {
          id: "trunk-1",
          provider_account_id: "provider-1",
          display_name: "Inbound trunk",
          direction: "inbound",
          transport_kind: "sip",
          provider_resource_id: "resource-1",
          livekit_binding_id: "lk-trunk-1",
          status: "active",
          config: {},
          control_plane: null,
          created_at: "2026-04-04T09:00:00Z",
          updated_at: "2026-04-04T10:04:00Z",
        },
      ],
      message: "Imported provider trunks",
    });
    telephonyMocks.syncAdminTelephonyNumbers.mockResolvedValue({
      provider_account_id: "provider-1",
      synced_at: "2026-04-04T10:05:00Z",
      created_count: 0,
      updated_count: 1,
      released_count: 0,
      retained_assigned_count: 0,
      numbers: [
        {
          id: "number-1",
          provider_account_id: "provider-1",
          trunk_id: "trunk-1",
          e164_number: "+15551230000",
          provider_number_id: "telnyx-number-1",
          status: "assigned",
          source: "purchased",
          capability_snapshot: ["telephony.assign_published_assistant"],
          number_metadata: {},
          control_plane: null,
          created_at: "2026-04-04T09:00:00Z",
          updated_at: "2026-04-04T10:05:00Z",
        },
      ],
      message: "Imported provider numbers",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("+15551230000")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("number-actions-number-1"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByTestId("admin-telephony-number-tenant-select"));
    fireEvent.click(screen.getByText("North Clinic (north-clinic)"));

    await waitFor(() => {
      expect(agentDefinitionMocks.listAdminTenantAgentDefinitions).toHaveBeenCalledWith("tenant-2");
    });

    fireEvent.click(screen.getByRole("button", { name: "Assign" }));

    await waitFor(() => {
      expect(phoneNumberMocks.createAdminTenantPhoneChannel).toHaveBeenCalledWith("tenant-2", {
        phone_number: "+15551230000",
        sip_trunk_id: "lk-trunk-1",
        agent_definition_id: "agent-2",
        active: false,
      });
    });

    expect(phoneNumberMocks.createAdminTenantPhoneChannel).toHaveBeenCalledTimes(1);
  });

  it("only offers active tenants when assigning deployment-managed numbers", async () => {
    tenantMocks.listAdminTenants.mockResolvedValue([
      {
        id: "tenant-1",
        name: "Clinic One",
        slug: "clinic-one",
        status: "active",
        environment: "production",
        ui_locale: "en",
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
      {
        id: "tenant-2",
        name: "North Clinic",
        slug: "north-clinic",
        status: "suspended",
        environment: "production",
        ui_locale: "en",
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("+15551230000")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("number-actions-number-1"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByTestId("admin-telephony-number-tenant-select"));

    expect(screen.getAllByText("Clinic One (clinic-one)").length).toBeGreaterThan(0);
    expect(screen.queryByText("North Clinic (north-clinic)")).toBeNull();
  });

  it("blocks deployment-managed assignment when the selected tenant is BYO-only", async () => {
    telephonyMocks.getAdminTenantTelephonyPolicy.mockResolvedValue({
      tenant_id: "tenant-1",
      mode: "byo_only",
      allows_deployment_default: false,
      allows_tenant_byo: true,
      usable_provider_account_source: "none",
      deployment_provider_account_count: 1,
      tenant_provider_account_count: 0,
      updated_at: "2026-04-04T10:00:00Z",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("+15551230000")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("number-actions-number-1"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Assign" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "This tenant is BYO-only. Deployment-managed numbers stay blocked here because tenant-managed telephony is not self-serve in this workspace yet.",
        ),
      ).toBeTruthy();
    });
    expect(phoneNumberMocks.createAdminTenantPhoneChannel).not.toHaveBeenCalled();
  });

  it("lets operators add a managed provider when no account exists yet", async () => {
    telephonyMocks.listAdminTelephonyProviderAccounts.mockResolvedValue([]);
    telephonyMocks.listAdminTelephonyTrunks.mockResolvedValue([]);
    telephonyMocks.listAdminTelephonyNumbers.mockResolvedValue([]);
    telephonyMocks.listAdminTelephonyProviderOptions.mockResolvedValue([
      {
        provider_kind: "telnyx",
        display_name: "Telnyx",
        capability_matrix: [
          {
            capability: "telephony.connect_provider_account",
            enabled: true,
            notes: null,
          },
        ],
        operations: [
          {
            operation: "validate_account",
            mode: "managed",
            implemented: true,
            notes: null,
          },
        ],
      },
    ]);
    telephonyMocks.createAdminTelephonyProviderAccount.mockResolvedValue({
      id: "provider-telnyx",
      owner_scope: "deployment",
      owner_tenant_id: null,
      provider_kind: "telnyx",
      display_name: "Primary Telnyx",
      status: "draft",
      capability_snapshot: [
        "telephony.connect_provider_account",
        "telephony.sync_trunks",
        "telephony.sync_numbers",
      ],
      provider_metadata: {},
      control_plane: null,
      credential_configured: false,
      created_at: "2026-04-04T09:00:00Z",
      updated_at: "2026-04-04T10:00:00Z",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add provider" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Add provider" }));

    await waitFor(() => {
      expect(screen.getByTestId("admin-telephony-provider-form")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("combobox"));

    expect(screen.getByRole("option", { name: "Telnyx" })).toBeTruthy();
    fireEvent.click(screen.getByRole("option", { name: "Telnyx" }));
    fireEvent.change(screen.getByPlaceholderText("Example: Primary Telnyx"), {
      target: { value: "Primary Telnyx" },
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Add provider" }).at(-1)!);

    await waitFor(() => {
      expect(telephonyMocks.createAdminTelephonyProviderAccount).toHaveBeenCalledWith({
        provider_kind: "telnyx",
        display_name: "Primary Telnyx",
      });
    });
  });

  it("lets operators add an import-only provider with metadata", async () => {
    telephonyMocks.listAdminTelephonyProviderAccounts.mockResolvedValue([]);
    telephonyMocks.listAdminTelephonyTrunks.mockResolvedValue([]);
    telephonyMocks.listAdminTelephonyNumbers.mockResolvedValue([]);
    telephonyMocks.listAdminTelephonyProviderOptions.mockResolvedValue([
      {
        provider_kind: "genesys",
        display_name: "Genesys",
        capability_matrix: [
          {
            capability: "telephony.connect_provider_account",
            enabled: false,
            notes: "Import only",
          },
        ],
        operations: [
          {
            operation: "sync_trunks",
            mode: "import_only",
            implemented: true,
            notes: null,
          },
          {
            operation: "sync_numbers",
            mode: "import_only",
            implemented: true,
            notes: null,
          },
        ],
      },
    ]);
    telephonyMocks.createAdminTelephonyProviderAccount.mockResolvedValue({
      id: "provider-genesys",
      owner_scope: "deployment",
      owner_tenant_id: null,
      provider_kind: "genesys",
      display_name: "Primary Genesys",
      status: "draft",
      capability_snapshot: ["telephony.sync_trunks", "telephony.sync_numbers"],
      provider_metadata: {
        trunks: [],
        numbers: [],
      },
      control_plane: null,
      credential_configured: false,
      created_at: "2026-04-04T09:00:00Z",
      updated_at: "2026-04-04T10:00:00Z",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add provider" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Add provider" }));

    await waitFor(() => {
      expect(screen.getByTestId("admin-telephony-provider-form")).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText("Example: Primary Telnyx"), {
      target: { value: "Primary Genesys" },
    });
    fireEvent.change(screen.getByLabelText("Provider metadata JSON"), {
      target: { value: '{"trunks":[],"numbers":[]}' },
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Add provider" }).at(-1)!);

    await waitFor(() => {
      expect(telephonyMocks.createAdminTelephonyProviderAccount).toHaveBeenCalledWith({
        provider_kind: "genesys",
        display_name: "Primary Genesys",
        provider_metadata: {
          trunks: [],
          numbers: [],
        },
      });
    });
  });

  it("shows a generic failure notice when connect fails", async () => {
    telephonyMocks.listAdminTelephonyProviderAccounts.mockResolvedValue([
      {
        id: "provider-1",
        owner_scope: "deployment",
        owner_tenant_id: null,
        provider_kind: "telnyx",
        display_name: "Telnyx",
        status: "disconnected",
        capability_snapshot: ["telephony.connect_provider_account"],
        provider_metadata: {},
        control_plane: {
          last_tested_at: "2026-04-04T10:00:00Z",
          last_test_outcome: "failure",
          last_test_message: "Environment variable 'TELNYX_API_KEY' not set.",
          last_test_probe: "secret_ref.resolve",
        },
        credential_configured: true,
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    telephonyMocks.listAdminTelephonyTrunks.mockResolvedValue([]);
    telephonyMocks.listAdminTelephonyNumbers.mockResolvedValue([]);
    telephonyMocks.testAdminTelephonyProviderAccount.mockResolvedValue({
      provider_account: {
        id: "provider-1",
        owner_scope: "deployment",
        owner_tenant_id: null,
        provider_kind: "telnyx",
        display_name: "Telnyx",
        status: "disconnected",
        capability_snapshot: ["telephony.connect_provider_account"],
        provider_metadata: {},
        control_plane: null,
        credential_configured: true,
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
      tested_at: "2026-04-04T10:05:00Z",
      outcome: "failure",
      message: "Environment variable 'TELNYX_API_KEY' not set.",
      probe: "secret_ref.resolve",
      details: {},
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sync inventory" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Sync inventory" }));

    await waitFor(() => {
      expect(telephonyMocks.testAdminTelephonyProviderAccount).toHaveBeenCalledWith("provider-1");
    });
    expect(telephonyMocks.syncAdminTelephonyTrunks).not.toHaveBeenCalled();
    expect(telephonyMocks.syncAdminTelephonyNumbers).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText("Telnyx is not connected.")).toBeTruthy();
    });
    expect(screen.queryByText(/TELNYX_API_KEY/)).toBeNull();
  });

  it("updates the row status and inventory after a successful connect action", async () => {
    telephonyMocks.listAdminTelephonyProviderAccounts
      .mockResolvedValueOnce([
        {
          id: "provider-1",
          owner_scope: "deployment",
          owner_tenant_id: null,
          provider_kind: "telnyx",
          display_name: "Telnyx",
          status: "disconnected",
          capability_snapshot: ["telephony.connect_provider_account"],
          provider_metadata: {},
          control_plane: {
            last_tested_at: "2026-04-04T10:00:00Z",
            last_test_outcome: "failure",
            last_test_message: "Disconnected",
            last_test_probe: "provider.connectivity",
          },
          credential_configured: true,
          created_at: "2026-04-04T09:00:00Z",
          updated_at: "2026-04-04T10:00:00Z",
        },
      ])
      .mockResolvedValue([
        {
          id: "provider-1",
          owner_scope: "deployment",
          owner_tenant_id: null,
          provider_kind: "telnyx",
          display_name: "Telnyx",
          status: "connected",
          capability_snapshot: ["telephony.connect_provider_account"],
          provider_metadata: {},
          control_plane: {
            last_tested_at: "2026-04-04T10:05:00Z",
            last_test_outcome: "success",
            last_test_message: "Connected",
            last_test_probe: "provider.connectivity",
          },
          credential_configured: true,
          created_at: "2026-04-04T09:00:00Z",
          updated_at: "2026-04-04T10:05:00Z",
        },
      ]);
    telephonyMocks.listAdminTelephonyTrunks
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        {
          id: "trunk-1",
          provider_account_id: "provider-1",
          display_name: "Inbound trunk",
          direction: "inbound",
          transport_kind: "sip",
          provider_resource_id: "resource-1",
          livekit_binding_id: "lk-trunk-1",
          status: "active",
          config: {},
          control_plane: null,
          created_at: "2026-04-04T09:00:00Z",
          updated_at: "2026-04-04T10:10:00Z",
        },
      ]);
    telephonyMocks.listAdminTelephonyNumbers
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        {
          id: "number-1",
          provider_account_id: "provider-1",
          trunk_id: "trunk-1",
          e164_number: "+15551230000",
          provider_number_id: "telnyx-number-1",
          status: "inventory",
          source: "imported",
          capability_snapshot: ["telephony.assign_published_assistant"],
          number_metadata: {},
          control_plane: null,
          created_at: "2026-04-04T09:30:00Z",
          updated_at: "2026-04-04T10:10:00Z",
        },
      ]);
    telephonyMocks.testAdminTelephonyProviderAccount.mockResolvedValue({
      provider_account: {
        id: "provider-1",
        owner_scope: "deployment",
        owner_tenant_id: null,
        provider_kind: "telnyx",
        display_name: "Telnyx",
        status: "connected",
        capability_snapshot: ["telephony.connect_provider_account"],
        provider_metadata: {},
        control_plane: null,
        credential_configured: true,
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:05:00Z",
      },
      tested_at: "2026-04-04T10:05:00Z",
      outcome: "success",
      message: "Connected",
      probe: "provider.connectivity",
      details: {},
    });
    telephonyMocks.syncAdminTelephonyTrunks.mockResolvedValue({
      provider_account_id: "provider-1",
      synced_at: "2026-04-04T10:10:00Z",
      created_count: 1,
      updated_count: 0,
      trunks: [
        {
          id: "trunk-1",
          provider_account_id: "provider-1",
          display_name: "Inbound trunk",
          direction: "inbound",
          transport_kind: "sip",
          provider_resource_id: "resource-1",
          livekit_binding_id: "lk-trunk-1",
          status: "active",
          config: {},
          control_plane: null,
          created_at: "2026-04-04T09:00:00Z",
          updated_at: "2026-04-04T10:10:00Z",
        },
      ],
      message: "Imported provider trunks",
    });
    telephonyMocks.syncAdminTelephonyNumbers.mockResolvedValue({
      provider_account_id: "provider-1",
      synced_at: "2026-04-04T10:10:00Z",
      created_count: 1,
      updated_count: 0,
      released_count: 0,
      retained_assigned_count: 0,
      numbers: [
        {
          id: "number-1",
          provider_account_id: "provider-1",
          trunk_id: "trunk-1",
          e164_number: "+15551230000",
          provider_number_id: "telnyx-number-1",
          status: "inventory",
          source: "imported",
          capability_snapshot: ["telephony.assign_published_assistant"],
          number_metadata: {},
          control_plane: null,
          created_at: "2026-04-04T09:30:00Z",
          updated_at: "2026-04-04T10:10:00Z",
        },
      ],
      message: "Imported provider numbers",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sync inventory" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Sync inventory" }));

    await waitFor(() => {
      expect(telephonyMocks.testAdminTelephonyProviderAccount).toHaveBeenCalledWith("provider-1");
    });
    await waitFor(() => {
      expect(telephonyMocks.syncAdminTelephonyTrunks).toHaveBeenCalledWith("provider-1");
    });
    await waitFor(() => {
      expect(telephonyMocks.syncAdminTelephonyNumbers).toHaveBeenCalledWith("provider-1");
    });
    await waitFor(() => {
      expect(screen.getAllByText("Connected").length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(screen.getAllByText("1 trunks · 1 numbers").length).toBeGreaterThan(0);
    });
  });

  it("refreshes inventory without re-testing when the provider is already connected", async () => {
    telephonyMocks.listAdminTelephonyTrunks
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        {
          id: "trunk-1",
          provider_account_id: "provider-1",
          display_name: "Inbound trunk",
          direction: "inbound",
          transport_kind: "sip",
          provider_resource_id: "resource-1",
          livekit_binding_id: "lk-trunk-1",
          status: "active",
          config: {},
          control_plane: null,
          created_at: "2026-04-04T09:00:00Z",
          updated_at: "2026-04-04T10:10:00Z",
        },
      ]);
    telephonyMocks.listAdminTelephonyNumbers
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        {
          id: "number-1",
          provider_account_id: "provider-1",
          trunk_id: "trunk-1",
          e164_number: "+15551230000",
          provider_number_id: "telnyx-number-1",
          status: "inventory",
          source: "imported",
          capability_snapshot: ["telephony.assign_published_assistant"],
          number_metadata: {},
          control_plane: null,
          created_at: "2026-04-04T09:30:00Z",
          updated_at: "2026-04-04T10:10:00Z",
        },
      ]);
    telephonyMocks.syncAdminTelephonyTrunks.mockResolvedValue({
      provider_account_id: "provider-1",
      synced_at: "2026-04-04T10:10:00Z",
      created_count: 1,
      updated_count: 0,
      trunks: [],
      message: "Imported provider trunks",
    });
    telephonyMocks.syncAdminTelephonyNumbers.mockResolvedValue({
      provider_account_id: "provider-1",
      synced_at: "2026-04-04T10:10:00Z",
      created_count: 1,
      updated_count: 0,
      released_count: 0,
      retained_assigned_count: 0,
      numbers: [],
      message: "Imported provider numbers",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sync inventory" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Sync inventory" }));

    await waitFor(() => {
      expect(telephonyMocks.syncAdminTelephonyTrunks).toHaveBeenCalledWith("provider-1");
    });
    await waitFor(() => {
      expect(telephonyMocks.syncAdminTelephonyNumbers).toHaveBeenCalledWith("provider-1");
    });
    expect(telephonyMocks.testAdminTelephonyProviderAccount).not.toHaveBeenCalled();
  });

  it("syncs import-only providers without forcing a connectivity test first", async () => {
    telephonyMocks.listAdminTelephonyProviderOptions.mockResolvedValue([
      {
        provider_kind: "genesys",
        display_name: "Genesys",
        capability_matrix: [
          {
            capability: "telephony.connect_provider_account",
            enabled: false,
            notes: null,
          },
        ],
        operations: [
          {
            operation: "validate_account",
            mode: "managed",
            implemented: false,
            notes: "Not implemented.",
          },
          {
            operation: "sync_trunks",
            mode: "import_only",
            implemented: true,
            notes: "Imports trunk inventory from provider metadata.",
          },
          {
            operation: "sync_numbers",
            mode: "import_only",
            implemented: true,
            notes: "Imports number inventory from provider metadata.",
          },
        ],
      },
    ]);
    telephonyMocks.listAdminTelephonyProviderAccounts.mockResolvedValue([
      {
        id: "provider-genesys",
        owner_scope: "deployment",
        owner_tenant_id: null,
        provider_kind: "genesys",
        display_name: "Genesys",
        status: "disconnected",
        capability_snapshot: ["telephony.sync_trunks", "telephony.sync_numbers"],
        provider_metadata: { trunks: [], numbers: [] },
        control_plane: null,
        credential_configured: false,
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    telephonyMocks.listAdminTelephonyTrunks.mockResolvedValue([]);
    telephonyMocks.listAdminTelephonyNumbers.mockResolvedValue([]);
    telephonyMocks.syncAdminTelephonyTrunks.mockResolvedValue({
      provider_account_id: "provider-genesys",
      synced_at: "2026-04-04T10:10:00Z",
      created_count: 0,
      updated_count: 0,
      trunks: [],
      message: "Imported provider trunks",
    });
    telephonyMocks.syncAdminTelephonyNumbers.mockResolvedValue({
      provider_account_id: "provider-genesys",
      synced_at: "2026-04-04T10:10:00Z",
      created_count: 0,
      updated_count: 0,
      released_count: 0,
      retained_assigned_count: 0,
      numbers: [],
      message: "Imported provider numbers",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sync inventory" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Sync inventory" }));

    await waitFor(() => {
      expect(telephonyMocks.syncAdminTelephonyTrunks).toHaveBeenCalledWith("provider-genesys");
    });
    await waitFor(() => {
      expect(telephonyMocks.syncAdminTelephonyNumbers).toHaveBeenCalledWith("provider-genesys");
    });
    expect(telephonyMocks.testAdminTelephonyProviderAccount).not.toHaveBeenCalled();
  });

  it("uses number binding summaries instead of crawling every tenant for assigned numbers", async () => {
    tenantMocks.listAdminTenants.mockResolvedValue([
      {
        id: "tenant-1",
        name: "Clinic One",
        slug: "clinic-one",
        status: "active",
        environment: "production",
        ui_locale: "en",
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
      {
        id: "tenant-2",
        name: "North Clinic",
        slug: "north-clinic",
        status: "active",
        environment: "production",
        ui_locale: "en",
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
      {
        id: "tenant-3",
        name: "South Clinic",
        slug: "south-clinic",
        status: "active",
        environment: "production",
        ui_locale: "en",
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    telephonyMocks.listAdminTelephonyNumbers.mockResolvedValue([
      {
        id: "number-1",
        provider_account_id: "provider-1",
        trunk_id: "trunk-1",
        e164_number: "+15551239999",
        provider_number_id: "telnyx-number-1",
        status: "assigned",
        source: "purchased",
        capability_snapshot: ["telephony.assign_published_assistant"],
        number_metadata: {},
        control_plane: null,
        binding_summary: {
          id: "binding-1",
          tenant_id: "tenant-2",
          tenant_name: "North Clinic",
          tenant_slug: "north-clinic",
          sip_trunk_id: "lk-trunk-1",
          active: true,
          agent_definition_id: "agent-2",
          agent_name: "North Intake",
          agent_status: "published",
          published_version: 4,
          routing_ready: true,
          created_at: "2026-04-04T10:05:00Z",
        },
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    telephonyMocks.getAdminTenantTelephonyPolicy.mockImplementation(async (tenantId: string) => ({
      tenant_id: tenantId,
      mode: "default_with_byo_override",
      allows_deployment_default: true,
      allows_tenant_byo: true,
      usable_provider_account_source: "deployment_default",
      deployment_provider_account_count: 1,
      tenant_provider_account_count: 0,
      updated_at: "2026-04-04T10:00:00Z",
    }));
    agentDefinitionMocks.listAdminTenantAgentDefinitions.mockImplementation(async (tenantId: string) => [
      {
        id: tenantId === "tenant-2" ? "agent-2" : "agent-1",
        tenant_id: tenantId,
        name: tenantId === "tenant-2" ? "North Intake" : "Appointment Intake",
        status: "published",
        published_version: tenantId === "tenant-2" ? 4 : 3,
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    phoneNumberMocks.listAdminTenantPhoneChannels.mockImplementation(async (tenantId: string) => ({
      phone_channels: tenantId === "tenant-2"
        ? [
            {
              id: "binding-1",
              tenant_id: "tenant-2",
              phone_number: "+15551239999",
              sip_trunk_id: "lk-trunk-1",
              active: true,
              agent_definition_id: "agent-2",
              agent_name: "North Intake",
              agent_status: "published",
              published_version: 4,
              routing_ready: true,
              created_at: "2026-04-04T10:05:00Z",
            },
          ]
        : [],
    }));

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("North Clinic").length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(phoneNumberMocks.listAdminTenantPhoneChannels).toHaveBeenCalledTimes(1);
    });

    expect(phoneNumberMocks.listAdminTenantPhoneChannels).toHaveBeenCalledWith("tenant-1");
    expect(phoneNumberMocks.listAdminTenantPhoneChannels).not.toHaveBeenCalledWith("tenant-2");
    expect(phoneNumberMocks.listAdminTenantPhoneChannels).not.toHaveBeenCalledWith("tenant-3");
  });

  it("treats an existing route summary from another tenant as occupied instead of free", async () => {
    telephonyMocks.listAdminTelephonyNumbers.mockResolvedValue([
      {
        id: "number-other-tenant-occupied",
        provider_account_id: "provider-1",
        trunk_id: "trunk-1",
        e164_number: "+15551237770",
        provider_number_id: "telnyx-number-other-tenant",
        status: "assigned",
        source: "imported",
        capability_snapshot: ["telephony.assign_published_assistant"],
        number_metadata: {},
        control_plane: null,
        binding_summary: {
          id: "route-2",
          tenant_id: "tenant-2",
          tenant_name: "North Clinic",
          tenant_slug: "north-clinic",
          sip_trunk_id: "shared-route",
          active: true,
          agent_definition_id: "agent-2",
          agent_name: "North Intake",
          agent_status: "published",
          published_version: 4,
          routing_ready: true,
          created_at: "2026-04-04T10:05:00Z",
        },
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    phoneNumberMocks.listAdminTenantPhoneChannels.mockResolvedValue({ phone_channels: [] });

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("North Clinic").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByTestId("number-actions-number-other-tenant-occupied"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    expect(screen.getByRole("button", { name: "Release" })).toBeTruthy();
    expect((screen.getByTestId("admin-telephony-number-tenant-select") as HTMLButtonElement).disabled).toBe(true);
  });
});
