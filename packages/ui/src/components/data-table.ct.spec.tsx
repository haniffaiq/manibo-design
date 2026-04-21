import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { DataTable } from "./data-table";

interface DriverRow {
  id: string;
  name: string;
}

const COLUMNS = [
  { id: "name", header: "Driver", accessor: "name" as const },
  { id: "id", header: "Identifier", accessor: "id" as const },
];

test("renders table rows from typed data", async ({ mount }) => {
  const component = await mount(
    <DataTable<DriverRow>
      columns={COLUMNS}
      rows={[{ id: "drv_1", name: "Alice" }]}
      rowKey="id"
    />,
  );

  await expect(component.getByRole("columnheader", { name: "Driver" })).toBeVisible();
  await expect(component.getByRole("cell", { name: "Alice" })).toBeVisible();
});

test("renders skeleton rows when loading", async ({ mount }) => {
  const component = await mount(
    <DataTable<DriverRow>
      columns={COLUMNS}
      rows={[]}
      rowKey="id"
      loading
    />,
  );

  await expect(component.getByRole("columnheader", { name: "Driver" })).toBeVisible();
  // Default 3 skeleton rows × 2 columns = 6 skeleton placeholders
  const skeletonRows = component.locator('tr[role="status"]');
  await expect(skeletonRows).toHaveCount(3);
});

test("renders custom number of skeleton rows", async ({ mount }) => {
  const component = await mount(
    <DataTable<DriverRow>
      columns={COLUMNS}
      rows={[]}
      rowKey="id"
      loading
      loadingRows={5}
    />,
  );

  const skeletonRows = component.locator('tr[role="status"]');
  await expect(skeletonRows).toHaveCount(5);
});

test("loading takes precedence over rows and emptyState", async ({ mount }) => {
  const component = await mount(
    <DataTable<DriverRow>
      columns={COLUMNS}
      rows={[{ id: "drv_1", name: "Alice" }]}
      rowKey="id"
      loading
      emptyState="Nothing here"
    />,
  );

  // Should show skeletons, not data or empty state
  const skeletonRows = component.locator('tr[role="status"]');
  await expect(skeletonRows).toHaveCount(3);
  await expect(component.getByRole("cell", { name: "Alice" })).toHaveCount(0);
  await expect(component.getByText("Nothing here")).toHaveCount(0);
});
