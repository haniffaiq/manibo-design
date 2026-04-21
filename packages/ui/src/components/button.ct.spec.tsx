import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Button } from "./button";

test("renders button text and type", async ({ mount }) => {
  const component = await mount(<Button>Create tenant</Button>);

  await expect(component).toContainText("Create tenant");
  await expect(component).toHaveAttribute("type", "button");
});

test("renders disabled primary buttons with muted styling", async ({ mount }) => {
  const component = await mount(<Button disabled>Onboard tenant</Button>);

  await expect(component).toBeDisabled();
  await expect(component).toHaveClass(/disabled:border-\[var\(--color-neutral-200\)\]/);
  await expect(component).toHaveClass(/disabled:bg-\[var\(--color-neutral-100\)\]/);
  await expect(component).toHaveClass(/disabled:text-\[var\(--color-neutral-400\)\]/);
  await expect(component).toHaveClass(/disabled:cursor-not-allowed/);
});
