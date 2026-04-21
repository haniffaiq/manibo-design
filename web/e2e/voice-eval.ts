import { writeFile } from "node:fs/promises";

export type BrowserVoiceEvalContract = {
  label: string;
  transport: string;
  requiredMarkers: string[];
  metadata?: Record<string, unknown>;
};

export type BrowserVoiceEvalObservation = {
  durationS: number;
  markers: Record<string, boolean>;
  metadata?: Record<string, unknown>;
  error?: string;
};

export type BrowserVoiceEvalSummary = {
  label: string;
  transport: string;
  success: boolean;
  duration_s: number;
  required_markers: string[];
  missing_markers: string[];
  markers: Record<string, boolean>;
  metadata: Record<string, unknown>;
  error: string | null;
};

export function evaluateBrowserVoiceContract(
  contract: BrowserVoiceEvalContract,
  observation: BrowserVoiceEvalObservation,
): BrowserVoiceEvalSummary {
  const missingMarkers = contract.requiredMarkers.filter((marker) => !observation.markers[marker]);
  return {
    label: contract.label,
    transport: contract.transport,
    success: missingMarkers.length === 0 && !observation.error,
    duration_s: observation.durationS,
    required_markers: [...contract.requiredMarkers],
    missing_markers: missingMarkers,
    markers: { ...observation.markers },
    metadata: {
      ...(contract.metadata ?? {}),
      ...(observation.metadata ?? {}),
    },
    error: observation.error ?? null,
  };
}

export async function maybeWriteBrowserVoiceEvalArtifact(options: {
  outputPath?: string;
  contract: BrowserVoiceEvalContract;
  observation: BrowserVoiceEvalObservation;
}): Promise<void> {
  if (!options.outputPath) {
    return;
  }
  const summary = evaluateBrowserVoiceContract(options.contract, options.observation);
  await writeFile(
    options.outputPath,
    `${JSON.stringify(
      {
        artifact_type: "voice_eval",
        schema_version: 1,
        created_at: new Date().toISOString(),
        payload: summary,
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
}
