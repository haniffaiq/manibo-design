import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Switch } from "./switch";

test("toggles checked state through onCheckedChange", async ({ mount, page }) => {
  let checkedState = false;

  await mount(
    <Switch
      data-testid="settings-switch"
      onCheckedChange={(next) => {
        checkedState = next;
      }}
    />,
  );

  const switchControl = page.getByRole("switch");
  await expect(switchControl).not.toBeChecked();

  await switchControl.click();
  await expect.poll(() => checkedState).toBe(true);
  await expect(switchControl).toBeChecked();
});

test("respects defaultChecked for uncontrolled usage", async ({ mount, page }) => {
  await mount(<Switch defaultChecked data-testid="default-switch" />);

  const switchControl = page.getByRole("switch");
  await expect(switchControl).toBeChecked();

  await switchControl.click();
  await expect(switchControl).not.toBeChecked();
});
