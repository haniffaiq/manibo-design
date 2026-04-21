import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

test("renders tabs and switches content on click", async ({ mount }) => {
  const component = await mount(
    <Tabs defaultValue="one">
      <TabsList>
        <TabsTrigger value="one">Tab One</TabsTrigger>
        <TabsTrigger value="two">Tab Two</TabsTrigger>
      </TabsList>
      <TabsContent value="one">Content one</TabsContent>
      <TabsContent value="two">Content two</TabsContent>
    </Tabs>,
  );

  await expect(component.getByText("Content one")).toBeVisible();
  await expect(component.getByText("Content two")).not.toBeVisible();

  await component.getByText("Tab Two").click();

  await expect(component.getByText("Content two")).toBeVisible();
  await expect(component.getByText("Content one")).not.toBeVisible();
});

test("active tab has data-state=active", async ({ mount }) => {
  const component = await mount(
    <Tabs defaultValue="a">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b">B</TabsTrigger>
      </TabsList>
      <TabsContent value="a">A content</TabsContent>
      <TabsContent value="b">B content</TabsContent>
    </Tabs>,
  );

  await expect(component.getByRole("tab", { name: "A" })).toHaveAttribute("data-state", "active");
  await expect(component.getByRole("tab", { name: "B" })).toHaveAttribute("data-state", "inactive");
});
