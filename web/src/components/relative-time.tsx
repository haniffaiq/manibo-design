"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/relative-time";

interface RelativeTimeProps {
  date: Date | string | number;
  /** Refresh interval in ms. Default 60_000 (1 min). */
  refreshInterval?: number;
  className?: string;
  "data-testid"?: string;
}

export function RelativeTime({ date, refreshInterval = 60_000, className, ...props }: RelativeTimeProps) {
  const [text, setText] = useState(() => formatRelativeTime(date));

  useEffect(() => {
    setText(formatRelativeTime(date));
    const timer = setInterval(() => setText(formatRelativeTime(date)), refreshInterval);
    return () => clearInterval(timer);
  }, [date, refreshInterval]);

  const dateObj = new Date(date);

  return (
    <time dateTime={dateObj.toISOString()} title={dateObj.toLocaleString()} className={className} {...props}>
      {text}
    </time>
  );
}
