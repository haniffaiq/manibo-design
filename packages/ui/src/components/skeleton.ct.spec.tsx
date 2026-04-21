import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Skeleton } from "./skeleton";

test("renders with default rounded rectangle", async ({ mount }) => {
  const component = await mount(<Skeleton style={{ height: 16, width: 128 }} />);

  await expect(component).toBeVisible();
  await expect(component).toHaveClass(/rounded-\[var\(--radius-md\)\]/);
});

test("renders as circle when circle prop is true", async ({ mount }) => {
  const component = await mount(<Skeleton circle style={{ height: 40, width: 40 }} />);

  await expect(component).toBeVisible();
  await expect(component).toHaveClass(/rounded-full/);
});
