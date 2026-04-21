import { expect, test } from "@playwright/experimental-ct-react";
import "../tokens/brand.css";
import { AgentAudioVisualizerBar } from "./agent-audio-visualizer-bar";

test("renders visualizer bars at default count", async ({ mount }) => {
  const component = await mount(<AgentAudioVisualizerBar />);

  await expect(component).toBeVisible();
  await expect(component.locator('[data-testid="agent-audio-visualizer-bar"]')).toBeVisible();
  // Default barCount is 5
  const bars = component.locator('[data-testid="agent-audio-visualizer-bar"] > div');
  await expect(bars).toHaveCount(5);
});

test("renders correct number of bars when barCount is set", async ({ mount }) => {
  const component = await mount(<AgentAudioVisualizerBar barCount={3} size="sm" />);

  const bars = component.locator('[data-testid="agent-audio-visualizer-bar"] > div');
  await expect(bars).toHaveCount(3);
});
