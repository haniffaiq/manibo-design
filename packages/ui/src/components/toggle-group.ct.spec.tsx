import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

test("renders toggle group and selects item on click", async ({ mount }) => {
  const component = await mount(
    <ToggleGroup type="single" defaultValue="a">
      <ToggleGroupItem value="a">Option A</ToggleGroupItem>
      <ToggleGroupItem value="b">Option B</ToggleGroupItem>
    </ToggleGroup>,
  );

  await expect(component.getByText("Option A")).toBeVisible();
  await expect(component.getByText("Option A")).toHaveAttribute("data-state", "on");
  await expect(component.getByText("Option B")).toHaveAttribute("data-state", "off");

  await component.getByText("Option B").click();
  await expect(component.getByText("Option B")).toHaveAttribute("data-state", "on");
});
