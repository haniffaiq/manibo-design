import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

export const SOLUTION_UI_CONFIGS = [
  {
    solutionName: "appointment_booking",
    sourceDirectory: "appointment-booking",
    routePath: "/bookings",
    routeSegments: ["bookings"],
    sourceModule: "@solution/appointment-booking-ui/bookings-page",
    manifestModule: "@solution/appointment-booking-ui/manifest",
    dashboardWidgetName: "ClinicDashboardWidget",
    dashboardWidgetModule: "@solution/appointment-booking-ui/widgets/dashboard-widget",
  },
  {
    solutionName: "driver_verification",
    sourceDirectory: "driver-verification",
    routePath: "/driver-verification/drivers",
    routeSegments: ["driver-verification", "drivers"],
    sourceModule: "@solution/driver-verification-ui/drivers-page",
    manifestModule: "@solution/driver-verification-ui/manifest",
    dashboardWidgetName: "DriverDashboardWidget",
    dashboardWidgetModule: "@solution/driver-verification-ui/widgets/dashboard-widget",
  },
];

export const SOLUTION_ROUTE_CONFIGS = SOLUTION_UI_CONFIGS.map(
  ({ solutionName, routePath, routeSegments, sourceModule }) => ({
    solutionName,
    routePath,
    routeSegments,
    sourceModule,
  }),
);

const SOLUTION_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

function solutionPackageInstalled(solutionName) {
  // Check if the @solution/*-ui package is actually installed in the workspace.
  // When a solution is excluded from pnpm-workspace.yaml, its node_modules link
  // won't exist even if the source directory is present on disk.
  const config = SOLUTION_UI_CONFIGS.find((c) => c.solutionName === solutionName);
  if (!config) return false;
  try {
    // Try to resolve the manifest module via Node's module resolution.
    // This correctly returns false when the package is in the repo but
    // not listed in the active pnpm-workspace.yaml.
    import.meta.resolve(config.manifestModule);
    return true;
  } catch {
    return false;
  }
}

export function defaultEnabledSolutions() {
  return new Set(
    SOLUTION_UI_CONFIGS.filter((config) => solutionPackageInstalled(config.solutionName)).map(
      (config) => config.solutionName,
    ),
  );
}

export function parseEnabledSolutions(rawValue = process.env.NEXT_PUBLIC_SOLUTIONS ?? "") {
  const values = rawValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (values.length === 0) {
    return defaultEnabledSolutions();
  }

  for (const value of values) {
    if (!SOLUTION_NAME_PATTERN.test(value)) {
      throw new Error(`Invalid solution id "${value}" in NEXT_PUBLIC_SOLUTIONS.`);
    }
  }

  return new Set(values);
}

export function enabledRouteConfigs(enabledSolutions) {
  return SOLUTION_ROUTE_CONFIGS.filter((config) => enabledSolutions.has(config.solutionName));
}

export function enabledSolutionUiConfigs(enabledSolutions) {
  return SOLUTION_UI_CONFIGS.filter((config) => enabledSolutions.has(config.solutionName));
}
