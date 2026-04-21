import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusMessage } from "@/components/status-message";

describe("StatusMessage", () => {
  it("returns null for null children", () => {
    const { container } = render(<StatusMessage>{null}</StatusMessage>);
    expect(container.innerHTML).toBe("");
  });

  it("returns null for empty string children", () => {
    const { container } = render(<StatusMessage>{""}</StatusMessage>);
    expect(container.innerHTML).toBe("");
  });

  it("renders a div in box mode (default)", () => {
    const { container } = render(<StatusMessage>Something went wrong</StatusMessage>);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el.textContent).toBe("Something went wrong");
    expect(el.className).toContain("border");
    expect(el.className).toContain("rounded-");
  });

  it("renders a p in inline mode", () => {
    const { container } = render(<StatusMessage inline>Inline notice</StatusMessage>);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe("P");
    expect(el.textContent).toBe("Inline notice");
  });

  it("applies error variant classes by default", () => {
    const { container } = render(<StatusMessage>Error</StatusMessage>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("color-error");
  });

  it("applies success variant classes", () => {
    const { container } = render(<StatusMessage variant="success">OK</StatusMessage>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("color-success");
  });

  it("applies warning variant classes", () => {
    const { container } = render(<StatusMessage variant="warning">Caution</StatusMessage>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("color-warning");
  });

  it("applies info variant classes", () => {
    const { container } = render(<StatusMessage variant="info">Tip</StatusMessage>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("color-primary");
  });

  it("applies inline variant classes correctly", () => {
    const { container } = render(<StatusMessage variant="success" inline>Done</StatusMessage>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("color-success-700");
    expect(el.className).not.toContain("border");
  });

  it("passes data-testid through", () => {
    const { container } = render(<StatusMessage data-testid="my-msg">Hello</StatusMessage>);
    expect(container.querySelector('[data-testid="my-msg"]')).not.toBeNull();
  });

  it("merges custom className", () => {
    const { container } = render(<StatusMessage className="mt-4">Hello</StatusMessage>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("mt-4");
  });
});
