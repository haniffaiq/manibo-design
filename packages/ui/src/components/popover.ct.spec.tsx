import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

test("opens popover content from the trigger", async ({ mount, page }) => {
  await mount(
    <Popover>
      <PopoverTrigger asChild>
        <button type="button">Open details</button>
      </PopoverTrigger>
      <PopoverContent data-testid="popover-content">Popover details</PopoverContent>
    </Popover>,
  );

  await page.getByRole("button", { name: "Open details" }).click();
  await expect(page.getByTestId("popover-content")).toBeVisible();
  await expect(page.getByText("Popover details")).toBeVisible();
});

test("closes the popover on Escape", async ({ mount, page }) => {
  await mount(
    <Popover>
      <PopoverTrigger asChild>
        <button type="button">Open details</button>
      </PopoverTrigger>
      <PopoverContent data-testid="popover-content">Popover details</PopoverContent>
    </Popover>,
  );

  await page.getByRole("button", { name: "Open details" }).click();
  await expect(page.getByTestId("popover-content")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("popover-content")).toBeHidden();
});
