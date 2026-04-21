import { PlatformApiError } from "../api/platform";

/**
 * Extract a human-readable message from an unknown error.
 * Handles PlatformApiError (structured API errors) and generic Error instances.
 */
export function toErrorMessage(error: unknown, fallback = "Unexpected error"): string {
  if (error instanceof PlatformApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
