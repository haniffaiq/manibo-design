import { useEffect, useRef, useState } from "react";

export type SseMessage = {
  eventName: string | null;
  data: string;
};

export type UseSseStreamOptions = {
  maxRetries?: number;
  enabled?: boolean;
  getUrl?: () => string;
};

export function consumeSseMessages(buffer: string): { messages: SseMessage[]; remainder: string } {
  let remainder = buffer;
  const messages: SseMessage[] = [];

  while (true) {
    const idx = remainder.indexOf("\n\n");
    if (idx === -1) {
      break;
    }

    const raw = remainder.slice(0, idx);
    remainder = remainder.slice(idx + 2);

    const lines = raw.split("\n");
    const eventLine = lines.find((line) => line.startsWith("event: "));
    const dataLines = lines.filter((line) => line.startsWith("data: "));
    if (dataLines.length === 0) {
      continue;
    }

    messages.push({
      eventName: eventLine ? eventLine.slice("event: ".length).trim() : null,
      data: dataLines.map((line) => line.slice("data: ".length)).join("\n"),
    });
  }

  return { messages, remainder };
}

const BACKOFF_BASE_MS = 1000;

export function useSseStream(
  url: string | null,
  onMessage: (message: SseMessage) => void,
  options?: UseSseStreamOptions,
): { streaming: boolean; error: string | null } {
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const getUrlRef = useRef(options?.getUrl);
  getUrlRef.current = options?.getUrl;

  const enabled = options?.enabled ?? true;
  const maxRetries = options?.maxRetries ?? 3;

  useEffect(() => {
    if (!url || !enabled) return;

    const controller = new AbortController();
    let cancelled = false;

    async function run() {
      setStreaming(true);
      setError(null);
      let consecutiveErrors = 0;

      while (!cancelled) {
        try {
          const fetchUrl = getUrlRef.current ? getUrlRef.current() : url!;
          const res = await fetch(fetchUrl, {
            method: "GET",
            signal: controller.signal,
          });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`${res.status} ${res.statusText}: ${text}`);
          }

          const reader = res.body?.getReader();
          if (!reader) throw new Error("No response body (streaming not supported?)");

          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const consumed = consumeSseMessages(buffer);
            buffer = consumed.remainder;

            for (const message of consumed.messages) {
              onMessageRef.current(message);
            }
          }

          consecutiveErrors = 0;

          if (!cancelled) {
            await new Promise((resolve) => window.setTimeout(resolve, 250));
          }
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") {
            break;
          }

          consecutiveErrors += 1;
          if (consecutiveErrors > maxRetries) {
            setError(e instanceof Error ? e.message : "Unexpected error");
            break;
          }

          const delay = BACKOFF_BASE_MS * Math.pow(2, consecutiveErrors - 1);
          await new Promise((resolve) => window.setTimeout(resolve, delay));
        }
      }

      if (!cancelled) {
        setStreaming(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
      controller.abort();
      setStreaming(false);
    };
  }, [url, enabled, maxRetries]);

  return { streaming, error };
}
