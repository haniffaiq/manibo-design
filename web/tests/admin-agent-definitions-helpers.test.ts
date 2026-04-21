import { describe, expect, it } from "vitest";

import {
  applyYamlName,
  defaultVersionYaml,
  initialVersionYaml,
  type AgentStarter,
} from "@/app/(deployment)/admin/agent-definitions/helpers";

const CLINIC_STARTER: AgentStarter = {
  key: "clinic_registration",
  title: "Clinic registration",
  recommended_definition_name: "clinic_registrator",
  solution: "appointment_booking",

  summary: "Lithuanian clinic booking starter.",
  yaml: "name: clinic-registration\nmission: register clinic appointments\nplugins:\n  appointment_booking:\n    enabled: true\n",
};

const DRIVER_STARTER: AgentStarter = {
  key: "driver_verification",
  title: "Driver verification",
  recommended_definition_name: "driver_verification",
  solution: "driver_verification",

  summary: "Lithuanian driver verification starter.",
  yaml: "agent:\n  name: hoptrans-driver-verification\n  mission: verify drivers\n",
};

describe("admin agent definition helpers", () => {
  it("uses a minimal blank skeleton when no starter matches", () => {
    expect(defaultVersionYaml("custom_agent")).toBe("name: custom_agent\nmission: describe your agent mission\n");
    expect(initialVersionYaml("custom_agent", [])).toBe(defaultVersionYaml("custom_agent"));
  });

  it("applies a chosen starter even when the definition name changes", () => {
    expect(initialVersionYaml("custom_clinic", [CLINIC_STARTER], CLINIC_STARTER.key)).toContain("name: custom_clinic");
    expect(initialVersionYaml("custom_clinic", [CLINIC_STARTER], CLINIC_STARTER.key)).toContain("appointment_booking");
  });

  it("keeps the blank-agent path blank when explicitly requested", () => {
    expect(initialVersionYaml("clinic_registrator", [CLINIC_STARTER], "blank")).toBe(defaultVersionYaml("clinic_registrator"));
  });

  it("still infers a starter from the recommended name when no explicit starter is provided", () => {
    expect(initialVersionYaml("clinic_registrator", [CLINIC_STARTER])).toContain("appointment_booking");
  });

  it("rewrites nested agent.name starters", () => {
    expect(applyYamlName(DRIVER_STARTER.yaml, "my_driver_agent")).toContain("name: my_driver_agent");
    expect(applyYamlName(DRIVER_STARTER.yaml, "my_driver_agent")).not.toContain("hoptrans-driver-verification");
  });
});
