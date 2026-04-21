const TRUTHY_ENV_VALUES = new Set(["1", "true", "yes"]);

export const DEV_AUTH_PRODUCTION_ERROR =
  "Dev auth flags are not allowed when NODE_ENV=production. Disable SKIP_AUTH and NEXT_PUBLIC_ENABLE_TEST_AUTH.";

function normalizeEnvValue(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export function isSkipAuthEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return TRUTHY_ENV_VALUES.has(normalizeEnvValue(env.SKIP_AUTH));
}

export function assertSafeDevAuthFlags(env: NodeJS.ProcessEnv = process.env): void {
  if (normalizeEnvValue(env.NODE_ENV) !== "production") {
    return;
  }
  if (isSkipAuthEnabled(env) || env.NEXT_PUBLIC_ENABLE_TEST_AUTH === "true") {
    throw new Error(DEV_AUTH_PRODUCTION_ERROR);
  }
}

export function isExplicitTestAuthEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  assertSafeDevAuthFlags(env);
  return env.NEXT_PUBLIC_ENABLE_TEST_AUTH === "true";
}
