import { GENERATED_VOICE_CAPABILITY_MANIFEST } from "@/lib/voice/generated-voice-capabilities";

type VoiceOption = { id: string; editor_visible: boolean; editor_fields: readonly string[] };

export const VOICE_CAPABILITY_MANIFEST = GENERATED_VOICE_CAPABILITY_MANIFEST;

function editorVisibleIds(options: readonly VoiceOption[]): string[] {
  return options.filter((option) => option.editor_visible).map((option) => option.id);
}

function findOption(options: readonly VoiceOption[], optionId: string): VoiceOption | null {
  return options.find((option) => option.id === optionId) ?? null;
}

export const VOICE_STT_PROVIDER_OPTIONS = editorVisibleIds(VOICE_CAPABILITY_MANIFEST.stt.providers);
export const VOICE_TTS_PROVIDER_OPTIONS = editorVisibleIds(VOICE_CAPABILITY_MANIFEST.tts.providers);
export const VOICE_TURN_DETECTION_TYPE_OPTIONS = editorVisibleIds(VOICE_CAPABILITY_MANIFEST.turn_detection.types);
export const VOICE_ENDPOINTING_MODE_OPTIONS = editorVisibleIds(VOICE_CAPABILITY_MANIFEST.turn_detection.endpointing_modes);
export const VOICE_INTERRUPTION_MODE_OPTIONS = editorVisibleIds(VOICE_CAPABILITY_MANIFEST.turn_detection.interruption_modes);
export const VOICE_NOISE_CANCELLATION_MODEL_OPTIONS = editorVisibleIds(VOICE_CAPABILITY_MANIFEST.noise_cancellation.models);

export function getEditorTtsVoiceField(provider: string): {
  field: "voice_id" | "voice_name";
  label: string;
  placeholder: string;
} {
  const capability = findOption(VOICE_CAPABILITY_MANIFEST.tts.providers, provider);
  if (capability?.editor_fields.includes("voice_id")) {
    return {
      field: "voice_id",
      label: "Voice ID",
      placeholder: "21m00Tcm4TlvDq8ikWAM",
    };
  }
  return {
    field: "voice_name",
    label: "Voice name",
    placeholder: "en-US-Chirp-HD",
  };
}
