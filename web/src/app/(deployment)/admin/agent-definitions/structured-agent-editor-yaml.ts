import { Document, isMap, isScalar, isSeq, parseDocument } from "yaml";

function scalarString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (isScalar(value) && typeof value.value === "string") {
    return value.value;
  }
  if (isScalar(value) && (typeof value.value === "number" || typeof value.value === "boolean")) {
    return String(value.value);
  }
  return null;
}

export function safeParseDocument(yamlStr: string): Document | null {
  try {
    const parsed = parseDocument(yamlStr, { keepSourceTokens: true });
    return parsed.errors.length > 0 ? null : parsed;
  } catch {
    return null;
  }
}

export function yamlCollectionKeys(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (isMap(value)) {
    return value.items
      .map((item) => scalarString(item.key))
      .filter((key): key is string => Boolean(key));
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return Object.keys(value as Record<string, unknown>);
  }
  return [];
}

export function yamlStringList(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (isSeq(value)) {
    return value.items
      .map((item) => scalarString(item))
      .filter((item): item is string => item !== null);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => scalarString(item))
      .filter((item): item is string => item !== null);
  }
  return [];
}
