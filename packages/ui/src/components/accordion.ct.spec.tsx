import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

test("renders accordion and toggles content on click", async ({ mount }) => {
  const component = await mount(
    <Accordion type="single" collapsible>
      <AccordionItem value="one">
        <AccordionTrigger>Section One</AccordionTrigger>
        <AccordionContent>Content one</AccordionContent>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger>Section Two</AccordionTrigger>
        <AccordionContent>Content two</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );

  await expect(component.getByText("Section One")).toBeVisible();
  await expect(component.getByText("Content one")).not.toBeVisible();

  await component.getByText("Section One").click();
  await expect(component.getByText("Content one")).toBeVisible();
});
