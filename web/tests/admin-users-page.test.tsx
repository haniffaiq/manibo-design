import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";

const userMocks = vi.hoisted(() => ({
  listAdminTenantUsers: vi.fn(),
  inviteAdminTenantUser: vi.fn(),
  deactivateAdminTenantUser: vi.fn(),
  removeAdminTenantUser: vi.fn(),
  updateAdminTenantUserRole: vi.fn(),
}));

vi.mock("@/lib/api/admin-users", () => ({
  listAdminTenantUsers: userMocks.listAdminTenantUsers,
  inviteAdminTenantUser: userMocks.inviteAdminTenantUser,
  deactivateAdminTenantUser: userMocks.deactivateAdminTenantUser,
  removeAdminTenantUser: userMocks.removeAdminTenantUser,
  updateAdminTenantUserRole: userMocks.updateAdminTenantUserRole,
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

// OverflowMenu uses Radix portals; stub it.
vi.mock("@grove/ui/overflow-menu", () => ({
  OverflowMenu: ({ items, "data-testid": testId }: {
    items: { label: string; onClick: () => void; testId?: string }[];
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

// Modal uses Radix Dialog; provide a stub that renders children when open.
vi.mock("@grove/ui/modal", () => ({
  Modal: ({ open, title, children, footer }: {
    open: boolean;
    title?: string;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    onClose?: () => void;
    className?: string;
    description?: string;
  }) => {
    if (!open) return null;
    return (
      <div data-testid="modal">
        {title ? <h2>{title}</h2> : null}
        {children}
        {footer}
      </div>
    );
  },
}));

import DeploymentUsersPage from "@/app/(deployment)/admin/users/page";

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 }}>
      <DeploymentUsersPage />
    </SWRConfig>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DeploymentUsersPage", () => {
  it("has page title User management", async () => {
    userMocks.listAdminTenantUsers.mockResolvedValue({ users: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("User management")).toBeTruthy();
    });
  });

  it("invite button opens a modal with title Invite user", async () => {
    userMocks.listAdminTenantUsers.mockResolvedValue({ users: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("admin-users-invite-open")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("admin-users-invite-open"));

    await waitFor(() => {
      expect(screen.getByText("Invite user")).toBeTruthy();
    });
  });

  it("invite modal has Email, Display Name, and Role fields", async () => {
    userMocks.listAdminTenantUsers.mockResolvedValue({ users: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("admin-users-invite-open")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("admin-users-invite-open"));

    await waitFor(() => {
      expect(screen.getByTestId("admin-users-invite-email")).toBeTruthy();
    });

    expect(screen.getByTestId("admin-users-invite-email")).toBeTruthy();
    expect(screen.getByTestId("admin-users-invite-display-name")).toBeTruthy();
    expect(screen.getByTestId("admin-users-invite-role")).toBeTruthy();
  });
});
