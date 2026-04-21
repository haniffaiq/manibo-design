import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

import { StructuredAgentEditor } from "@/app/(deployment)/admin/agent-definitions/structured-agent-editor";

const MINIMAL_AGENT_YAML = readFileSync(
  resolve(process.cwd(), "..", "..", "packages", "platform-core", "tests", "e2e", "fixtures", "minimal_agent.yaml"),
  "utf8",
);

function ControlledStructuredAgentEditor({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <>
      <StructuredAgentEditor value={value} onChange={setValue} />
      <pre data-testid="yaml-output">{value}</pre>
    </>
  );
}

afterEach(() => {
  cleanup();
});

describe("StructuredAgentEditor voice panel rendering", () => {
  it("renders manifest-backed voice controls for minimal voice yaml and creates missing nodes on edit", () => {
    render(<ControlledStructuredAgentEditor initialValue={MINIMAL_AGENT_YAML} />);

    fireEvent.click(screen.getByRole("button", { name: /Voice/i }));

    const providerFields = screen.getAllByLabelText("Provider");
    const sttProvider = providerFields[0] as HTMLSelectElement;
    const ttsProvider = providerFields[1] as HTMLSelectElement;

    expect(Array.from(sttProvider.options).map((option) => option.value)).toEqual([
      "",
      "noop",
      "google",
      "soniox",
    ]);
    expect(Array.from(ttsProvider.options).map((option) => option.value)).toEqual([
      "",
      "noop",
      "google",
      "elevenlabs",
    ]);

    expect(screen.getByText("Turn Detection")).toBeTruthy();
    expect(screen.getByLabelText("Endpointing mode")).toBeTruthy();
    expect(screen.getByLabelText("Interruption mode")).toBeTruthy();
    expect(screen.getByText("Noise Cancellation")).toBeTruthy();
    expect(screen.getByDisplayValue("krisp")).toBeTruthy();
    expect(screen.getByText("Filler Audio")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Endpointing mode"), {
      target: { value: "dynamic" },
    });
    expect(screen.getByTestId("yaml-output").textContent).toContain("turn_detection:");
    expect(screen.getByTestId("yaml-output").textContent).toContain(
      "endpointing_mode: dynamic",
    );

    fireEvent.change(screen.getAllByLabelText("Model")[1]!, {
      target: { value: "nc" },
    });
    expect(screen.getByTestId("yaml-output").textContent).toContain(
      "noise_cancellation:",
    );
    expect(screen.getByTestId("yaml-output").textContent).toContain("provider: krisp");
    expect(screen.getByTestId("yaml-output").textContent).toContain("model: nc");

    fireEvent.click(screen.getByLabelText("Enabled"));
    expect(screen.getByTestId("yaml-output").textContent).toContain("filler_audio:");
    expect(screen.getByTestId("yaml-output").textContent).toContain("enabled: true");
  });

  it("switches the TTS voice field to voice_id for elevenlabs", () => {
    render(<ControlledStructuredAgentEditor initialValue={MINIMAL_AGENT_YAML} />);

    fireEvent.click(screen.getByRole("button", { name: /Voice/i }));
    fireEvent.change(screen.getAllByLabelText("Provider")[1]!, {
      target: { value: "elevenlabs" },
    });

    expect(screen.getByLabelText("Voice ID")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Voice ID"), {
      target: { value: "voice-abc123" },
    });

    const latestYaml = screen.getByTestId("yaml-output").textContent ?? "";
    expect(latestYaml).toContain("provider: elevenlabs");
    expect(latestYaml).toContain("voice_id: voice-abc123");
    expect(latestYaml).not.toContain("voice_name: voice-abc123");
  });
});
