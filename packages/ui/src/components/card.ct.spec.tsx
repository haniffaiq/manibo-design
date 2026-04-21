import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Card, CardContent, CardHeader } from "./card";

test("renders header and content", async ({ mount }) => {
  const component = await mount(
    <Card>
      <CardHeader>Usage</CardHeader>
      <CardContent>42 active calls</CardContent>
    </Card>,
  );

  await expect(component).toContainText("Usage");
  await expect(component).toContainText("42 active calls");
});
