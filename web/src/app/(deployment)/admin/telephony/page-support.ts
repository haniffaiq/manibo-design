import { type AdminAgentDefinitionSummary } from "@/lib/api/admin-agent-definitions";
import {
  type TelephonyNumberView,
  type TelephonyProviderAccountView,
  type TelephonyProviderPackMetadata,
  type TelephonyTrunkView,
} from "@/lib/api/admin-telephony";
import { type AdminTenantSummary } from "@/lib/api/tenants";

import { type TenantPhoneBinding } from "./view-models";

export const EMPTY_PROVIDER_ACCOUNTS: TelephonyProviderAccountView[] = [];
export const EMPTY_PROVIDER_OPTIONS: TelephonyProviderPackMetadata[] = [];
export const EMPTY_TRUNKS: TelephonyTrunkView[] = [];
export const EMPTY_NUMBERS: TelephonyNumberView[] = [];
export const EMPTY_TENANTS: AdminTenantSummary[] = [];
export const EMPTY_BINDINGS: TenantPhoneBinding[] = [];
export const EMPTY_ASSISTANTS: AdminAgentDefinitionSummary[] = [];
