"use client";

import { useEffect } from "react";
import type { Document } from "yaml";

import {
  InputField,
  SelectField,
  SliderField,
  ToggleField,
  docGetBoolean,
  docGetNumber,
  docGetString,
  docHas,
  prefixed,
} from "@/app/(deployment)/admin/agent-definitions/structured-agent-editor-form";
import {
  getEditorTtsVoiceField,
  VOICE_ENDPOINTING_MODE_OPTIONS,
  VOICE_INTERRUPTION_MODE_OPTIONS,
  VOICE_NOISE_CANCELLATION_MODEL_OPTIONS,
  VOICE_STT_PROVIDER_OPTIONS,
  VOICE_TTS_PROVIDER_OPTIONS,
  VOICE_TURN_DETECTION_TYPE_OPTIONS,
} from "@/lib/voice/voice-capabilities";

const DEFAULT_VAD_MS = 300;
const DEFAULT_TURN_TYPE = "stt";
const DEFAULT_ENDPOINTING_MODE = "dynamic";
const DEFAULT_INTERRUPTION_MODE = "adaptive";
const DEFAULT_MIN_ENDPOINTING_DELAY_S = 0.0;
const DEFAULT_MAX_ENDPOINTING_DELAY_S = 1.0;
const DEFAULT_PREEMPTIVE_GENERATION = true;
const DEFAULT_NOISE_CANCELLATION_PROVIDER = "krisp";
const DEFAULT_NOISE_CANCELLATION_MODEL = "bvc_telephony";

type VoicePanelProps = {
  doc: Document;
  prefix: string[];
  onUpdate: (path: string[], value: unknown) => void;
  onMutate: (mutate: (doc: Document) => void) => void;
  readOnly?: boolean;
};

function optionsWithCurrent(options: readonly string[], currentValue: string): string[] {
  if (!currentValue || options.includes(currentValue)) {
    return [...options];
  }
  return [currentValue, ...options];
}

function resolveVoiceBasePath(doc: Document, prefix: string[]): string[] {
  return docHas(doc, prefixed(prefix, ["channels", "voice"]))
    ? prefixed(prefix, ["channels", "voice"])
    : prefixed(prefix, ["voice"]);
}

export function VoicePanel({
  doc,
  prefix,
  onUpdate,
  onMutate,
  readOnly,
}: VoicePanelProps) {
  const basePath = resolveVoiceBasePath(doc, prefix);
  const hasVoiceConfig = docHas(doc, basePath);

  const sttProvider = docGetString(doc, [...basePath, "stt", "provider"]);
  const sttModel = docGetString(doc, [...basePath, "stt", "model"]);
  const sttLanguage = docGetString(doc, [...basePath, "stt", "language"]);

  const ttsProvider = docGetString(doc, [...basePath, "tts", "provider"]);
  const ttsVoiceId = docGetString(doc, [...basePath, "tts", "voice_id"]);
  const ttsVoice = docGetString(doc, [...basePath, "tts", "voice_name"]);
  const ttsLanguage = docGetString(doc, [...basePath, "tts", "language"]);

  const vadMs = docGetNumber(doc, [...basePath, "vad", "min_silence_duration_ms"]);

  const turnType = docGetString(doc, [...basePath, "turn_detection", "type"]);
  const endpointingMode = docGetString(doc, [...basePath, "turn_detection", "endpointing_mode"]);
  const interruptionMode = docGetString(doc, [...basePath, "turn_detection", "interruption_mode"]);
  const minEnd = docGetNumber(doc, [...basePath, "turn_detection", "min_endpointing_delay_s"]);
  const maxEnd = docGetNumber(doc, [...basePath, "turn_detection", "max_endpointing_delay_s"]);
  const preemptive = docGetBoolean(doc, [...basePath, "turn_detection", "preemptive_generation"]);

  const fillerEnabled = docGetBoolean(doc, [...basePath, "filler_audio", "enabled"]);

  const ncProvider = docGetString(doc, [...basePath, "noise_cancellation", "provider"]);
  const ncModel = docGetString(doc, [...basePath, "noise_cancellation", "model"]);
  const noiseCancellationProvider = ncProvider || "krisp";
  const ttsVoiceField = getEditorTtsVoiceField(ttsProvider);
  const ttsVoiceValue =
    ttsVoiceField.field === "voice_id" ? (ttsVoiceId || ttsVoice) : (ttsVoice || ttsVoiceId);

  useEffect(() => {
    if (!hasVoiceConfig || readOnly) {
      return;
    }

    const needsDefaults =
      vadMs == null
      || !turnType
      || !endpointingMode
      || !interruptionMode
      || minEnd == null
      || maxEnd == null
      || preemptive == null
      || !ncProvider
      || !ncModel;

    if (!needsDefaults) {
      return;
    }

    onMutate((currentDoc) => {
      const currentBasePath = resolveVoiceBasePath(currentDoc, prefix);

      if (docGetNumber(currentDoc, [...currentBasePath, "vad", "min_silence_duration_ms"]) == null) {
        currentDoc.setIn([...currentBasePath, "vad", "min_silence_duration_ms"], DEFAULT_VAD_MS);
      }
      if (!docGetString(currentDoc, [...currentBasePath, "turn_detection", "type"])) {
        currentDoc.setIn([...currentBasePath, "turn_detection", "type"], DEFAULT_TURN_TYPE);
      }
      if (!docGetString(currentDoc, [...currentBasePath, "turn_detection", "endpointing_mode"])) {
        currentDoc.setIn([...currentBasePath, "turn_detection", "endpointing_mode"], DEFAULT_ENDPOINTING_MODE);
      }
      if (!docGetString(currentDoc, [...currentBasePath, "turn_detection", "interruption_mode"])) {
        currentDoc.setIn([...currentBasePath, "turn_detection", "interruption_mode"], DEFAULT_INTERRUPTION_MODE);
      }
      if (docGetNumber(currentDoc, [...currentBasePath, "turn_detection", "min_endpointing_delay_s"]) == null) {
        currentDoc.setIn([...currentBasePath, "turn_detection", "min_endpointing_delay_s"], DEFAULT_MIN_ENDPOINTING_DELAY_S);
      }
      if (docGetNumber(currentDoc, [...currentBasePath, "turn_detection", "max_endpointing_delay_s"]) == null) {
        currentDoc.setIn([...currentBasePath, "turn_detection", "max_endpointing_delay_s"], DEFAULT_MAX_ENDPOINTING_DELAY_S);
      }
      if (docGetBoolean(currentDoc, [...currentBasePath, "turn_detection", "preemptive_generation"]) == null) {
        currentDoc.setIn([...currentBasePath, "turn_detection", "preemptive_generation"], DEFAULT_PREEMPTIVE_GENERATION);
      }
      if (!docGetString(currentDoc, [...currentBasePath, "noise_cancellation", "provider"])) {
        currentDoc.setIn([...currentBasePath, "noise_cancellation", "provider"], DEFAULT_NOISE_CANCELLATION_PROVIDER);
      }
      if (!docGetString(currentDoc, [...currentBasePath, "noise_cancellation", "model"])) {
        currentDoc.setIn([...currentBasePath, "noise_cancellation", "model"], DEFAULT_NOISE_CANCELLATION_MODEL);
      }
    });
  }, [endpointingMode, hasVoiceConfig, interruptionMode, maxEnd, minEnd, ncModel, ncProvider, onMutate, preemptive, prefix, readOnly, turnType, vadMs]);

  if (!hasVoiceConfig) {
    return null;
  }

  const upsertVoiceSectionField = (
    section: string,
    key: string,
    nextValue: unknown,
    seed: Record<string, unknown> = {},
  ) => {
    const sectionPath = [...basePath, section];
    if (nextValue === undefined || nextValue === "") {
      onUpdate([...sectionPath, key], undefined);
      return;
    }
    if (!docHas(doc, sectionPath)) {
      onUpdate(sectionPath, { ...seed, [key]: nextValue });
      return;
    }
    onUpdate([...sectionPath, key], nextValue);
  };

  const onTtsProviderChange = (nextProvider: string) => {
    onMutate((currentDoc) => {
      const ttsPath = [...basePath, "tts"];
      const nextVoiceField = getEditorTtsVoiceField(nextProvider);
      const staleVoiceField = nextVoiceField.field === "voice_id" ? "voice_name" : "voice_id";
      const nextVoiceValue =
        nextVoiceField.field === "voice_id" ? (ttsVoiceId || ttsVoice) : (ttsVoice || ttsVoiceId);

      currentDoc.setIn([...ttsPath, "provider"], nextProvider);
      if (nextVoiceValue) {
        currentDoc.setIn([...ttsPath, nextVoiceField.field], nextVoiceValue);
      }
      try {
        currentDoc.deleteIn([...ttsPath, staleVoiceField]);
      } catch {
        // The stale field is optional and often absent.
      }
    });
  };

  const onTtsVoiceFieldChange = (nextValue: string) => {
    onMutate((currentDoc) => {
      const ttsPath = [...basePath, "tts"];
      const staleVoiceField = ttsVoiceField.field === "voice_id" ? "voice_name" : "voice_id";

      if (nextValue) {
        currentDoc.setIn([...ttsPath, ttsVoiceField.field], nextValue);
      } else {
        try {
          currentDoc.deleteIn([...ttsPath, ttsVoiceField.field]);
        } catch {
          // Empty values should remove the active voice field when it exists.
        }
      }
      try {
        currentDoc.deleteIn([...ttsPath, staleVoiceField]);
      } catch {
        // Keep the YAML normalized for the selected provider.
      }
    });
  };

  return (
    <div className="space-y-4 px-3 pb-3">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-[var(--color-neutral-400)]">
          Speech-to-Text
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <SelectField
            label="Provider"
            value={sttProvider}
            options={optionsWithCurrent(VOICE_STT_PROVIDER_OPTIONS, sttProvider)}
            onChange={(v) => onUpdate([...basePath, "stt", "provider"], v)}
            readOnly={readOnly}
            description="Speech recognition service."
          />
          <InputField
            label="Model"
            value={sttModel}
            placeholder="stt-rt-v4"
            onChange={(v) => onUpdate([...basePath, "stt", "model"], v)}
            readOnly={readOnly}
            description="Recognizer model variant."
          />
          <InputField
            label="Language"
            value={sttLanguage}
            placeholder="en"
            onChange={(v) => onUpdate([...basePath, "stt", "language"], v)}
            readOnly={readOnly}
            description="BCP-47 language code, for example lt-LT."
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-[var(--color-neutral-400)]">
          Text-to-Speech
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <SelectField
            label="Provider"
            value={ttsProvider}
            options={optionsWithCurrent(VOICE_TTS_PROVIDER_OPTIONS, ttsProvider)}
            onChange={onTtsProviderChange}
            readOnly={readOnly}
            description="Speech synthesis service."
          />
          <InputField
            label={ttsVoiceField.label}
            value={ttsVoiceValue}
            placeholder={ttsVoiceField.placeholder}
            onChange={onTtsVoiceFieldChange}
            readOnly={readOnly}
            description="Provider-specific voice selection."
          />
          <InputField
            label="Language"
            value={ttsLanguage}
            placeholder="en-US"
            onChange={(v) => onUpdate([...basePath, "tts", "language"], v)}
            readOnly={readOnly}
            description="Keep this aligned with STT for natural calls."
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-[var(--color-neutral-400)]">
          Voice Activity Detection
        </p>
        <SliderField
          label="Min silence duration"
          value={vadMs}
          min={100}
          max={2000}
          step={50}
          unit="ms"
          onChange={(v) => upsertVoiceSectionField("vad", "min_silence_duration_ms", v)}
          readOnly={readOnly}
          description="Silence before end-of-turn detection reacts."
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-[var(--color-neutral-400)]">
          Turn Detection
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <SelectField
            label="Type"
            value={turnType}
            options={optionsWithCurrent(VOICE_TURN_DETECTION_TYPE_OPTIONS, turnType)}
            onChange={(v) => upsertVoiceSectionField("turn_detection", "type", v)}
            readOnly={readOnly}
            description="STT uses transcript context. VAD relies on silence only."
          />
          <SelectField
            label="Endpointing mode"
            value={endpointingMode}
            options={optionsWithCurrent(VOICE_ENDPOINTING_MODE_OPTIONS, endpointingMode)}
            onChange={(v) => upsertVoiceSectionField("turn_detection", "endpointing_mode", v)}
            readOnly={readOnly}
            description="Dynamic adapts delay to sentence completion."
          />
          <SelectField
            label="Interruption mode"
            value={interruptionMode}
            options={optionsWithCurrent(VOICE_INTERRUPTION_MODE_OPTIONS, interruptionMode)}
            onChange={(v) => upsertVoiceSectionField("turn_detection", "interruption_mode", v)}
            readOnly={readOnly}
            description="Adaptive is the safer conversational default."
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <SliderField
            label="Min endpointing delay"
            value={minEnd}
            min={0}
            max={3}
            step={0.1}
            unit="s"
            onChange={(v) => upsertVoiceSectionField("turn_detection", "min_endpointing_delay_s", v)}
            readOnly={readOnly}
            description="Fastest reply allowed after silence."
          />
          <SliderField
            label="Max endpointing delay"
            value={maxEnd}
            min={0}
            max={3}
            step={0.1}
            unit="s"
            onChange={(v) => upsertVoiceSectionField("turn_detection", "max_endpointing_delay_s", v)}
            readOnly={readOnly}
            description="Upper bound when dynamic endpointing waits longer."
          />
        </div>
        <ToggleField
          label="Preemptive generation"
          checked={preemptive ?? false}
          onChange={(v) => upsertVoiceSectionField("turn_detection", "preemptive_generation", v)}
          readOnly={readOnly}
          description="Start preparing the reply before end-of-turn is fully finalized."
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-[var(--color-neutral-400)]">
          Noise Cancellation
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <InputField
            label="Provider"
            value={noiseCancellationProvider}
            placeholder="krisp"
            onChange={(v) => upsertVoiceSectionField("noise_cancellation", "provider", v)}
            readOnly
            description="Transport-level provider."
          />
          <SelectField
            label="Model"
            value={ncModel}
            options={VOICE_NOISE_CANCELLATION_MODEL_OPTIONS}
            onChange={(v) =>
              upsertVoiceSectionField("noise_cancellation", "model", v, {
                provider: noiseCancellationProvider,
              })
            }
            readOnly={readOnly}
            description="`bvc_telephony` is the telephony-tuned option."
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-[var(--color-neutral-400)]">
          Filler Audio
        </p>
        <ToggleField
          label="Enabled"
          checked={fillerEnabled ?? false}
          onChange={(v) => upsertVoiceSectionField("filler_audio", "enabled", v)}
          readOnly={readOnly}
          description="Play filler sounds while the model thinks."
        />
      </div>
    </div>
  );
}
