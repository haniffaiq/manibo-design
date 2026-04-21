function parseBuildEnabledSolutions(
  rawValue = process.env.NEXT_PUBLIC_SOLUTIONS ?? "appointment_booking,driver_verification",
): Set<string> {
  return new Set(
    rawValue
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
  );
}

const BUILD_ENABLED_SOLUTIONS = parseBuildEnabledSolutions();

export function isBuildEnabledSolution(solutionName: string): boolean {
  return BUILD_ENABLED_SOLUTIONS.has(solutionName);
}
