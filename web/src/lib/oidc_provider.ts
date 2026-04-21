import { OidcProvider, PlatformTokenPreference } from "@/lib/oidc_types";

export type OidcProviderConfig = {
  provider: OidcProvider;
  issuer: string;
  clientId: string;
  clientSecret: string | null;
  scopes: string;
  authorizationEndpointOverride: string | null;
  tokenEndpointOverride: string | null;
  redirectUriOverride: string | null;
  platformTokenPreference: PlatformTokenPreference;
};

export { OidcProvider, PlatformTokenPreference };

type ReadProviderConfigArgs = {
  provider: Exclude<OidcProvider, OidcProvider.Default>;
  envPrefix: string;
  preferenceFallback: PlatformTokenPreference;
};

function normalizeProvider(raw: string | null): OidcProvider {
  if (raw === OidcProvider.Google || raw === OidcProvider.Microsoft) {
    return raw;
  }
  return OidcProvider.Default;
}

function normalizePreference(raw: string | null, fallback: PlatformTokenPreference): PlatformTokenPreference {
  if (
    raw === PlatformTokenPreference.IdToken ||
    raw === PlatformTokenPreference.AccessToken ||
    raw === PlatformTokenPreference.Auto
  ) {
    return raw;
  }
  return fallback;
}

function stripOrNull(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed || null;
}

function readDefaultConfig(): OidcProviderConfig | null {
  const issuer = stripOrNull(process.env.GROVE_OIDC_ISSUER);
  const clientId = stripOrNull(process.env.GROVE_OIDC_CLIENT_ID);
  if (!issuer || !clientId) {
    return null;
  }
  return {
    provider: OidcProvider.Default,
    issuer: issuer.replace(/\/$/, ""),
    clientId,
    clientSecret: stripOrNull(process.env.GROVE_OIDC_CLIENT_SECRET),
    scopes: stripOrNull(process.env.GROVE_OIDC_SCOPES) ?? "openid profile email",
    authorizationEndpointOverride: stripOrNull(process.env.GROVE_OIDC_AUTHORIZATION_ENDPOINT),
    tokenEndpointOverride: stripOrNull(process.env.GROVE_OIDC_TOKEN_ENDPOINT),
    redirectUriOverride: stripOrNull(process.env.GROVE_OIDC_REDIRECT_URI),
    platformTokenPreference: normalizePreference(
      stripOrNull(process.env.GROVE_OIDC_PLATFORM_TOKEN_PREFERENCE),
      PlatformTokenPreference.Auto
    ),
  };
}

function readProviderConfig({ provider, envPrefix, preferenceFallback }: ReadProviderConfigArgs): OidcProviderConfig | null {
  const issuer = stripOrNull(process.env[`${envPrefix}_ISSUER`]);
  const clientId = stripOrNull(process.env[`${envPrefix}_CLIENT_ID`]);
  if (!issuer || !clientId) {
    return null;
  }
  return {
    provider,
    issuer: issuer.replace(/\/$/, ""),
    clientId,
    clientSecret: stripOrNull(process.env[`${envPrefix}_CLIENT_SECRET`]),
    scopes: stripOrNull(process.env[`${envPrefix}_SCOPES`]) ?? "openid profile email",
    authorizationEndpointOverride: stripOrNull(process.env[`${envPrefix}_AUTHORIZATION_ENDPOINT`]),
    tokenEndpointOverride: stripOrNull(process.env[`${envPrefix}_TOKEN_ENDPOINT`]),
    redirectUriOverride: stripOrNull(process.env[`${envPrefix}_REDIRECT_URI`]),
    platformTokenPreference: normalizePreference(
      stripOrNull(process.env[`${envPrefix}_PLATFORM_TOKEN_PREFERENCE`]),
      preferenceFallback
    ),
  };
}

export function resolveOidcProvider(raw: string | null): OidcProvider {
  return normalizeProvider(raw);
}

export function readOidcConfig(providerRaw: string | null): OidcProviderConfig | null {
  const provider = normalizeProvider(providerRaw);
  if (provider === OidcProvider.Google) {
    return readProviderConfig({
      provider,
      envPrefix: "GROVE_OIDC_GOOGLE",
      preferenceFallback: PlatformTokenPreference.IdToken,
    });
  }
  if (provider === OidcProvider.Microsoft) {
    return readProviderConfig({
      provider,
      envPrefix: "GROVE_OIDC_MICROSOFT",
      preferenceFallback: PlatformTokenPreference.Auto,
    });
  }
  return readDefaultConfig();
}
