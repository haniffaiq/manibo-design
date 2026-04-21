import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

import { SidebarNav } from "@/components/sidebar-nav";

const SECTIONS = [
  {
    title: "Platform",
    items: [
      { label: "Dashboard", href: "/admin", icon: <span data-testid="icon-dashboard">D</span> },
      { label: "Tenants", href: "/admin/tenants", icon: <span data-testid="icon-tenants">T</span> },
    ],
  },
];

afterEach(() => {
  cleanup();
});

describe("SidebarNav", () => {
  it("renders nav items with labels when not collapsed", () => {
    render(
      <SidebarNav title="Deployment Console" sections={SECTIONS} />,
    );

    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Tenants")).toBeTruthy();
  });

  it("hides labels and shows only icons when collapsed", () => {
    render(
      <SidebarNav title="Deployment Console" sections={SECTIONS} collapsed />,
    );

    // In collapsed mode the desktop aside renders icon-only links with title attribute
    const tenantLink = screen.getByTitle("Tenants");
    expect(tenantLink).toBeTruthy();
    expect(tenantLink.getAttribute("href")).toBe("/admin/tenants");

    // The label text should not appear as visible text in the collapsed desktop aside.
    // Note: the mobile header still renders the title, but the expanded nav items with
    // full labels are not rendered. We check that no <span> with "flex-1" (the label span)
    // exists in the collapsed sidebar.
    const collapsedAside = tenantLink.closest("aside");
    expect(collapsedAside).toBeTruthy();
    // The label text "Tenants" should only exist as a title attribute, not as visible child text
    const labelsInAside = collapsedAside!.querySelectorAll("span.flex-1");
    expect(labelsInAside.length).toBe(0);
  });

  it("renders footer content", () => {
    render(
      <SidebarNav
        title="Deployment Console"
        sections={SECTIONS}
        footer={
          <button type="button" aria-label="Collapse sidebar">
            toggle
          </button>
        }
      />,
    );

    expect(screen.getByLabelText("Collapse sidebar")).toBeTruthy();
  });
});
