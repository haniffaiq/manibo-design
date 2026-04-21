export enum SessionRole {
  SuperAdmin = "super_admin",
  ClientAdmin = "client_admin",
  ClientOperator = "client_operator",
}

const SESSION_ROLE_VALUES = new Set<string>(Object.values(SessionRole));

export function isSessionRole(value: unknown): value is SessionRole {
  return typeof value === "string" && SESSION_ROLE_VALUES.has(value);
}
