import { Suspense } from "react";

import { assertSafeDevAuthFlags, isExplicitTestAuthEnabled, isSkipAuthEnabled } from "@/lib/dev-auth-flags";
import { readOidcConfig } from "@/lib/oidc_provider";
import { OidcProvider } from "@/lib/oidc_types";

import LoginForm from "./login-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isManualTokenLoginEnabled(): boolean {
  assertSafeDevAuthFlags();
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_TOKEN_PASTE_LOGIN === "true" ||
    process.env.GROVE_ENABLE_TOKEN_PASTE_LOGIN === "true"
  );
}

function isTestAuthEnabled(): boolean {
  return isExplicitTestAuthEnabled();
}

function isDevTokenAuthEnabled(): boolean {
  assertSafeDevAuthFlags();
  return isSkipAuthEnabled() || isExplicitTestAuthEnabled();
}

export default function LoginPage() {
  const availableProviders = {
    google: readOidcConfig(OidcProvider.Google) !== null,
    microsoft: readOidcConfig(OidcProvider.Microsoft) !== null,
    default: readOidcConfig(OidcProvider.Default) !== null,
  };

  return (
    <Suspense>
      <LoginForm
        availableProviders={availableProviders}
        tokenPasteLoginEnabled={isManualTokenLoginEnabled()}
        testAuthEnabled={isTestAuthEnabled()}
        devTokenAuthEnabled={isDevTokenAuthEnabled()}
      />
    </Suspense>
  );
}
