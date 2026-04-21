function extractNestedMessage(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  for (const key of ["error", "detail", "message", "reason"]) {
    if (key in value) {
      const nested = extractNestedMessage((value as Record<string, unknown>)[key]);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

function unwrapRawError(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return extractNestedMessage(parsed) ?? trimmed;
  } catch {
    // Keep parsing below when the payload is not standalone JSON.
  }

  const separatorIndex = trimmed.indexOf("—");
  if (separatorIndex >= 0) {
    const left = trimmed.slice(0, separatorIndex).trim();
    const right = trimmed.slice(separatorIndex + 1).trim();
    const nested = unwrapRawError(right);
    if (nested && nested !== right) {
      return `${left} ${nested}`.trim();
    }
  }

  return trimmed;
}

export function describeLoginError(raw: string): string {
  const detail = unwrapRawError(raw);
  const lowered = detail.toLowerCase();

  if (lowered.includes("provider 'google'")) {
    return "Google sign-in is not configured for this deployment. Ask your platform administrator to enable it.";
  }
  if (lowered.includes("provider 'microsoft'")) {
    return "Microsoft sign-in is not configured for this deployment. Ask your platform administrator to enable it.";
  }
  if (lowered.includes("provider 'default'")) {
    return "Organization sign-in is not configured for this deployment. Ask your platform administrator to enable it.";
  }
  if (lowered === "oidc discovery failed") {
    return "Single sign-on is temporarily unavailable. Try again in a moment or contact your platform administrator.";
  }
  if (lowered === "oidc state verification failed") {
    return "The sign-in attempt expired or was interrupted. Please try again.";
  }
  if (lowered.includes("tenant suspended")) {
    return "This workspace is currently suspended. Contact your platform administrator to restore access.";
  }
  if (lowered.includes("token rejected by platform api") || lowered.includes("not provisioned")) {
    return "Your account is not set up for this platform yet. Contact your platform administrator for access.";
  }
  if (lowered.includes("auth response missing user context")) {
    return "Your account is missing required platform access. Ask your administrator to review your role setup.";
  }
  if (lowered.includes("dev auth expects token format")) {
    return "Local test auth is enabled here. Use a token in the form `dev:<user_uuid_or_subject>`.";
  }
  if (lowered.includes("session signing secret not configured")) {
    return "Browser sign-in is not configured for this deployment yet. Contact your platform administrator.";
  }
  if (lowered.includes("manual token login is disabled")) {
    return "Token-based sign-in is not available for this deployment. Use your organization sign-in option instead.";
  }
  if (lowered.includes("invalid request payload")) {
    return "The sign-in request was incomplete. Refresh the page and try again.";
  }
  if (lowered.includes("missing bearer token")) {
    return "Paste a sign-in token to continue.";
  }
  if (lowered.includes("unable to reach auth endpoint")) {
    return "Sign-in is temporarily unavailable. Check your connection and try again.";
  }
  if (lowered.includes("auth response is not json")) {
    return "Sign-in is temporarily unavailable. Try again in a moment.";
  }
  if (lowered.includes("403 forbidden")) {
    return "This account cannot sign in to this workspace right now. Contact your platform administrator if you need access.";
  }
  if (lowered.includes("401 unauthorized")) {
    return "That sign-in token was not accepted. Check that you pasted the full token and try again.";
  }
  if (lowered.includes("login failed")) {
    return "Sign-in could not be completed. Try again or contact your platform administrator.";
  }

  return detail;
}

export function describeUpstreamLoginFailure(status: number, statusText: string, detail: string | null): string {
  const combined = [status, statusText, detail ?? ""].join(" ").trim();
  const translated = describeLoginError(combined);
  if (translated !== combined && translated !== detail) {
    return translated;
  }

  if (status >= 500) {
    return "Sign-in is temporarily unavailable. Try again in a moment or contact your platform administrator.";
  }
  if (status === 403) {
    return "This account cannot sign in to this workspace right now. Contact your platform administrator if you need access.";
  }
  if (status === 401) {
    return "That sign-in token was not accepted. Check that you pasted the full token and try again.";
  }
  if (status >= 400) {
    return "Sign-in could not be completed. Review the token and try again.";
  }
  return "Sign-in could not be completed. Try again or contact your platform administrator.";
}
