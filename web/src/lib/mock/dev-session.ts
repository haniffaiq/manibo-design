/**
 * Dev-only session payload mocking.
 *
 * Recognises `dev:<user_uuid>` bearer tokens and returns a `/auth/session`
 * payload shape for the local design pack, so the UI can be exercised
 * without a real backend at GROVE_API_BASE_URL.
 *
 * The fixed UUIDs below are wired to the canned identities described in
 * frontend-web-app-design-pack.md (Northstar Mobility tenant).
 */

import { SessionRole } from "@/lib/auth_types";

export const SUPER_ADMIN_USER_ID = "00000000-0000-4000-a000-000000000099";
export const TENANT_ADMIN_USER_ID = "00000000-0000-4000-a000-000000000010";
export const TENANT_OPERATOR_USER_ID = "00000000-0000-4000-a000-000000000020";

const TENANT_ID = "ten_01JTNORTHSTAR0001";
const TENANT_NAME = "Northstar Mobility";

export type DevSessionPayload = {
  user_id: string;
  tenant_id: string;
  role: SessionRole;
  email: string;
  tenant_name: string;
};

const DEV_IDENTITIES: Record<string, DevSessionPayload> = {
  [SUPER_ADMIN_USER_ID]: {
    user_id: SUPER_ADMIN_USER_ID,
    tenant_id: TENANT_ID,
    role: SessionRole.SuperAdmin,
    email: "platform-admin@manibo.dev",
    tenant_name: TENANT_NAME,
  },
  [TENANT_ADMIN_USER_ID]: {
    user_id: TENANT_ADMIN_USER_ID,
    tenant_id: TENANT_ID,
    role: SessionRole.ClientAdmin,
    email: "ayu@northstar.example",
    tenant_name: TENANT_NAME,
  },
  [TENANT_OPERATOR_USER_ID]: {
    user_id: TENANT_OPERATOR_USER_ID,
    tenant_id: TENANT_ID,
    role: SessionRole.ClientOperator,
    email: "bagas@northstar.example",
    tenant_name: TENANT_NAME,
  },
};

const DEV_TOKEN_PREFIX = "dev:";

export function resolveDevSession(bearerToken: string): DevSessionPayload | null {
  if (!bearerToken.startsWith(DEV_TOKEN_PREFIX)) {
    return null;
  }
  const subject = bearerToken.slice(DEV_TOKEN_PREFIX.length).trim();
  if (!subject) {
    return null;
  }
  const known = DEV_IDENTITIES[subject];
  if (known) {
    return known;
  }
  // Unknown dev subject: treat as a generic super admin so design exploration
  // does not get blocked. Email is synthesised from the subject string.
  return {
    user_id: subject,
    tenant_id: TENANT_ID,
    role: SessionRole.SuperAdmin,
    email: `${subject}@dev.local`,
    tenant_name: TENANT_NAME,
  };
}
