"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SessionRole } from "@/lib/auth_types";
import { describeLoginError } from "@/lib/login-error-copy";
import { OidcProvider } from "@/lib/oidc_types";

type AuthSessionResponse = {
  user_id: string;
  tenant_id: string;
  role: SessionRole;
  email?: string | null;
};

type AvailableProviders = {
  google: boolean;
  microsoft: boolean;
  default: boolean;
};

type AdminLoginFormProps = {
  availableProviders: AvailableProviders;
  tokenPasteLoginEnabled: boolean;
  testAuthEnabled: boolean;
  devTokenAuthEnabled: boolean;
};

type ProviderOption = {
  provider: OidcProvider;
  label: string;
  availableKey: keyof AvailableProviders;
};

const PROVIDER_OPTIONS: ProviderOption[] = [
  { provider: OidcProvider.Google, label: "Continue with Google", availableKey: "google" },
  { provider: OidcProvider.Microsoft, label: "Continue with Microsoft", availableKey: "microsoft" },
  { provider: OidcProvider.Default, label: "Continue with organization SSO", availableKey: "default" },
];

function safeRedirectTarget(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://") || raw.includes("\\")) {
    return fallback;
  }
  return raw;
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 21 21" className="h-4 w-4 shrink-0" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
    </svg>
  );
}

function SsoLockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function ProviderIcon({ provider }: { provider: OidcProvider }) {
  if (provider === OidcProvider.Google) return <GoogleLogo />;
  if (provider === OidcProvider.Microsoft) return <MicrosoftLogo />;
  return <SsoLockIcon />;
}

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

export default function AdminLoginForm({
  availableProviders,
  tokenPasteLoginEnabled,
  testAuthEnabled,
  devTokenAuthEnabled,
}: AdminLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<OidcProvider | null>(null);

  const visibleProviders = useMemo(
    () => PROVIDER_OPTIONS.filter((p) => availableProviders[p.availableKey]),
    [availableProviders],
  );

  useEffect(() => {
    const loginError = searchParams.get("error");
    setError(loginError ? describeLoginError(loginError) : null);
  }, [searchParams]);

  function startSso(provider: OidcProvider) {
    setError(null);
    setLoadingProvider(provider);
    const from = searchParams.get("from");
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    params.set("provider", provider);
    window.location.assign(`/api/auth/oidc/start${params.toString() ? `?${params.toString()}` : ""}`);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const accessToken = String(form.get("access_token") ?? "").trim();
    if (!accessToken) { setError("Paste a bearer token to continue."); return; }
    if (!tokenPasteLoginEnabled) { setError("Manual token login is disabled in production."); return; }
    let response: Response;
    try {
      response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bearerToken: accessToken }),
      });
    } catch {
      setError("Unable to reach the auth endpoint. Check your network connection.");
      return;
    }
    if (!response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text) as { error?: unknown };
        if (typeof json.error === "string") { setError(describeLoginError(json.error)); return; }
      } catch { /* ignore */ }
      setError(describeLoginError(`Login failed: ${response.status} ${response.statusText}`));
      return;
    }
    const payload = (await response.json()) as AuthSessionResponse;
    if (!payload.user_id || typeof payload.tenant_id !== "string" || !payload.role) {
      setError(describeLoginError("Login failed: auth response missing user context."));
      return;
    }
    const from = new URLSearchParams(window.location.search).get("from");
    router.push(safeRedirectTarget(from, "/admin"));
  }

  async function signInWithDevToken(token: string) {
    setError(null);
    let response: Response;
    try {
      response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bearerToken: token }),
      });
    } catch {
      setError("Unable to reach the auth endpoint.");
      return;
    }
    if (!response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text) as { error?: unknown };
        if (typeof json.error === "string") { setError(json.error); return; }
      } catch { /* ignore */ }
      setError(`Login failed: ${response.status}`);
      return;
    }
    const from = new URLSearchParams(window.location.search).get("from");
    router.push(safeRedirectTarget(from, "/admin"));
  }

  const hasSso = visibleProviders.length > 0;
  const providerMessage = devTokenAuthEnabled
    ? "No sign-in providers are configured for this local test deployment. Use Developer access with a `dev:<user_uuid_or_subject>` token or wire an OIDC provider."
    : testAuthEnabled
      ? "No sign-in providers are configured for this local test deployment. Paste a bearer token from the traceability harness or your test identity provider, or wire an OIDC provider."
      : "No sign-in providers are configured for this deployment. Contact your platform administrator.";
  const tokenLabel = devTokenAuthEnabled ? "Dev bearer token" : "Bearer token";
  const tokenPlaceholder = devTokenAuthEnabled ? "dev:<user_uuid_or_subject>" : "Paste an ID token or access token";
  const tokenHelp = devTokenAuthEnabled
    ? "Local dev auth expects `dev:<user_uuid_or_subject>`."
    : testAuthEnabled
      ? "Paste a bearer token from the local harness or your test identity provider."
      : "Paste an ID token or access token from your identity provider.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)] px-4 py-10">
      <div className="w-full max-w-[360px]">
        {/* Login card */}
        <div className="rounded-xl border border-[var(--color-edge)] bg-white px-7 py-7 shadow-sm">
          <div className="mb-4">
            <span className="inline-flex rounded-md border border-[var(--color-edge)] px-2 py-1 text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
              Platform Administration
            </span>
          </div>

          <h1 className="text-[17px] font-semibold tracking-tight text-[var(--color-text)]">Platform Administration</h1>
          <p className="mt-1.5 text-[13px] leading-5 text-[var(--color-text-secondary)]">
            Restricted to provisioned platform administrators.
          </p>

          {error ? (
            <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] leading-5 text-[var(--color-danger)]">
              {error}
            </div>
          ) : null}

          <div className="mt-6 space-y-2.5">
            {hasSso ? (
              visibleProviders.map((p) => (
                <button
                  key={p.provider}
                  type="button"
                  disabled={loadingProvider !== null}
                  onClick={() => startSso(p.provider)}
                  className="flex w-full items-center gap-3 rounded-lg border border-[var(--color-edge)] bg-white px-4 py-2.5 text-[14px] font-medium text-[var(--color-text)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2"
                >
                  <ProviderIcon provider={p.provider} />
                  <span className="flex-1 text-left">{p.label}</span>
                  {loadingProvider === p.provider ? <Spinner /> : null}
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] leading-5 text-amber-800">
                {providerMessage}
              </div>
            )}
          </div>

          {devTokenAuthEnabled ? (
            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => void signInWithDevToken("dev:00000000-0000-4000-a000-000000000099")}
                className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
              >
                Sign in as Super Admin
              </button>
              <details className="group">
                <summary className="flex cursor-pointer select-none list-none items-center gap-1 text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
                  Sign in with a different token
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-3 w-3 transition-transform group-open:rotate-180" aria-hidden="true">
                    <path d="M2 4l4 4 4-4"/>
                  </svg>
                </summary>
                <form onSubmit={handleSubmit} className="mt-3 space-y-2">
                  <textarea
                    id="admin_access_token"
                    name="access_token"
                    suppressHydrationWarning
                    autoComplete="off"
                    rows={2}
                    className="w-full rounded-lg border border-[var(--color-edge)] bg-slate-50 px-3 py-2 font-mono text-[11px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-500)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                    placeholder="dev:<user_uuid>"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-[var(--color-edge)] bg-white px-3 py-2 text-[13px] font-medium text-[var(--color-text)] transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
                  >
                    Sign in with token
                  </button>
                </form>
              </details>
            </div>
          ) : tokenPasteLoginEnabled ? (
            <details className="group mt-6">
              <summary className="flex cursor-pointer select-none list-none items-center gap-1 text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
                Developer access
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-3 w-3 transition-transform group-open:rotate-180" aria-hidden="true">
                  <path d="M2 4l4 4 4-4"/>
                </svg>
              </summary>
              <form onSubmit={handleSubmit} className="mt-3 space-y-2">
                <label htmlFor="admin_access_token" className="block text-[11px] font-medium text-[var(--color-text-secondary)]">
                  {tokenLabel}
                </label>
                <p className="text-[11px] leading-4 text-[var(--color-text-secondary)]">{tokenHelp}</p>
                <textarea
                  id="admin_access_token"
                  name="access_token"
                  suppressHydrationWarning
                  autoComplete="off"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--color-edge)] bg-slate-50 px-3 py-2 font-mono text-[11px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-500)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                  placeholder={tokenPlaceholder}
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-slate-900 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
                >
                  Sign in with token
                </button>
              </form>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}
