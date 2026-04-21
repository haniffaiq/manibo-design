import { toErrorMessage } from "@grove/web-shared/lib/error-message";

export function tenantLoadErrorMessage(error: unknown): string {
  const message = toErrorMessage(error).toLowerCase();
  if (message.includes("unauthorized") || message.includes("forbidden")) {
    return "You do not have permission to view tenant administration for this deployment.";
  }
  return "The tenant list is unavailable right now. Refresh the page or try again in a moment.";
}

export function tenantActionErrorMessage(error: unknown): string {
  const message = toErrorMessage(error).toLowerCase();
  if (message.includes("tenant provisioning is still in progress")) {
    return "Tenant setup is still running. Wait for provisioning to finish before changing access or retrying onboarding.";
  }
  if (message.includes("tenant suspended")) {
    return "This tenant is suspended. Restore access before asking the team to sign in again.";
  }
  if (message.includes("tenant not found")) {
    return "That tenant record is no longer available. Refresh the list and try again.";
  }
  if (message.includes("already belongs to a different tenant")) {
    return "This admin email already belongs to a different tenant. Use a different admin email or move the user first.";
  }
  if (message.includes("already has a different oidc subject") || message.includes("oidc subject already belongs")) {
    return "This sign-in account is already linked to a different user. Use a different admin account or clear the existing link first.";
  }
  if (message.includes("oidc issuer already exists") || message.includes("oidc issuer already registered")) {
    return "This staff sign-in provider is already assigned to a different tenant.";
  }
  if (message.includes("phone number") && message.includes("already belongs to tenant")) {
    return "This phone number is already assigned to a different tenant.";
  }
  if (message.includes("conflict")) {
    return "Another tenant workflow is still running. Wait for it to finish before trying again.";
  }
  return "We could not complete that tenant change. Refresh and try again. If it keeps failing, contact platform support.";
}
