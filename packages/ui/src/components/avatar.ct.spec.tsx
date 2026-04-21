import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Avatar } from "./avatar";

test("falls back to initials without image", async ({ mount }) => {
  const component = await mount(<Avatar name="Jane Smith" />);

  await expect(component).toContainText("JS");
  await expect(component).toBeVisible();
});
