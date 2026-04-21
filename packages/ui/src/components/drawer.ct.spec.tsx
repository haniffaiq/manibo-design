import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Drawer, DrawerBody, DrawerFooter } from "./drawer";

test("renders open drawer with title and body", async ({ mount, page }) => {
  await mount(
    <Drawer open onOpenChange={() => undefined} title="Support details" description="Live call context.">
      <DrawerBody>Drawer body content</DrawerBody>
      <DrawerFooter>Footer actions</DrawerFooter>
    </Drawer>,
  );

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Support details")).toBeVisible();
  await expect(page.getByText("Live call context.")).toBeVisible();
  await expect(page.getByText("Drawer body content")).toBeVisible();
  await expect(page.getByText("Footer actions")).toBeVisible();
});

test("invokes onOpenChange on close button click", async ({ mount, page }) => {
  let lastValue: boolean | null = null;

  await mount(
    <Drawer
      open
      onOpenChange={(open) => {
        lastValue = open;
      }}
      title="Close me"
    >
      <DrawerBody>Content</DrawerBody>
    </Drawer>,
  );

  await page.getByLabel("Close").click();
  await expect.poll(() => lastValue).toBe(false);
});
