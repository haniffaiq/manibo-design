import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Modal } from "./modal";

test("renders open modal content", async ({ mount, page }) => {
  await mount(
    <Modal open onClose={() => undefined} title="Delete tenant" description="This cannot be undone.">
      Confirm deletion.
    </Modal>,
  );

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Confirm deletion.")).toBeVisible();
});

test("invokes onClose on Escape", async ({ mount, page }) => {
  let closeCount = 0;

  await mount(
    <Modal
      open
      onClose={() => {
        closeCount += 1;
      }}
      title="Close me"
    >
      Modal content.
    </Modal>,
  );

  await page.keyboard.press("Escape");
  await expect.poll(() => closeCount).toBe(1);
});
