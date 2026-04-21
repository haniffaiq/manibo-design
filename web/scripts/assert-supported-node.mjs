import { pathToFileURL } from "node:url";

const SUPPORTED_RANGES = [
  { major: 20, minMinor: 19 },
  { major: 22, minMinor: 12 },
];

function formatSupportedRanges() {
  return SUPPORTED_RANGES.map(({ major, minMinor }) => `${major}.${minMinor}+`).join(" or ");
}

function formatNvmTargets() {
  return SUPPORTED_RANGES.map(({ major }) => `\`nvm use ${major}\``).join(" or ");
}

export function parseNodeVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function isSupportedNodeVersion(version) {
  const parsed = parseNodeVersion(version);
  if (parsed == null) {
    return false;
  }

  return SUPPORTED_RANGES.some(({ major, minMinor }) => parsed.major === major && parsed.minor >= minMinor);
}

export function getUnsupportedNodeMessage(version) {
  return [
    `Unsupported Node.js runtime: ${version}.`,
    `Frontend automation in this repo requires Node.js ${formatSupportedRanges()}.`,
    `Use ${formatNvmTargets()} before running Playwright or the web UI harness.`,
  ].join(" ");
}

export function assertSupportedNodeVersion(version = process.versions.node) {
  if (!isSupportedNodeVersion(version)) {
    throw new Error(getUnsupportedNodeMessage(version));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    assertSupportedNodeVersion();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
