import type { NextRequest } from "next/server";

const INTERNAL_CLUSTER_SUFFIXES = [".svc", ".svc.cluster.local", ".cluster.local"];

function sanitizeHeaderValue(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  const values = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return values[0] || null;
}

function sanitizeProto(raw: string | null): "http" | "https" | null {
  const value = sanitizeHeaderValue(raw)?.toLowerCase();
  if (value === "http" || value === "https") {
    return value;
  }
  return null;
}

function sanitizePort(raw: string | null): string | null {
  const value = sanitizeHeaderValue(raw);
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }

  return String(port);
}

function sanitizeHost(raw: string | null): string | null {
  const value = sanitizeHeaderValue(raw);
  if (!value || value.includes("/") || value.includes("\\") || /\s/.test(value)) {
    return null;
  }
  try {
    const parsed = new URL(`https://${value}`);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      !parsed.host ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    return parsed.host;
  } catch {
    return null;
  }
}

function parseConfiguredOrigin(raw: string | undefined): string | null {
  const value = raw?.trim() || "";
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function runtimeConfiguredPublicOrigin(): string | null {
  return parseConfiguredOrigin(process.env.GROVE_PUBLIC_APP_URL);
}

function buildConfiguredPublicOrigin(): string | null {
  return parseConfiguredOrigin(process.env.NEXT_PUBLIC_APP_URL);
}

function requestOriginLooksInternal(origin: string): boolean {
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "0.0.0.0") {
      return true;
    }
    if (INTERNAL_CLUSTER_SUFFIXES.some((suffix) => hostname.endsWith(suffix) || hostname.includes(`${suffix}.`))) {
      return true;
    }
    if (
      hostname !== "localhost" &&
      !hostname.includes(".") &&
      !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) &&
      !hostname.includes(":")
    ) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

function requestOrigin(request: NextRequest): string | null {
  const origin = parseConfiguredOrigin(request.nextUrl.origin);
  if (!origin || requestOriginLooksInternal(origin)) {
    return null;
  }
  return origin;
}

function trustedProxyHeadersEnabled(): boolean {
  return process.env.GROVE_TRUST_PROXY_HEADERS === "true";
}

function normalizeOrigin(proto: "http" | "https", host: string, port?: string | null): string | null {
  try {
    const authority = port && !host.includes(":") ? `${host}:${port}` : host;
    const parsed = new URL(`${proto}://${authority}`);
    if (
      parsed.protocol !== `${proto}:` ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function forwardedOrigin(request: NextRequest): string | null {
  if (!trustedProxyHeadersEnabled()) {
    return null;
  }

  const forwardedHost = sanitizeHost(request.headers.get("x-forwarded-host"));
  const forwardedProto = sanitizeProto(request.headers.get("x-forwarded-proto"));
  const forwardedPort = sanitizePort(request.headers.get("x-forwarded-port"));
  if (forwardedHost && forwardedProto) {
    return normalizeOrigin(forwardedProto, forwardedHost, forwardedPort);
  }

  const host = sanitizeHost(request.headers.get("host"));
  if (host && forwardedProto) {
    return normalizeOrigin(forwardedProto, host, forwardedPort);
  }

  return null;
}

export function resolvePublicAppOrigin(request: NextRequest): string {
  return (
    runtimeConfiguredPublicOrigin() ||
    forwardedOrigin(request) ||
    requestOrigin(request) ||
    buildConfiguredPublicOrigin() ||
    request.nextUrl.origin
  );
}

export function shouldUseSecureCookies(request: NextRequest): boolean {
  try {
    return new URL(resolvePublicAppOrigin(request)).protocol === "https:";
  } catch {
    return request.nextUrl.protocol === "https:";
  }
}
