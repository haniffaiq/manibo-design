"use client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface EvaluatorScore {
  name: string;
  value: number;
  /** 0-1 range. null = no threshold configured. */
  threshold: number | null;
}

export interface ScoreBadgesProps {
  scores: EvaluatorScore[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function scoreColor(value: number, threshold: number | null): string {
  if (threshold == null) {
    return value >= 0.5
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-red-50 text-red-700 border-red-200";
  }
  return value >= threshold
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-red-50 text-red-700 border-red-200";
}

function formatScore(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ScoreBadges({ scores }: ScoreBadgesProps) {
  if (scores.length === 0) return null;

  return (
    <div data-testid="score-badges" className="flex flex-wrap gap-1.5">
      {scores.map((score) => (
        <span
          key={score.name}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${scoreColor(score.value, score.threshold)}`}
          title={`${score.name}: ${formatScore(score.value)}${score.threshold != null ? ` (threshold: ${formatScore(score.threshold)})` : ""}`}
        >
          <span className="text-[var(--color-neutral-500)]">{score.name}:</span>
          <span>{formatScore(score.value)}</span>
        </span>
      ))}
    </div>
  );
}
