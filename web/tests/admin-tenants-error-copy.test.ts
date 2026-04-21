import { describe, expect, it } from "vitest";

import { PlatformApiError } from "@/lib/api/platform";
import { tenantActionErrorMessage, tenantLoadErrorMessage } from "@/app/(deployment)/admin/tenants/error-copy";

describe("tenant admin error copy", () => {
  it("shows a specific onboarding message for cross-tenant admin reuse", () => {
    const error = new PlatformApiError(
      "409 Conflict: User 123 already belongs to a different tenant_id=abc, cannot onboard for def",
      409,
    );

    expect(tenantActionErrorMessage(error)).toBe(
      "This admin email already belongs to a different tenant. Use a different admin email or move the user first.",
    );
  });

  it("keeps workflow-in-progress copy for generic conflicts", () => {
    const error = new PlatformApiError("409 Conflict: Tenant provisioning is still in progress", 409);

    expect(tenantActionErrorMessage(error)).toBe(
      "Tenant setup is still running. Wait for provisioning to finish before changing access or retrying onboarding.",
    );
  });

  it("maps OIDC issuer conflicts to provider-assignment copy", () => {
    const error = new PlatformApiError("409 Conflict: OIDC issuer already exists", 409);

    expect(tenantActionErrorMessage(error)).toBe(
      "This staff sign-in provider is already assigned to a different tenant.",
    );
  });

  it("maps suspended load failures to deployment permission copy", () => {
    const error = new PlatformApiError("403 Forbidden: tenant suspended", 403);

    expect(tenantLoadErrorMessage(error)).toBe(
      "You do not have permission to view tenant administration for this deployment.",
    );
  });
});
