import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Input } from "./input";

test("renders label and error state", async ({ mount }) => {
  const component = await mount(
    <Input label="Email" error="Email is required" placeholder="user@example.com" />,
  );

  await expect(component.getByLabel("Email")).toBeVisible();
  await expect(component.getByText("Email is required")).toBeVisible();
});
