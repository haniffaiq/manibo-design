import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Sidebar } from "./sidebar";

test("renders section labels and items", async ({ mount }) => {
  const component = await mount(
    <Sidebar
      brand={<div>NFQ</div>}
      sections={[
        { items: [{ label: "Dashboard", href: "/dashboard", active: true }] },
        { label: "Management", items: [{ label: "Tenants", href: "/tenants" }] },
      ]}
    />,
  );

  await expect(component.getByText("Management")).toBeVisible();
  await expect(component.getByRole("link", { name: "Dashboard" })).toBeVisible();
});

test("invokes onSelect for linked item", async ({ mount, page }) => {
  let selectionCount = 0;

  const component = await mount(
    <Sidebar
      sections={[
        {
          items: [
            {
              label: "Drivers",
              href: "/drivers",
              onSelect: () => {
                selectionCount += 1;
              },
            },
          ],
        },
      ]}
    />,
  );

  await component.getByRole("link", { name: "Drivers" }).click();
  await expect.poll(() => selectionCount).toBe(1);
  await expect(page).toHaveURL(/\/drivers$/);
});
