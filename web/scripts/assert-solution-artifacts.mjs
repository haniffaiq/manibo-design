import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parseEnabledSolutions, SOLUTION_ROUTE_CONFIGS } from "./solution-route-config.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..");
const appPathRoutesManifestPath = path.join(appRoot, ".next", "app-path-routes-manifest.json");
const routesManifestPath = path.join(appRoot, ".next", "routes-manifest.json");

export function normalizeRoutesManifest(manifest) {
  const rewrites = Array.isArray(manifest.rewrites)
    ? {
        beforeFiles: [],
        afterFiles: manifest.rewrites,
        fallback: [],
      }
    : {
        beforeFiles: Array.isArray(manifest.rewrites?.beforeFiles) ? manifest.rewrites.beforeFiles : [],
        afterFiles: Array.isArray(manifest.rewrites?.afterFiles) ? manifest.rewrites.afterFiles : [],
        fallback: Array.isArray(manifest.rewrites?.fallback) ? manifest.rewrites.fallback : [],
      };

  return {
    ...manifest,
    dataRoutes: Array.isArray(manifest.dataRoutes) ? manifest.dataRoutes : [],
    dynamicRoutes: Array.isArray(manifest.dynamicRoutes) ? manifest.dynamicRoutes : [],
    redirects: Array.isArray(manifest.redirects) ? manifest.redirects : [],
    headers: Array.isArray(manifest.headers) ? manifest.headers : [],
    rewrites,
  };
}

async function normalizeBuiltRoutesManifest() {
  const manifestRaw = await fs.readFile(routesManifestPath, "utf-8");
  const manifest = JSON.parse(manifestRaw);
  const normalizedManifest = normalizeRoutesManifest(manifest);

  if (JSON.stringify(manifest) !== JSON.stringify(normalizedManifest)) {
    await fs.writeFile(routesManifestPath, `${JSON.stringify(normalizedManifest, null, 2)}\n`, "utf-8");
  }
}

async function main() {
  const enabledSolutions = parseEnabledSolutions();
  const manifestRaw = await fs.readFile(appPathRoutesManifestPath, "utf-8");
  const manifest = JSON.parse(manifestRaw);
  const routes = new Set(Object.values(manifest));

  const failures = [];

  for (const config of SOLUTION_ROUTE_CONFIGS) {
    const built = routes.has(config.routePath);
    const shouldExist = enabledSolutions.has(config.solutionName);

    if (shouldExist && !built) {
      failures.push(`Expected ${config.routePath} to be present for solution ${config.solutionName}.`);
    }
    if (!shouldExist && built) {
      failures.push(`Expected ${config.routePath} to be absent because ${config.solutionName} is not enabled.`);
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }

  await normalizeBuiltRoutesManifest();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
