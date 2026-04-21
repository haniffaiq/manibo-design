"use client";

import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  pathname: "/admin/channels",
  replace: vi.fn(),
  searchParams: "",
}));

const tenantMocks = vi.hoisted(() => ({
  listAdminTenants: vi.fn(),
}));

const phoneNumberMocks = vi.hoisted(() => ({
  listAdminTenantPhoneChannels: vi.fn(),
  listAdminTenantPhoneNumbers: vi.fn(),
  updateAdminTenantPhoneChannel: vi.fn(),
  updateAdminTenantPhoneNumber: vi.fn(),
}));

const agentDefinitionMocks = vi.hoisted(() => ({
  listAdminTenantAgentDefinitions: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
  useRouter: () => ({ replace: navigationMocks.replace }),
  useSearchParams: () => new URLSearchParams(navigationMocks.searchParams),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api/tenants", () => ({
  listAdminTenants: tenantMocks.listAdminTenants,
}));

vi.mock("@/lib/api/phone-numbers", () => ({
  listAdminTenantPhoneChannels: phoneNumberMocks.listAdminTenantPhoneChannels,
  listAdminTenantPhoneNumbers: phoneNumberMocks.listAdminTenantPhoneNumbers,
  updateAdminTenantPhoneChannel: phoneNumberMocks.updateAdminTenantPhoneChannel,
  updateAdminTenantPhoneNumber: phoneNumberMocks.updateAdminTenantPhoneNumber,
}));

vi.mock("@/lib/api/admin-agent-definitions", () => ({
  listAdminTenantAgentDefinitions: agentDefinitionMocks.listAdminTenantAgentDefinitions,
}));

import AdminPhoneNumbersPage from "@/app/(deployment)/admin/channels/page";

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 }}>
      <AdminPhoneNumbersPage />
    </SWRConfig>,
  );
}

beforeEach(() => {
  navigationMocks.pathname = "/admin/channels";
  navigationMocks.replace.mockReset();
  navigationMocks.searchParams = "tenant_id=tenant-1";
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
  phoneNumberMocks.listAdminTenantPhoneChannels.mockResolvedValue({
    phone_channels: [
      {
        id: "binding-1",
        tenant_id: "tenant-1",
        phone_number: "+15551230001",
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
  phoneNumberMocks.listAdminTenantPhoneNumbers.mockResolvedValue({
    phone_numbers: [
      {
        id: "binding-1",
        tenant_id: "tenant-1",
        phone_number: "+15551230001",
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
  phoneNumberMocks.updateAdminTenantPhoneChannel.mockResolvedValue({
    id: "binding-1",
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
  phoneNumberMocks.updateAdminTenantPhoneNumber.mockResolvedValue({
    id: "binding-1",
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

describe("AdminPhoneNumbersPage", () => {
  it("routes add and rebind work into Telephony instead of showing manual entry fields", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Phone channels")).toBeTruthy();
    });

    const telephonyLink = screen.getByTestId("admin-phone-open-telephony");
    expect(telephonyLink.getAttribute("href")).toBe("/admin/telephony?tab=numbers&tenant_id=tenant-1#numbers");
    expect(screen.queryByTestId("admin-phone-number-input")).toBeNull();
    expect(screen.queryByTestId("admin-phone-sip-trunk-input")).toBeNull();
    expect(screen.queryByTestId("admin-phone-detail-sip-trunk-input")).toBeNull();
    expect(screen.queryByText("None (disable inbound)")).toBeNull();
  });

  it("saves assistant routing state without reposting raw phone or trunk values", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("admin-phone-detail-active-checkbox")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("admin-phone-detail-active-checkbox"));
    fireEvent.click(screen.getByTestId("admin-phone-detail-submit"));

    await waitFor(() => {
      expect(phoneNumberMocks.updateAdminTenantPhoneChannel).toHaveBeenCalledWith(
        "tenant-1",
        "binding-1",
        {
          active: false,
          agent_definition_id: "agent-1",
        },
      );
    });
    expect(phoneNumberMocks.updateAdminTenantPhoneChannel).not.toHaveBeenCalledWith(
      "tenant-1",
      "binding-1",
      expect.objectContaining({
        phone_number: expect.anything(),
      }),
    );
    expect(phoneNumberMocks.updateAdminTenantPhoneChannel).not.toHaveBeenCalledWith(
      "tenant-1",
      "binding-1",
      expect.objectContaining({
        sip_trunk_id: expect.anything(),
      }),
    );
  });

  it("keeps unassigned channels disabled until an assistant is selected", async () => {
    phoneNumberMocks.listAdminTenantPhoneChannels.mockResolvedValue({
      phone_channels: [
        {
          id: "binding-2",
          tenant_id: "tenant-1",
          phone_number: "+15551230002",
          sip_trunk_id: "lk-trunk-2",
          active: true,
          agent_definition_id: null,
          agent_name: null,
          agent_status: null,
          published_version: null,
          routing_ready: false,
          created_at: "2026-04-04T10:06:00Z",
        },
      ],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("admin-phone-detail-submit")).toBeTruthy();
    });

    expect((screen.getByTestId("admin-phone-detail-submit") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("admin-phone-toggle-selected") as HTMLButtonElement).disabled).toBe(true);
    expect(phoneNumberMocks.updateAdminTenantPhoneChannel).not.toHaveBeenCalled();
  });

  it("disables Resume line when a paused channel is not routing ready", async () => {
    phoneNumberMocks.listAdminTenantPhoneChannels.mockResolvedValue({
      phone_channels: [
        {
          id: "binding-3",
          tenant_id: "tenant-1",
          phone_number: "+15551230003",
          sip_trunk_id: "lk-trunk-3",
          active: false,
          agent_definition_id: "agent-1",
          agent_name: "Appointment Intake",
          agent_status: "published",
          published_version: 3,
          routing_ready: false,
          created_at: "2026-04-04T10:07:00Z",
        },
      ],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Resume line" })).toBeTruthy();
    });

    const toggleButton = screen.getByTestId("admin-phone-toggle-selected") as HTMLButtonElement;
    expect(toggleButton.disabled).toBe(true);

    fireEvent.click(toggleButton);
    expect(phoneNumberMocks.updateAdminTenantPhoneChannel).not.toHaveBeenCalled();
  });

  it("keeps Pause line available for active channels that need repair", async () => {
    phoneNumberMocks.listAdminTenantPhoneChannels.mockResolvedValue({
      phone_channels: [
        {
          id: "binding-4",
          tenant_id: "tenant-1",
          phone_number: "+15551230004",
          sip_trunk_id: "lk-trunk-4",
          active: true,
          agent_definition_id: "agent-1",
          agent_name: "Appointment Intake",
          agent_status: "published",
          published_version: 3,
          routing_ready: false,
          created_at: "2026-04-04T10:08:00Z",
        },
      ],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Pause line" })).toBeTruthy();
    });

    const toggleButton = screen.getByTestId("admin-phone-toggle-selected") as HTMLButtonElement;
    expect(toggleButton.disabled).toBe(false);

    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(phoneNumberMocks.updateAdminTenantPhoneChannel).toHaveBeenCalledWith("tenant-1", "binding-4", {
        active: false,
      });
    });
  });
});
