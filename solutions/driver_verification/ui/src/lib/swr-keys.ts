/**
 * Centralized SWR cache key factories for the driver_verification solution UI.
 */

/* ------------------------------------------------------------------ */
/*  Dashboard widget                                                  */
/* ------------------------------------------------------------------ */

export const driverDashboardActive = () => "driver-dashboard-active" as const;
export const driverDashboardPaused = () => "driver-dashboard-paused" as const;
export const driverDashboardJobs = () => "driver-dashboard-jobs" as const;

/* ------------------------------------------------------------------ */
/*  Drivers page                                                      */
/* ------------------------------------------------------------------ */

export const driverVerificationDrivers = (active: boolean | undefined) =>
  ["driver-verification-drivers", active] as const;
export const driverVerificationJobs = () => ["driver-verification-jobs"] as const;
