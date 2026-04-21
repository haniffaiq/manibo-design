export class PlatformApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PlatformApiError";
    this.status = status;
  }
}

function buildRequestHeaders(body: BodyInit | null | undefined, headers: HeadersInit | undefined): Headers {
  const result = new Headers(headers);
  if (body && !(body instanceof FormData) && !result.has("Content-Type")) {
    result.set("Content-Type", "application/json");
  }
  return result;
}

function formatErrorMessage(status: number, statusText: string, detail: string | null): string {
  if (detail && detail.trim().length > 0) {
    return `${status} ${statusText}: ${detail}`;
  }
  return `${status} ${statusText}`;
}

async function parseErrorDetail(response: Response): Promise<string | null> {
  const raw = await response.text();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { detail?: unknown; error?: unknown };
    if (typeof parsed.detail === "string" && parsed.detail.trim().length > 0) {
      return parsed.detail;
    }
    if (
      parsed.detail &&
      typeof parsed.detail === "object" &&
      "message" in parsed.detail &&
      typeof (parsed.detail as { message?: unknown }).message === "string" &&
      (parsed.detail as { message: string }).message.trim().length > 0
    ) {
      return (parsed.detail as { message: string }).message;
    }
    if (typeof parsed.error === "string" && parsed.error.trim().length > 0) {
      return parsed.error;
    }
  } catch {
    // Keep raw detail when response is not JSON.
  }

  return raw;
}

export async function platformApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/platform${path}`, {
    ...init,
    headers: buildRequestHeaders(init?.body, init?.headers),
  });
  if (!response.ok) {
    const detail = await parseErrorDetail(response);
    throw new PlatformApiError(formatErrorMessage(response.status, response.statusText, detail), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  if (!raw) {
    return undefined as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as T;
  }
}
