export function normalizeWorkflowLabel(workflowType: string): string {
  const tail = workflowType.split(".").at(-1) ?? workflowType;
  return tail.replace(/workflow$/i, "").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
}

type BookingsSolutionFlags = {
  buildEnabled: boolean;
  isLoading: boolean;
  error: unknown;
  tenantEnabled: boolean;
};

export function bookingsGuidanceDetail(flags: BookingsSolutionFlags): string {
  if (!flags.buildEnabled) return "Use the live intervention tools here. This deployment does not include the bookings workspace.";
  if (flags.isLoading) return "Use the live intervention tools here while we confirm whether this tenant can open the bookings workspace.";
  if (flags.error) return "Use the live intervention tools here until bookings access can be confirmed.";
  if (!flags.tenantEnabled) return "Use the live intervention tools here. This tenant does not have the bookings workspace enabled.";
  return "Keep the live intervention and the post-call booking workspace tied together.";
}

export function bookingsUnavailableNote(flags: BookingsSolutionFlags): string | null {
  if (!flags.buildEnabled) return "Clinic bookings are not part of this deployment.";
  if (flags.isLoading) return "Checking whether bookings is available for this tenant.";
  if (flags.error) return "Could not confirm bookings availability. Stay in this live support workflow for now.";
  if (!flags.tenantEnabled) return "Bookings are not enabled for this tenant.";
  return null;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "\u2014";
  }
  return new Date(value).toLocaleString();
}
