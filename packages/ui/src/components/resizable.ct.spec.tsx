import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { ResizablePanel, ResizablePanelGroup } from "./resizable";

test("renders resizable panels", async ({ mount }) => {
  const component = await mount(
    <ResizablePanelGroup orientation="horizontal" style={{ width: 600, height: 200 }}>
      <ResizablePanel defaultSize={50}>
        <div>Left panel</div>
      </ResizablePanel>
      <ResizablePanel defaultSize={50}>
        <div>Right panel</div>
      </ResizablePanel>
    </ResizablePanelGroup>,
  );

  await expect(component.getByText("Left panel")).toBeVisible();
  await expect(component.getByText("Right panel")).toBeVisible();
});
