import { afterEach, describe, expect, it, vi } from "vitest";
import { getClinicKnowledgeBase } from "../src/api/clinic-knowledge-base";

type ClinicKnowledgeBaseResponse = {
  doctors: unknown[];
  clinics: Array<{ name: string }>;
};

const originalFetch = globalThis.fetch;

function mockJsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("clinic knowledge base api client", () => {
  it("loads clinic knowledge-base review data", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        specialties: [{ id: "spec-1", name: "Cardiology" }],
        cities: [{ id: "city-1", name: "Vilnius" }],
        clinics: [
          {
            id: "clinic-1",
            city_id: "city-1",
            name: "North Clinic",
            address: "Gedimino pr. 1",
            specialty_ids: ["spec-1"],
          },
        ],
        doctors: [
          {
            id: "doctor-1",
            clinic_id: "clinic-1",
            specialty_id: "spec-1",
            name: "Dr. Example",
          },
        ],
        pricing: [
          {
            specialty_id: "spec-1",
            clinic_id: "clinic-1",
            doctor_id: "doctor-1",
            consultation_fee_eur: 120,
            currency: "EUR",
          },
        ],
      }),
    ) as typeof fetch;

    const response: ClinicKnowledgeBaseResponse = await getClinicKnowledgeBase();

    expect(response.doctors).toHaveLength(1);
    expect(response.clinics[0]?.name).toBe("North Clinic");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/clinic/knowledge-base",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
