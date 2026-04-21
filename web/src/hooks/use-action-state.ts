"use client";

import { useCallback, useState } from "react";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";
import { useNotice } from "./use-notice";

export function useActionState() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notice, showNotice, clearNotice } = useNotice(8000);

  const clearError = useCallback(() => setError(null), []);

  const run = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | null> => {
      setBusy(true);
      setError(null);
      clearNotice();
      try {
        return await action();
      } catch (err) {
        setError(toErrorMessage(err));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [clearNotice],
  );

  return { busy, error, notice, run, clearError, clearNotice, showNotice, setError } as const;
}
