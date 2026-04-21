import { describe, expect, it } from "vitest";

import { parseFlowDefinition } from "@/components/observe/flow-graph-dag";

const CLINIC_YAML_SNIPPET = `
name: clinic-registration
model:
  provider: vertex_ai
  model: gemini-2.5-flash

flow_definition:
  entry_point: greeting
  nodes:
    greeting:
      instructions: >
        Greet in Lithuanian.
    specialty_selection:
      instructions: >
        Use search_clinic_booking_options.
      tools:
        - search_clinic_booking_options
      route_decision:
        allowed_routes:
          - continue
          - handoff
    handoff:
      instructions: >
        Hand off to human.
      tools:
        - request_human_handoff
  edges:
    - source: greeting
      target: specialty_selection
    - source: handoff
      target: __end__
  conditional_edges:
    - source: specialty_selection
      condition_field: route
      targets:
        continue: greeting
        handoff: handoff
`;

describe("parseFlowDefinition", () => {
  it("parses a valid YAML flow definition", () => {
    const result = parseFlowDefinition(CLINIC_YAML_SNIPPET);
    expect(result).not.toBeNull();
    expect(result!.entryPoint).toBe("greeting");
    expect(result!.nodes).toHaveLength(3);
    expect(result!.nodes.map((n) => n.name)).toEqual(["greeting", "specialty_selection", "handoff"]);
  });

  it("extracts tools and route_decision from nodes", () => {
    const result = parseFlowDefinition(CLINIC_YAML_SNIPPET)!;
    const specialtyNode = result.nodes.find((n) => n.name === "specialty_selection");
    expect(specialtyNode?.tools).toEqual(["search_clinic_booking_options"]);
    expect(specialtyNode?.hasRouteDecision).toBe(true);

    const greetingNode = result.nodes.find((n) => n.name === "greeting");
    expect(greetingNode?.tools).toEqual([]);
    expect(greetingNode?.hasRouteDecision).toBe(false);
  });

  it("extracts unconditional edges", () => {
    const result = parseFlowDefinition(CLINIC_YAML_SNIPPET)!;
    const unconditional = result.edges.filter((e) => e.label === null);
    expect(unconditional).toContainEqual({ source: "greeting", target: "specialty_selection", label: null });
    expect(unconditional).toContainEqual({ source: "handoff", target: "__end__", label: null });
  });

  it("extracts conditional edges with labels", () => {
    const result = parseFlowDefinition(CLINIC_YAML_SNIPPET)!;
    const conditional = result.edges.filter((e) => e.label !== null);
    expect(conditional).toContainEqual({ source: "specialty_selection", target: "greeting", label: "continue" });
    expect(conditional).toContainEqual({ source: "specialty_selection", target: "handoff", label: "handoff" });
  });

  it("returns null for YAML without flow_definition", () => {
    expect(parseFlowDefinition("name: test\nmodel:\n  provider: openai")).toBeNull();
  });

  it("returns null for malformed YAML", () => {
    expect(parseFlowDefinition("{not: valid: yaml: {{{{")).toBeNull();
  });

  it("handles empty nodes and edges gracefully", () => {
    const yaml = `
flow_definition:
  entry_point: start
  nodes: {}
  edges: []
  conditional_edges: []
`;
    const result = parseFlowDefinition(yaml);
    expect(result).not.toBeNull();
    expect(result!.nodes).toHaveLength(0);
    expect(result!.edges).toHaveLength(0);
  });
});
