import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Badge } from "./badge";

test("renders badge content", async ({ mount }) => {
  const component = await mount(<Badge variant="success">Active</Badge>);

  await expect(component).toContainText("Active");
  await expect(component).toBeVisible();
});
