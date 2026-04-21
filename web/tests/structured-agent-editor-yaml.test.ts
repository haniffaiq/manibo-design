import { describe, expect, it } from "vitest";

import {
  safeParseDocument,
  yamlCollectionKeys,
  yamlStringList,
} from "@/app/(deployment)/admin/agent-definitions/structured-agent-editor-yaml";

describe("structured agent editor YAML helpers", () => {
  it("treats YAML syntax errors as unparseable", () => {
    expect(safeParseDocument("name: ok\nplugins:\n  broken: [")).toBeNull();
  });

  it("reads plugin keys from YAML map nodes", () => {
    const doc = safeParseDocument(
      "plugins:\n  appointment_booking:\n    enabled: true\n  handoff:\n    enabled: false\n",
    );
    expect(doc).not.toBeNull();
    expect(yamlCollectionKeys(doc?.getIn(["plugins"]))).toEqual([
      "appointment_booking",
      "handoff",
    ]);
  });

  it("reads disclosure strings from YAML sequences", () => {
    const doc = safeParseDocument(
      "guardrails:\n  required_disclosures:\n    - Calls are recorded\n    - AI assistant may transfer you\n",
    );
    expect(doc).not.toBeNull();
    expect(yamlStringList(doc?.getIn(["guardrails", "required_disclosures"]))).toEqual([
      "Calls are recorded",
      "AI assistant may transfer you",
    ]);
  });
});
