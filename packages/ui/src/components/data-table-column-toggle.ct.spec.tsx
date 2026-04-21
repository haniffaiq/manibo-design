import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import type { DataTableColumn } from "./data-table";
import { DataTableColumnToggle } from "./data-table-column-toggle";

type Row = {
  email: string;
  name: string;
  role: string;
};

const COLUMNS: DataTableColumn<Row>[] = [
  { id: "name", header: "Name", accessor: "name" },
  { id: "email", header: "Email", accessor: "email" },
  { id: "role", header: "Role", accessor: "role" },
];

test("toggles individual columns and bulk visibility actions", async ({ mount, page }) => {
  const toggled: string[] = [];
  let showAllCount = 0;
  let hideAllCount = 0;

  await mount(
    <DataTableColumnToggle
      columns={COLUMNS}
      hiddenColumns={new Set(["email"])}
      onToggle={(columnId) => {
        toggled.push(columnId);
      }}
      onShowAll={() => {
        showAllCount += 1;
      }}
      onHideAll={() => {
        hideAllCount += 1;
      }}
    />,
  );

  await page.getByTestId("column-toggle-trigger").click();
  await expect(page.getByText("Columns")).toBeVisible();

  await page.getByRole("button", { name: "Email" }).click();
  await expect.poll(() => toggled).toEqual(["email"]);

  await page.getByRole("button", { name: "Hide all" }).click();
  await expect.poll(() => hideAllCount).toBe(1);

  await page.getByRole("button", { name: "Show all" }).click();
  await expect.poll(() => showAllCount).toBe(1);
});
