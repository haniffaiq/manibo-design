import { SessionRole } from "./auth";

export interface SolutionNavRoute {
  path: string;
  label: string;
  section: "tenant" | "admin" | "deployment";
  icon: string;
  /** Key into copy.shell.nav for localized label (falls back to `label`). */
  navCopyKey?: string;
  navGroup?: string;
  navPriority?: number;
  roles?: SessionRole[];
}

export interface SolutionObservabilityContribution {
  key: string;
  label: string;
  detail: string;
  state: "live" | "partial" | "planned";
}

export interface SolutionUIManifest {
  id: string;
  name: string;
  navLabel?: string;
  defaultTenantRoute?: string;
  routes: SolutionNavRoute[];
  observability?: SolutionObservabilityContribution[];
}
