import { describe, expect, it } from "vitest";

import { safeParseDocument } from "@/app/(deployment)/admin/agent-definitions/structured-agent-editor-yaml";

/**
 * Validates that all voice configuration fields exposed in VoicePanel
 * can be read from and written to a YAML agent definition document.
 * Covers the v1.5.x LiveKit fields: endpointing_mode, interruption_mode,
 * noise_cancellation, and filler_audio.
 */

const FULL_VOICE_YAML = `
name: test-agent
channels:
  voice:
    enabled: true
    stt:
      provider: soniox
      model: stt-rt-v4
      language: en
    tts:
      provider: elevenlabs
      voice_id: voice-rachel
      language: en-US
    vad:
      min_silence_duration_ms: 400
    turn_detection:
      type: multilingual_model
      endpointing_mode: dynamic
      interruption_mode: adaptive
      min_endpointing_delay_s: 0.3
      max_endpointing_delay_s: 1.5
      preemptive_generation: true
    noise_cancellation:
      provider: krisp
      model: bvc_telephony
    filler_audio:
      enabled: true
`;

describe("VoicePanel YAML field coverage", () => {
  it("reads all turn detection fields including endpointing and interruption mode", () => {
    const doc = safeParseDocument(FULL_VOICE_YAML);
    expect(doc).not.toBeNull();

    const td = (field: string) =>
      doc!.getIn(["channels", "voice", "turn_detection", field]);

    expect(td("type")).toBe("multilingual_model");
    expect(td("endpointing_mode")).toBe("dynamic");
    expect(td("interruption_mode")).toBe("adaptive");
    expect(td("min_endpointing_delay_s")).toBe(0.3);
    expect(td("max_endpointing_delay_s")).toBe(1.5);
    expect(td("preemptive_generation")).toBe(true);
  });

  it("reads noise cancellation provider and model", () => {
    const doc = safeParseDocument(FULL_VOICE_YAML)!;

    const nc = (field: string) =>
      doc.getIn(["channels", "voice", "noise_cancellation", field]);

    expect(nc("provider")).toBe("krisp");
    expect(nc("model")).toBe("bvc_telephony");
  });

  it("reads filler audio enabled flag", () => {
    const doc = safeParseDocument(FULL_VOICE_YAML)!;
    expect(doc.getIn(["channels", "voice", "filler_audio", "enabled"])).toBe(true);
  });

  it("persists endpointing_mode change via setIn", () => {
    const doc = safeParseDocument(FULL_VOICE_YAML)!;
    doc.setIn(["channels", "voice", "turn_detection", "endpointing_mode"], "fixed");
    expect(doc.getIn(["channels", "voice", "turn_detection", "endpointing_mode"])).toBe("fixed");
  });

  it("persists interruption_mode change via setIn", () => {
    const doc = safeParseDocument(FULL_VOICE_YAML)!;
    doc.setIn(["channels", "voice", "turn_detection", "interruption_mode"], "vad");
    expect(doc.getIn(["channels", "voice", "turn_detection", "interruption_mode"])).toBe("vad");
  });

  it("persists noise cancellation model change via setIn", () => {
    const doc = safeParseDocument(FULL_VOICE_YAML)!;
    doc.setIn(["channels", "voice", "noise_cancellation", "model"], "nc");
    expect(doc.getIn(["channels", "voice", "noise_cancellation", "model"])).toBe("nc");
  });

  it("persists filler audio toggle via setIn", () => {
    const doc = safeParseDocument(FULL_VOICE_YAML)!;
    doc.setIn(["channels", "voice", "filler_audio", "enabled"], false);
    expect(doc.getIn(["channels", "voice", "filler_audio", "enabled"])).toBe(false);
  });

  it("returns undefined for optional voice sections when absent", () => {
    const minimal = safeParseDocument(
      "name: test\nchannels:\n  voice:\n    enabled: true\n    stt:\n      provider: google\n",
    )!;
    expect(minimal.getIn(["channels", "voice", "turn_detection"])).toBeUndefined();
    expect(minimal.getIn(["channels", "voice", "noise_cancellation"])).toBeUndefined();
    expect(minimal.getIn(["channels", "voice", "filler_audio"])).toBeUndefined();
  });

  it("handles voice config at top-level path (no channels wrapper)", () => {
    const topLevel = safeParseDocument(
      "name: test\nvoice:\n  enabled: true\n  turn_detection:\n    endpointing_mode: fixed\n    interruption_mode: vad\n",
    )!;
    expect(topLevel.getIn(["voice", "turn_detection", "endpointing_mode"])).toBe("fixed");
    expect(topLevel.getIn(["voice", "turn_detection", "interruption_mode"])).toBe("vad");
  });

  it("reads elevenlabs voice_id instead of the legacy voice_name field", () => {
    const doc = safeParseDocument(FULL_VOICE_YAML)!;
    expect(doc.getIn(["channels", "voice", "tts", "voice_id"])).toBe("voice-rachel");
    expect(doc.getIn(["channels", "voice", "tts", "voice_name"])).toBeUndefined();
  });
});
