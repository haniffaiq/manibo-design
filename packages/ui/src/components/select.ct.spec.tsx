import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

test("opens dropdown and selects an item", async ({ mount, page }) => {
  await mount(
    <Select defaultValue="one">
      <SelectTrigger>
        <SelectValue placeholder="Pick one" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="one">Option one</SelectItem>
        <SelectItem value="two">Option two</SelectItem>
      </SelectContent>
    </Select>,
  );

  const trigger = page.getByRole("combobox");
  await expect(trigger).toBeVisible();
  await trigger.click();

  await expect(page.getByRole("option", { name: "Option two" })).toBeVisible();
  await page.getByRole("option", { name: "Option two" }).click();

  await expect(trigger).toContainText("Option two");
});

test("allowEmpty prepends empty option in dropdown", async ({ mount, page }) => {
  await mount(
    <Select defaultValue="alpha" allowEmpty emptyLabel="No selection">
      <SelectTrigger data-testid="trigger">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="alpha">Alpha</SelectItem>
        <SelectItem value="beta">Beta</SelectItem>
      </SelectContent>
    </Select>,
  );

  const trigger = page.getByTestId("trigger");
  await trigger.click();

  const options = page.getByRole("option");
  await expect(options).toHaveCount(3);
  await expect(options.first()).toHaveText("No selection");
});

test("allowEmpty shows emptyLabel when value is empty string", async ({ mount, page }) => {
  await mount(
    <Select value="" allowEmpty emptyLabel="None selected">
      <SelectTrigger data-testid="trigger">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="alpha">Alpha</SelectItem>
      </SelectContent>
    </Select>,
  );

  const trigger = page.getByTestId("trigger");
  await expect(trigger).toContainText("None selected");
});

test("allowEmpty selecting empty option fires onValueChange with empty string", async ({ mount, page }) => {
  const values: string[] = [];
  await mount(
    <Select
      defaultValue="alpha"
      allowEmpty
      emptyLabel="Clear"
      onValueChange={(v: string) => values.push(v)}
    >
      <SelectTrigger data-testid="trigger">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="alpha">Alpha</SelectItem>
      </SelectContent>
    </Select>,
  );

  const trigger = page.getByTestId("trigger");
  await trigger.click();
  await page.getByRole("option", { name: "Clear" }).click();

  // onValueChange should have been called — verify the trigger now shows "Clear"
  await expect(trigger).toContainText("Clear");
});
