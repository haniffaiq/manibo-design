import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";

test("renders sheet and opens on trigger click", async ({ mount }) => {
  const component = await mount(
    <Sheet>
      <SheetTrigger>Open sheet</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet title</SheetTitle>
        </SheetHeader>
        <p>Sheet body</p>
      </SheetContent>
    </Sheet>,
  );

  await expect(component.getByText("Open sheet")).toBeVisible();
  await component.getByText("Open sheet").click();
  await expect(component.getByText("Sheet title")).toBeVisible();
  await expect(component.getByText("Sheet body")).toBeVisible();
});
