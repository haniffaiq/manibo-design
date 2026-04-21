"use client";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const telephonyMocks = vi.hoisted(() => ({
  listAdminTelephonyProviderOptions: vi.fn(),
  listAdminTelephonyProviderAccounts: vi.fn(),
  listAdminTelephonyTrunks: vi.fn(),
  listAdminTelephonyNumbers: vi.fn(),
  getAdminTenantTelephonyPolicy: vi.fn(),
  syncAdminTelephonyTrunks: vi.fn(),
  syncAdminTelephonyNumbers: vi.fn(),
}));

const tenantMocks = vi.hoisted(() => ({
  listAdminTenants: vi.fn(),
}));

const phoneChannelMocks = vi.hoisted(() => ({
  listAdminTenantPhoneChannels: vi.fn(),
  createAdminTenantPhoneChannel: vi.fn(),
  updateAdminTenantPhoneChannel: vi.fn(),
  deleteAdminTenantPhoneChannel: vi.fn(),
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
  createAdminTelephonyProviderAccount: vi.fn(),
  updateAdminTelephonyProviderAccount: vi.fn(),
  testAdminTelephonyProviderAccount: vi.fn(),
  syncAdminTelephonyTrunks: telephonyMocks.syncAdminTelephonyTrunks,
  syncAdminTelephonyNumbers: telephonyMocks.syncAdminTelephonyNumbers,
  deleteAdminTelephonyProviderAccount: vi.fn(),
}));

vi.mock("@/lib/api/tenants", () => ({
  listAdminTenants: tenantMocks.listAdminTenants,
}));

vi.mock("@/lib/api/phone-numbers", () => ({
  listAdminTenantPhoneChannels: phoneChannelMocks.listAdminTenantPhoneChannels,
  createAdminTenantPhoneChannel: phoneChannelMocks.createAdminTenantPhoneChannel,
  updateAdminTenantPhoneChannel: phoneChannelMocks.updateAdminTenantPhoneChannel,
  deleteAdminTenantPhoneChannel: phoneChannelMocks.deleteAdminTenantPhoneChannel,
  listAdminTenantPhoneNumbers: vi.fn(),
  createAdminTenantPhoneNumber: phoneChannelMocks.createAdminTenantPhoneChannel,
  updateAdminTenantPhoneNumber: phoneChannelMocks.updateAdminTenantPhoneChannel,
  deleteAdminTenantPhoneNumber: phoneChannelMocks.deleteAdminTenantPhoneChannel,
}));

vi.mock("@/lib/api/admin-agent-definitions", () => ({
  listAdminTenantAgentDefinitions: agentDefinitionMocks.listAdminTenantAgentDefinitions,
}));

vi.mock("@/components/admin-telephony-number-table", () => ({
  AdminTelephonyNumberTable: ({ rows, onSelectRow }: {
    rows: { id: string; phoneNumber: string; tenantLabel: string }[];
    onSelectRow: (row: { id: string; phoneNumber: string; tenantLabel: string }) => void;
  }) => (
    <table>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.phoneNumber}</td>
            <td>{row.tenantLabel}</td>
            <td>
              <button data-testid={`number-actions-${row.id}`} onClick={() => onSelectRow(row)}>
                Edit assignment
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

import AdminTelephonyPage from "@/app/(deployment)/admin/telephony/page";

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 }}>
      <AdminTelephonyPage />
    </SWRConfig>,
  );
}

describe("admin telephony routing toggle", () => {
  beforeEach(() => {
    navigationMocks.searchParams = "";

    telephonyMocks.listAdminTelephonyProviderOptions.mockResolvedValue([
      {
        provider_kind: "telnyx",
        display_name: "Telnyx",
        capability_matrix: [],
        operations: [],
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
        capability_snapshot: [],
        provider_metadata: {},
        control_plane: null,
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
          routing_ready: true,
          created_at: "2026-04-04T10:05:00Z",
        },
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
    phoneChannelMocks.listAdminTenantPhoneChannels.mockResolvedValue({
      phone_channels: [
        {
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
        },
      ],
    });
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
  });

  it("lets operators pause an existing bound number from the telephony workspace", async () => {
    phoneChannelMocks.updateAdminTenantPhoneChannel.mockResolvedValue({
      id: "binding-1",
      tenant_id: "tenant-1",
      phone_number: "+15551230000",
      sip_trunk_id: "lk-trunk-1",
      active: false,
      agent_definition_id: "agent-1",
      agent_name: "Appointment Intake",
      agent_status: "published",
      published_version: 3,
      routing_ready: false,
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

    const toggle = screen.getByRole("switch", { name: "Live routing" });
    expect(toggle.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Save assignment" }));

    await waitFor(() => {
      expect(phoneChannelMocks.updateAdminTenantPhoneChannel).toHaveBeenCalledWith("tenant-1", "binding-1", {
        phone_number: "+15551230000",
        sip_trunk_id: "lk-trunk-1",
        agent_definition_id: "agent-1",
        active: false,
      });
    });
  });

  it("pauses a degraded bound number without forcing a routing repair", async () => {
    telephonyMocks.listAdminTelephonyTrunks.mockResolvedValue([
      {
        id: "trunk-1",
        provider_account_id: "provider-1",
        display_name: "Inbound trunk",
        direction: "inbound",
        transport_kind: "sip",
        provider_resource_id: "resource-1",
        livekit_binding_id: "",
        status: "degraded",
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
    phoneChannelMocks.updateAdminTenantPhoneChannel.mockResolvedValue({
      id: "binding-1",
      tenant_id: "tenant-1",
      phone_number: "+15551230000",
      sip_trunk_id: "lk-trunk-1",
      active: false,
      agent_definition_id: "agent-1",
      agent_name: "Appointment Intake",
      agent_status: "published",
      published_version: 3,
      routing_ready: false,
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

    const toggle = screen.getByRole("switch", { name: "Live routing" });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Save assignment" }));

    await waitFor(() => {
      expect(phoneChannelMocks.updateAdminTenantPhoneChannel).toHaveBeenCalledWith("tenant-1", "binding-1", {
        phone_number: "+15551230000",
        sip_trunk_id: "lk-trunk-1",
        agent_definition_id: "agent-1",
        active: false,
      });
    });
    expect(telephonyMocks.syncAdminTelephonyTrunks).not.toHaveBeenCalled();
    expect(telephonyMocks.syncAdminTelephonyNumbers).not.toHaveBeenCalled();
  });

  it("keeps live routing disabled for inventory-only numbers and saves them paused", async () => {
    telephonyMocks.listAdminTelephonyNumbers.mockResolvedValue([
      {
        id: "number-2",
        provider_account_id: "provider-1",
        trunk_id: "trunk-1",
        e164_number: "+15551230001",
        provider_number_id: "telnyx-number-2",
        status: "available",
        source: "purchased",
        capability_snapshot: ["telephony.assign_published_assistant"],
        number_metadata: {},
        control_plane: null,
        binding_summary: null,
        created_at: "2026-04-04T09:00:00Z",
        updated_at: "2026-04-04T10:00:00Z",
      },
    ]);
    phoneChannelMocks.listAdminTenantPhoneChannels.mockResolvedValue({ phone_channels: [] });
    phoneChannelMocks.createAdminTenantPhoneChannel.mockResolvedValue({
      id: "binding-2",
      tenant_id: "tenant-1",
      phone_number: "+15551230001",
      sip_trunk_id: "lk-trunk-1",
      active: false,
      agent_definition_id: "agent-1",
      agent_name: "Appointment Intake",
      agent_status: "published",
      published_version: 3,
      routing_ready: false,
      created_at: "2026-04-04T10:05:00Z",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("+15551230001")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("number-actions-number-2"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    const toggle = screen.getByRole("switch", { name: "Live routing" });
    expect(toggle.hasAttribute("data-disabled")).toBe(true);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Assign" }));

    await waitFor(() => {
      expect(phoneChannelMocks.createAdminTenantPhoneChannel).toHaveBeenCalledWith("tenant-1", {
        phone_number: "+15551230001",
        sip_trunk_id: "lk-trunk-1",
        agent_definition_id: "agent-1",
        active: false,
      });
    });
  });
});
