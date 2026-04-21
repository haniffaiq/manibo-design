"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type NoticeVariant = "success" | "warning" | "error";
export type Notice = { message: string; variant: NoticeVariant };

export function useNotice(autoDismissMs = 4000) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNotice = useCallback(() => setNotice(null), []);

  const showNotice = useCallback(
    (message: string, variant: NoticeVariant = "success") => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setNotice({ message, variant });
      timerRef.current = setTimeout(() => {
        setNotice(null);
        timerRef.current = null;
      }, autoDismissMs);
    },
    [autoDismissMs],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { notice, showNotice, clearNotice } as const;
}
