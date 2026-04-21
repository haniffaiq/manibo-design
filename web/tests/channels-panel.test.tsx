"use client";

import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const telephonyMocks = vi.hoisted(() => ({
  listAdminTelephonyNumbers: vi.fn(),
  listAdminTelephonyTrunks: vi.fn(),
  listAdminTelephonyProviderAccounts: vi.fn(),
  getAdminTenantTelephonyPolicy: vi.fn(),
}));

const phoneNumberMocks = vi.hoisted(() => ({
  listAdminTenantPhoneChannels: vi.fn(),
  listAdminTenantPhoneNumbers: vi.fn(),
  createAdminTenantPhoneChannel: vi.fn(),
  createAdminTenantPhoneNumber: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api/admin-telephony", () => ({
  listAdminTelephonyNumbers: telephonyMocks.listAdminTelephonyNumbers,
  listAdminTelephonyTrunks: telephonyMocks.listAdminTelephonyTrunks,
  listAdminTelephonyProviderAccounts: telephonyMocks.listAdminTelephonyProviderAccounts,
  getAdminTenantTelephonyPolicy: telephonyMocks.getAdminTenantTelephonyPolicy,
}));

vi.mock("@/lib/api/phone-numbers", () => ({
  listAdminTenantPhoneChannels: phoneNumberMocks.listAdminTenantPhoneChannels,
  listAdminTenantPhoneNumbers: phoneNumberMocks.listAdminTenantPhoneNumbers,
  createAdminTenantPhoneChannel: phoneNumberMocks.createAdminTenantPhoneChannel,
  createAdminTenantPhoneNumber: phoneNumberMocks.createAdminTenantPhoneNumber,
}));

import { ChannelsPanel } from "@/app/(deployment)/admin/agent-definitions/[id]/channels-panel";
import type { TelephonyNumberView } from "@/lib/api/admin-telephony";

function renderPanel() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 }}>
      <ChannelsPanel
        tenantId="tenant-1"
        definitionId="agent-1"
        assistantName="clinic_registrator"
        assistantStatus="published"
      />
    </SWRConfig>,
  );
}

let telephonyNumberState: TelephonyNumberView[] = [];
let tenantPhoneNumberState: {
  id: string;
  tenant_id: string;
  phone_number: string;
  sip_trunk_id: string;
  active: boolean;
  agent_definition_id: string | null;
  agent_name: string | null;
  agent_status: string | null;
  published_version: number | null;
  routing_ready: boolean;
  created_at: string;
}[] = [];

beforeEach(() => {
  telephonyNumberState = [
    {
      id: "number-live",
      provider_account_id: "provider-1",
      trunk_id: "trunk-1",
      e164_number: "+15551230001",
      provider_number_id: "provider-number-live",
      status: "assigned",
      source: "purchased",
      capability_snapshot: ["telephony.assign_published_assistant"],
      number_metadata: {},
      control_plane: null,
      binding_summary: {
        id: "binding-live",
        tenant_id: "tenant-1",
        tenant_name: "Clinic One",
        tenant_slug: "clinic-one",
        sip_trunk_id: "lk-trunk-1",
        active: true,
        agent_definition_id: "agent-1",
        agent_name: "clinic_registrator",
        agent_status: "published",
        published_version: 1,
        routing_ready: true,
        created_at: "2026-04-04T10:00:00Z",
      },
      created_at: "2026-04-04T09:00:00Z",
      updated_at: "2026-04-04T10:00:00Z",
    },
    {
      id: "number-unassigned",
      provider_account_id: "provider-1",
      trunk_id: "trunk-1",
      e164_number: "+15551230002",
      provider_number_id: "provider-number-unassigned",
      status: "assigned",
      source: "imported",
      capability_snapshot: ["telephony.assign_published_assistant"],
      number_metadata: {},
      control_plane: null,
      binding_summary: null,
      created_at: "2026-04-04T09:30:00Z",
      updated_at: "2026-04-04T10:00:00Z",
    },
  ];
  tenantPhoneNumberState = [
    {
      id: "binding-live",
      tenant_id: "tenant-1",
      phone_number: "+15551230001",
      sip_trunk_id: "lk-trunk-1",
      active: true,
      agent_definition_id: "agent-1",
      agent_name: "clinic_registrator",
      agent_status: "published",
      published_version: 1,
      routing_ready: true,
      created_at: "2026-04-04T10:00:00Z",
    },
  ];
  phoneNumberMocks.listAdminTenantPhoneChannels.mockImplementation(async () => ({
    phone_channels: tenantPhoneNumberState,
  }));
  phoneNumberMocks.listAdminTenantPhoneNumbers.mockImplementation(async () => ({
    phone_numbers: tenantPhoneNumberState,
  }));
  phoneNumberMocks.createAdminTenantPhoneChannel.mockImplementation(
    phoneNumberMocks.createAdminTenantPhoneNumber,
  );

  telephonyMocks.listAdminTelephonyNumbers.mockImplementation(async () => telephonyNumberState);
  telephonyMocks.listAdminTelephonyTrunks.mockResolvedValue([
    {
      id: "trunk-1",
      provider_account_id: "provider-1",
      display_name: "Inbound route",
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
      control_plane: null,
      credential_configured: true,
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
  phoneNumberMocks.createAdminTenantPhoneNumber.mockImplementation(async (_tenantId: string, payload: {
    phone_number: string;
    sip_trunk_id: string;
    agent_definition_id: string;
    active: boolean;
  }) => {
    telephonyNumberState = telephonyNumberState.map((number) =>
      number.e164_number === payload.phone_number
        ? {
            ...number,
            binding_summary: {
              id: "binding-created",
              tenant_id: "tenant-1",
              tenant_name: "Clinic One",
              tenant_slug: "clinic-one",
              sip_trunk_id: payload.sip_trunk_id,
              active: payload.active,
              agent_definition_id: payload.agent_definition_id,
              agent_name: "clinic_registrator",
              agent_status: "published",
              published_version: 1,
              routing_ready: payload.active,
              created_at: "2026-04-04T10:15:00Z",
            },
          }
        : number,
    );
    tenantPhoneNumberState = [
      ...tenantPhoneNumberState,
      {
        id: "binding-created",
        tenant_id: "tenant-1",
        phone_number: payload.phone_number,
        sip_trunk_id: payload.sip_trunk_id,
        active: payload.active,
        agent_definition_id: payload.agent_definition_id,
        agent_name: "clinic_registrator",
        agent_status: "published",
        published_version: 1,
        routing_ready: payload.active,
        created_at: "2026-04-04T10:15:00Z",
      },
    ];
    return {
      id: "binding-created",
      tenant_id: "tenant-1",
      phone_number: payload.phone_number,
      sip_trunk_id: payload.sip_trunk_id,
      active: payload.active,
      agent_definition_id: payload.agent_definition_id,
      agent_name: "clinic_registrator",
      agent_status: "published",
      published_version: 1,
      routing_ready: payload.active,
      created_at: "2026-04-04T10:15:00Z",
    };
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ChannelsPanel", () => {
  it("shows attached channels, keeps the telephony deep link, and attaches an existing number", async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText("+15551230001")).toBeTruthy();
    });

    expect(screen.getByRole("link", { name: "Open Telephony" }).getAttribute("href")).toBe(
      "/admin/telephony?tab=numbers&tenant_id=tenant-1&assistant_id=agent-1#numbers",
    );

    fireEvent.click(screen.getByRole("button", { name: "Attach existing number" }));

    await waitFor(() => {
      expect(screen.getByTestId("admin-telephony-number-picker")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("admin-telephony-number-picker-option-number-unassigned"));
    fireEvent.click(screen.getByRole("button", { name: "Attach number" }));

    await waitFor(() => {
      expect(phoneNumberMocks.createAdminTenantPhoneChannel).toHaveBeenCalledWith("tenant-1", {
        phone_number: "+15551230002",
        sip_trunk_id: "lk-trunk-1",
        agent_definition_id: "agent-1",
        active: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Attached +15551230002.")).toBeTruthy();
    });
  });

  it("shows existing tenant phone-number bindings even when telephony inventory does not mirror them yet", async () => {
    telephonyNumberState = [];
    tenantPhoneNumberState = [
      {
        id: "legacy-binding",
        tenant_id: "tenant-1",
        phone_number: "+15551239999",
        sip_trunk_id: "lk-trunk-1",
        active: true,
        agent_definition_id: "agent-1",
        agent_name: "clinic_registrator",
        agent_status: "published",
        published_version: 1,
        routing_ready: true,
        created_at: "2026-04-04T10:05:00Z",
      },
    ];

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText("+15551239999")).toBeTruthy();
    });
  });

  it("keeps deployment-managed attach blocked for BYO-only tenants", async () => {
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

    renderPanel();

    await waitFor(() => {
      expect(
        screen.getByText(
          "This tenant is BYO-only. Deployment-managed numbers stay blocked here because tenant-managed telephony is not self-serve in this workspace yet.",
        ),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Attach existing number" }));

    await waitFor(() => {
      expect(screen.getByTestId("admin-telephony-number-picker")).toBeTruthy();
    });

    expect((screen.getByRole("button", { name: "Attach number" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
