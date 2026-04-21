import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin",
}));

vi.mock("@/solutions/registry", () => ({
  getSolutionNavItems: () => [],
}));

vi.mock("@/lib/solutions", () => ({
  BUILD_ENABLED_SOLUTIONS: new Set<string>(),
}));

import { DeploymentShell } from "@/components/deployment-shell";

afterEach(() => {
  cleanup();
});

describe("DeploymentShell", () => {
  it("renders the sidebar with Deployment Console title", () => {
    render(
      <DeploymentShell>
        <p>child content</p>
      </DeploymentShell>,
    );

    expect(screen.getAllByText("Deployment Console").length).toBeGreaterThan(0);
  });

  it("has a sign out button", () => {
    render(
      <DeploymentShell>
        <p>child content</p>
      </DeploymentShell>,
    );

    const signOutButton = screen.getByTestId("deployment-sign-out");
    expect(signOutButton).toBeTruthy();
  });

  it("has a collapse toggle button", () => {
    render(
      <DeploymentShell>
        <p>child content</p>
      </DeploymentShell>,
    );

    const collapseButton = screen.getByLabelText("Collapse sidebar");
    expect(collapseButton).toBeTruthy();
    expect(collapseButton.textContent).toContain("\u00AB");
  });

  it("renders children in the main content area", () => {
    render(
      <DeploymentShell>
        <p>child content</p>
      </DeploymentShell>,
    );

    expect(screen.getByText("child content")).toBeTruthy();
  });

  it("toggles sidebar collapsed state when collapse button is clicked", () => {
    render(
      <DeploymentShell>
        <p>child content</p>
      </DeploymentShell>,
    );

    const collapseButton = screen.getByLabelText("Collapse sidebar");
    fireEvent.click(collapseButton);

    // After collapse, the button label should change to "Expand sidebar"
    const expandButton = screen.getByLabelText("Expand sidebar");
    expect(expandButton).toBeTruthy();
    expect(expandButton.textContent).toContain("\u00BB");
  });
});
