export const SESSION_COOKIE = "grove_session";
export const PLATFORM_API_TOKEN_COOKIE = "grove_api_token";

export function resolveServerApiBaseUrl(): string {
  return (
    process.env.GROVE_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    "http://localhost:8000"
  );
}

export function resolveCookieMaxAgeSeconds(exp: number, fallbackSeconds = 900): number {
  const remaining = Math.floor(exp - Date.now() / 1000);
  if (!Number.isFinite(remaining) || remaining <= 0) {
    return fallbackSeconds;
  }
  return Math.max(60, remaining);
}

export function safeDecodeCookieValue(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}
