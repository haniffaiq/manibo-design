import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Tooltip } from "./tooltip";

test("shows tooltip on hover", async ({ mount, page }) => {
  await mount(
    <Tooltip content="Helpful tip" delayDuration={0}>
      <button type="button">Hover me</button>
    </Tooltip>,
  );

  await expect(page.getByText("Helpful tip")).not.toBeVisible();
  await page.getByText("Hover me").hover();
  await expect(page.getByText("Helpful tip")).toBeVisible();
});

test("renders custom side", async ({ mount, page }) => {
  await mount(
    <Tooltip content="Bottom tip" side="bottom" delayDuration={0}>
      <button type="button">Target</button>
    </Tooltip>,
  );

  await page.getByText("Target").hover();
  await expect(page.getByText("Bottom tip")).toBeVisible();
});
