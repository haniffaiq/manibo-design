import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useMemo, useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Document } from "yaml";

import {
  detectPrefix,
  docHas,
  prefixed,
} from "@/app/(deployment)/admin/agent-definitions/structured-agent-editor-form";
import { safeParseDocument } from "@/app/(deployment)/admin/agent-definitions/structured-agent-editor-yaml";
import { VoicePanel } from "@/components/agent-editor/voice-panel";

const MINIMAL_AGENT_YAML = readFileSync(
  resolve(process.cwd(), "..", "..", "packages", "platform-core", "tests", "e2e", "fixtures", "minimal_agent.yaml"),
  "utf8",
);

function ControlledVoicePanel({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const doc = useMemo(() => safeParseDocument(value), [value]);
  const prefix = useMemo(() => (doc ? detectPrefix(doc) : []), [doc]);

  const onUpdate = (path: string[], value_: unknown) => {
    const currentDoc = safeParseDocument(value);
    if (!currentDoc) {
      return;
    }

    if (value_ === undefined || value_ === "") {
      try {
        currentDoc.deleteIn(path);
      } catch {
        // Path doesn't exist, ignore.
      }
    } else {
      currentDoc.setIn(path, value_);
    }

    setValue(currentDoc.toString());
  };

  const onMutate = (mutate: (doc: Document) => void) => {
    const currentDoc = safeParseDocument(value);
    if (!currentDoc) {
      return;
    }

    mutate(currentDoc);
    setValue(currentDoc.toString());
  };

  if (!doc) {
    return null;
  }

  return (
    <>
      <VoicePanel
        doc={doc}
        prefix={prefix}
        onUpdate={onUpdate}
        onMutate={onMutate}
      />
      <pre data-testid="yaml-output">{value}</pre>
    </>
  );
}

afterEach(() => {
  cleanup();
});

describe("VoicePanel", () => {
  it("keeps hook order stable when the voice section appears on a later render", () => {
    const initialDoc = safeParseDocument("name: test-agent\n");
    const nextDoc = safeParseDocument([
      "name: test-agent",
      "voice:",
      "  enabled: true",
      "  stt:",
      "    provider: google",
      "  tts:",
      "    provider: google",
      "",
    ].join("\n"));

    expect(initialDoc).not.toBeNull();
    expect(nextDoc).not.toBeNull();

    const onUpdate = () => {};
    const onMutate = () => {};

    const { rerender } = render(
      <VoicePanel
        doc={initialDoc!}
        prefix={detectPrefix(initialDoc!)}
        onUpdate={onUpdate}
        onMutate={onMutate}
      />,
    );

    rerender(
      <VoicePanel
        doc={nextDoc!}
        prefix={detectPrefix(nextDoc!)}
        onUpdate={onUpdate}
        onMutate={onMutate}
      />,
    );

    expect(screen.getAllByLabelText("Provider")).toHaveLength(3);
    expect(screen.getByLabelText("Endpointing mode")).toBeTruthy();
  });

  it("renders manifest-backed controls and creates missing voice nodes on edit", () => {
    render(<ControlledVoicePanel initialValue={MINIMAL_AGENT_YAML} />);

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

    fireEvent.change(screen.getByLabelText("Endpointing mode"), {
      target: { value: "dynamic" },
    });
    expect(screen.getByTestId("yaml-output").textContent).toContain("turn_detection:");
    expect(screen.getByTestId("yaml-output").textContent).toContain("endpointing_mode: dynamic");

    fireEvent.change(screen.getAllByLabelText("Model")[1]!, {
      target: { value: "nc" },
    });
    expect(screen.getByTestId("yaml-output").textContent).toContain("noise_cancellation:");
    expect(screen.getByTestId("yaml-output").textContent).toContain("provider: krisp");
    expect(screen.getByTestId("yaml-output").textContent).toContain("model: nc");

    fireEvent.click(screen.getByLabelText("Enabled"));
    expect(screen.getByTestId("yaml-output").textContent).toContain("filler_audio:");
    expect(screen.getByTestId("yaml-output").textContent).toContain("enabled: true");
  });

  it("switches the TTS voice field to voice_id for elevenlabs and removes voice_name", () => {
    render(<ControlledVoicePanel initialValue={MINIMAL_AGENT_YAML} />);

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

  it("updates top-level voice config without creating a channels wrapper", () => {
    const initialValue = [
      "name: test-agent",
      "voice:",
      "  enabled: true",
      "  stt:",
      "    provider: google",
      "  tts:",
      "    provider: google",
      "    voice_name: en-US-Wavenet-A",
      "",
    ].join("\n");

    render(<ControlledVoicePanel initialValue={initialValue} />);

    fireEvent.change(screen.getByLabelText("Endpointing mode"), {
      target: { value: "dynamic" },
    });

    const latestYaml = screen.getByTestId("yaml-output").textContent ?? "";
    const latestDoc = safeParseDocument(latestYaml);
    expect(latestDoc).not.toBeNull();
    expect(docHas(latestDoc!, ["channels", "voice"])).toBe(false);
    expect(latestDoc!.getIn(prefixed([], ["voice", "turn_detection", "endpointing_mode"]))).toBe("dynamic");
  });
});
