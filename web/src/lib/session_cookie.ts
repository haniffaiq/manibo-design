import { isSessionRole, SessionRole } from "@/lib/auth_types";

export { isSessionRole, SessionRole };

export type SignedSessionPayload = {
  userId: string;
  tenantId: string;
  role: SessionRole;
  exp: number;
  landingPath?: string;
  email?: string;
  tenantName?: string;
};

const SESSION_SECRET_ENV = "GROVE_WEB_SESSION_SECRET";
const DEV_SESSION_SECRET = "grove-web-dev-session-secret";

export function sanitizeSessionLandingPath(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return value.startsWith("/") && !value.startsWith("//") ? value : undefined;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  throw new Error("base64 encoder unavailable");
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }
  if (typeof atob === "function") {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }
  throw new Error("base64 decoder unavailable");
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad === 0 ? normalized : normalized + "=".repeat(4 - pad);
  const bytes = base64ToBytes(padded);
  return new TextDecoder().decode(bytes);
}

function resolveSessionSecret(): string | null {
  const configured = process.env[SESSION_SECRET_ENV]?.trim();
  if (configured) {
    return configured;
  }
  if (process.env.NODE_ENV !== "production") {
    return DEV_SESSION_SECRET;
  }
  return null;
}

async function sign(payloadSegment: string, secret: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("crypto.subtle unavailable");
  }
  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await subtle.sign("HMAC", key, new TextEncoder().encode(payloadSegment));
  return bytesToBase64(new Uint8Array(signature))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function encodeSignedSession(payload: SignedSessionPayload): Promise<string | null> {
  const secret = resolveSessionSecret();
  if (!secret) {
    return null;
  }
  const payloadSegment = encodeBase64Url(JSON.stringify(payload));
  const signatureSegment = await sign(payloadSegment, secret);
  return `${payloadSegment}.${signatureSegment}`;
}

export async function decodeSignedSession(cookieValue: string): Promise<SignedSessionPayload | null> {
  const secret = resolveSessionSecret();
  if (!secret) {
    return null;
  }
  const segments = cookieValue.split(".");
  if (segments.length !== 2) {
    return null;
  }
  const payloadSegment = segments[0];
  const signatureSegment = segments[1];
  const expectedSignature = await sign(payloadSegment, secret);
  if (signatureSegment !== expectedSignature) {
    return null;
  }
  try {
    const payloadRaw = JSON.parse(decodeBase64Url(payloadSegment)) as unknown;
    if (
      !payloadRaw ||
      typeof payloadRaw !== "object" ||
      typeof (payloadRaw as { userId?: unknown }).userId !== "string" ||
      typeof (payloadRaw as { tenantId?: unknown }).tenantId !== "string" ||
      !isSessionRole((payloadRaw as { role?: unknown }).role) ||
      typeof (payloadRaw as { exp?: unknown }).exp !== "number" ||
      ("landingPath" in payloadRaw &&
        (payloadRaw as { landingPath?: unknown }).landingPath !== undefined &&
        sanitizeSessionLandingPath((payloadRaw as { landingPath?: unknown }).landingPath as string | undefined) ===
          undefined)
    ) {
      return null;
    }
    return payloadRaw as SignedSessionPayload;
  } catch {
    return null;
  }
}

function isSignedSessionPayload(payloadRaw: unknown): payloadRaw is SignedSessionPayload {
  return (
    !!payloadRaw &&
    typeof payloadRaw === "object" &&
    typeof (payloadRaw as { userId?: unknown }).userId === "string" &&
    typeof (payloadRaw as { tenantId?: unknown }).tenantId === "string" &&
    isSessionRole((payloadRaw as { role?: unknown }).role) &&
    typeof (payloadRaw as { exp?: unknown }).exp === "number" &&
    (!("landingPath" in payloadRaw) ||
      sanitizeSessionLandingPath((payloadRaw as { landingPath?: unknown }).landingPath as string | undefined) !==
        undefined)
  );
}

export function decodeUnsignedTestSession(cookieValue: string): SignedSessionPayload | null {
  try {
    const payloadRaw =
      typeof atob === "function"
        ? JSON.parse(atob(cookieValue))
        : JSON.parse(Buffer.from(cookieValue, "base64").toString("utf-8"));
    if (!isSignedSessionPayload(payloadRaw)) {
      return null;
    }
    return Date.now() / 1000 > payloadRaw.exp ? null : payloadRaw;
  } catch {
    return null;
  }
}

export async function decodeSessionCookie(
  cookieValue: string,
  options?: { allowUnsignedTestSession?: boolean },
): Promise<SignedSessionPayload | null> {
  const decoded = options?.allowUnsignedTestSession
    ? decodeUnsignedTestSession(cookieValue) ?? (await decodeSignedSession(cookieValue))
    : await decodeSignedSession(cookieValue);

  if (!decoded || Date.now() / 1000 > decoded.exp) {
    return null;
  }
  return decoded;
}

export function decodeJwtExpiry(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as unknown;
    if (
      payload &&
      typeof payload === "object" &&
      "exp" in payload &&
      typeof (payload as { exp: unknown }).exp === "number"
    ) {
      return (payload as { exp: number }).exp;
    }
    return null;
  } catch {
    return null;
  }
}
