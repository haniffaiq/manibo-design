import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { OverflowMenu } from "./overflow-menu";

const ITEMS = [
  { label: "Support details", onClick: () => undefined, testId: "item-support" },
  { label: "Listen in", onClick: () => undefined, testId: "item-listen" },
  { label: "Delete call", onClick: () => undefined, testId: "item-delete", destructive: true },
];

test("renders trigger and opens menu on click", async ({ mount, page }) => {
  await mount(<OverflowMenu items={ITEMS} />);

  const trigger = page.getByTestId("overflow-menu-trigger");
  await expect(trigger).toBeVisible();

  await trigger.click();
  await expect(page.getByTestId("item-support")).toBeVisible();
  await expect(page.getByTestId("item-listen")).toBeVisible();
  await expect(page.getByTestId("item-delete")).toBeVisible();
});

test("invokes onClick when item is selected", async ({ mount, page }) => {
  let clicked = "";

  await mount(
    <OverflowMenu
      items={[
        { label: "Action A", onClick: () => { clicked = "a"; }, testId: "action-a" },
        { label: "Action B", onClick: () => { clicked = "b"; }, testId: "action-b" },
      ]}
    />,
  );

  await page.getByTestId("overflow-menu-trigger").click();
  await page.getByTestId("action-b").click();
  await expect.poll(() => clicked).toBe("b");
});
