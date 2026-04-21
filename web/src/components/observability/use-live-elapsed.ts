import { useEffect, useState } from "react";

/**
 * Returns a ticking elapsed-time string for running cases.
 * Updates every second while `enabled` is true and `startedAt` is provided.
 */
export function useLiveElapsed(startedAt: string | null, enabled: boolean): number | null {
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || !startedAt) {
      setElapsedMs(null);
      return;
    }

    const origin = new Date(startedAt).getTime();
    if (Number.isNaN(origin)) {
      setElapsedMs(null);
      return;
    }

    setElapsedMs(Date.now() - origin);

    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - origin);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [startedAt, enabled]);

  return elapsedMs;
}
