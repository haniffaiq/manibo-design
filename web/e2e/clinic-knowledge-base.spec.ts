import { test, expect } from "./harness";
import { isBuildEnabledSolution } from "./build-solutions";
import { primeSessionCookie } from "./session-helpers";

const mockKnowledgeBase = {
  specialties: [
    { id: "spec-1", name: "Cardiology" },
    { id: "spec-2", name: "Dermatology" },
    { id: "spec-3", name: "Neurology" },
  ],
  cities: [
    { id: "city-1", name: "Vilnius" },
    { id: "city-2", name: "Kaunas" },
  ],
  clinics: [
    {
      id: "clinic-1",
      city_id: "city-1",
      name: "Vilnius Central Clinic",
      address: "Gedimino pr. 1",
      specialty_ids: ["spec-1", "spec-2"],
    },
    {
      id: "clinic-2",
      city_id: "city-2",
      name: "Kaunas Medical Center",
      address: "Laisves al. 10",
      specialty_ids: ["spec-3"],
    },
  ],
  doctors: [
    {
      id: "doc-1",
      clinic_id: "clinic-1",
      specialty_id: "spec-1",
      name: "Dr. Jonas Petraitis",
    },
    {
      id: "doc-2",
      clinic_id: "clinic-1",
      specialty_id: "spec-2",
      name: "Dr. Ona Kazlauskas",
    },
    {
      id: "doc-3",
      clinic_id: "clinic-2",
      specialty_id: "spec-3",
      name: "Dr. Vytautas Zukauskas",
    },
  ],
  pricing: [
    {
      specialty_id: "spec-1",
      clinic_id: "clinic-1",
      doctor_id: "doc-1",
      consultation_fee_eur: 89,
      currency: "EUR",
    },
    {
      specialty_id: "spec-2",
      clinic_id: "clinic-1",
      doctor_id: "doc-2",
      consultation_fee_eur: 75,
      currency: "EUR",
    },
    {
      specialty_id: "spec-3",
      clinic_id: "clinic-2",
      doctor_id: "doc-3",
      consultation_fee_eur: 95,
      currency: "EUR",
    },
  ],
};

const collisionKnowledgeBase = {
  specialties: [
    { id: "spec-1", name: "Cardiology" },
    { id: "spec-2", name: "Cardiology" },
  ],
  cities: [
    { id: "city-1", name: "Vilnius" },
    { id: "city-2", name: "Kaunas" },
  ],
  clinics: [
    {
      id: "clinic-1",
      city_id: "city-1",
      name: "North Clinic",
      address: "Gedimino pr. 1",
      specialty_ids: ["spec-1"],
    },
    {
      id: "clinic-2",
      city_id: "city-2",
      name: "North Clinic",
      address: "Laisves al. 10",
      specialty_ids: ["spec-2"],
    },
  ],
  doctors: [
    {
      id: "doc-1",
      clinic_id: "clinic-1",
      specialty_id: "spec-1",
      name: "Dr. Alpha",
    },
    {
      id: "doc-2",
      clinic_id: "clinic-2",
      specialty_id: "spec-2",
      name: "Dr. Beta",
    },
  ],
  pricing: [
    {
      specialty_id: "spec-1",
      clinic_id: "clinic-1",
      doctor_id: "doc-1",
      consultation_fee_eur: 89,
      currency: "EUR",
    },
    {
      specialty_id: "spec-2",
      clinic_id: "clinic-2",
      doctor_id: "doc-2",
      consultation_fee_eur: 95,
      currency: "EUR",
    },
  ],
};

test.describe("clinic knowledge-base", () => {
  test.skip(!isBuildEnabledSolution("appointment_booking"), "Appointment booking route is excluded from this build.");

  test("page loads with stats cards and data", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/clinic/knowledge-base", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockKnowledgeBase),
      });
    });

    await page.goto("/clinic/knowledge-base");

    await expect(page.getByRole("heading", { name: "Clinic Knowledge Base" })).toBeVisible();

    await expect(page.getByTestId("stat-specialties")).toHaveText("3");
    await expect(page.getByTestId("stat-cities")).toHaveText("2");
    await expect(page.getByTestId("stat-locations")).toHaveText("2");

    await expect(page.getByRole("heading", { name: "Doctors" })).toBeVisible();
    await expect(page.getByTestId("doctor-name-doc-1")).toBeVisible();
    await expect(page.getByText("Dr. Jonas Petraitis")).toBeVisible();

    await expect(page.getByRole("heading", { name: "Locations" })).toBeVisible();
    await expect(page.getByTestId("clinic-location-clinic-1")).toBeVisible();
    await expect(page.getByTestId("clinic-location-clinic-1").getByText("Vilnius Central Clinic")).toBeVisible();
  });

  test("doctor cards show name, specialty, location, and price", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/clinic/knowledge-base", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockKnowledgeBase),
      });
    });

    await page.goto("/clinic/knowledge-base");

    await expect(page.getByTestId("doctor-name-doc-1")).toBeVisible();
    await expect(page.getByTestId("doctor-name-doc-1")).toHaveText("Dr. Jonas Petraitis");
    await expect(page.getByTestId("doctor-specialty-doc-1")).toHaveText("Cardiology");
    await expect(page.getByTestId("doctor-clinic-doc-1")).toHaveText("Vilnius Central Clinic");
    await expect(page.getByTestId("doctor-price-doc-1")).toBeVisible();
  });

  test("locations list shows addresses and specialties", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/clinic/knowledge-base", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockKnowledgeBase),
      });
    });

    await page.goto("/clinic/knowledge-base");

    const locationCard = page.getByTestId("clinic-location-clinic-1");
    await expect(locationCard).toBeVisible();
    await expect(locationCard.getByText("Vilnius Central Clinic")).toBeVisible();
    await expect(locationCard.getByText("Vilnius", { exact: true })).toBeVisible();
    await expect(locationCard.getByText("Gedimino pr. 1")).toBeVisible();
    await expect(locationCard.getByText("Cardiology")).toBeVisible();
    await expect(locationCard.getByText("Dermatology")).toBeVisible();
  });

  test("search by doctor name filters results", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/clinic/knowledge-base", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockKnowledgeBase),
      });
    });

    await page.goto("/clinic/knowledge-base");

    await page.getByPlaceholder("Doctor name").fill("Jonas");

    await expect(page.getByTestId("doctor-name-doc-1")).toBeVisible();
    await expect(page.getByTestId("doctor-name-doc-2")).not.toBeVisible();
    await expect(page.getByTestId("doctor-name-doc-3")).not.toBeVisible();
  });

  test("search by specialty filters results", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/clinic/knowledge-base", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockKnowledgeBase),
      });
    });

    await page.goto("/clinic/knowledge-base");

    await page.getByTestId("clinic-kb-specialty").selectOption("spec-1");

    await expect(page.getByTestId("doctor-name-doc-1")).toBeVisible();
    await expect(page.getByTestId("doctor-name-doc-2")).not.toBeVisible();
    await expect(page.getByTestId("doctor-name-doc-3")).not.toBeVisible();
  });

  test("search by location filters results", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/clinic/knowledge-base", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockKnowledgeBase),
      });
    });

    await page.goto("/clinic/knowledge-base");

    await page.getByTestId("clinic-kb-location").selectOption("clinic-2");

    await expect(page.getByTestId("doctor-name-doc-1")).not.toBeVisible();
    await expect(page.getByTestId("doctor-name-doc-2")).not.toBeVisible();
    await expect(page.getByTestId("doctor-name-doc-3")).toBeVisible();
  });

  test("filters by selected IDs when specialty and clinic names collide", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/clinic/knowledge-base", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(collisionKnowledgeBase),
      });
    });

    await page.goto("/clinic/knowledge-base");

    await expect(page.locator("#clinic-kb-specialty option")).toHaveText([
      "All Specialties",
      "Cardiology (spec-1)",
      "Cardiology (spec-2)",
    ]);
    await expect(page.locator("#clinic-kb-location option")).toHaveText([
      "All Locations",
      "North Clinic (Vilnius, Gedimino pr. 1)",
      "North Clinic (Kaunas, Laisves al. 10)",
    ]);

    await page.getByTestId("clinic-kb-specialty").selectOption("spec-1");
    await expect(page.getByTestId("doctor-name-doc-1")).toBeVisible();
    await expect(page.getByTestId("doctor-name-doc-2")).not.toBeVisible();

    await page.getByTestId("clinic-kb-specialty").selectOption("");
    await page.getByTestId("clinic-kb-location").selectOption("clinic-2");
    await expect(page.getByTestId("doctor-name-doc-1")).not.toBeVisible();
    await expect(page.getByTestId("doctor-name-doc-2")).toBeVisible();
  });

  test("empty state shows when no search results", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/clinic/knowledge-base", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockKnowledgeBase),
      });
    });

    await page.goto("/clinic/knowledge-base");

    await page.getByPlaceholder("Doctor name").fill("NonexistentDoctor");

    await expect(page.getByTestId("doctor-name-doc-1")).not.toBeVisible();
    await expect(page.getByTestId("doctor-name-doc-2")).not.toBeVisible();
    await expect(page.getByTestId("doctor-name-doc-3")).not.toBeVisible();
  });

  test("responsive design works on mobile viewport", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.setViewportSize({ width: 375, height: 667 });

    await page.route("**/api/platform/clinic/knowledge-base", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockKnowledgeBase),
      });
    });

    await page.goto("/clinic/knowledge-base");

    await expect(page.getByRole("heading", { name: "Clinic Knowledge Base" })).toBeVisible();
    await expect(page.getByTestId("doctor-name-doc-1")).toBeVisible();
    await expect(page.getByTestId("clinic-location-clinic-1")).toBeVisible();
  });

  test("responsive design works on tablet viewport", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.setViewportSize({ width: 768, height: 1024 });

    await page.route("**/api/platform/clinic/knowledge-base", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockKnowledgeBase),
      });
    });

    await page.goto("/clinic/knowledge-base");

    await expect(page.getByRole("heading", { name: "Clinic Knowledge Base" })).toBeVisible();
    await expect(page.getByTestId("doctor-name-doc-1")).toBeVisible();
    await expect(page.getByTestId("clinic-location-clinic-1")).toBeVisible();
  });

  test("proper heading structure for accessibility", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/clinic/knowledge-base", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockKnowledgeBase),
      });
    });

    await page.goto("/clinic/knowledge-base");

    const h1Headings = await page.locator("h1").count();
    expect(h1Headings).toBeGreaterThanOrEqual(1);

    const h2Headings = await page.locator("h2").count();
    expect(h2Headings).toBeGreaterThanOrEqual(2);
  });

  test("touch targets are adequate on mobile", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.setViewportSize({ width: 375, height: 667 });

    await page.route("**/api/platform/clinic/knowledge-base", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockKnowledgeBase),
      });
    });

    await page.goto("/clinic/knowledge-base");

    const searchInput = page.getByTestId("clinic-kb-search");
    const boundingBox = await searchInput.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThanOrEqual(40);
  });

  test.describe("API error handling", () => {
    test.use({
      allowConsoleErrors: [/500 \(Internal Server Error\)/],
      allowRequestFailures: [/\/api\/platform\/clinic\/knowledge-base$/],
    });

    test("shows error state when API fails", async ({ page }) => {
      await primeSessionCookie(page, "client_admin");

      await page.route("**/api/platform/clinic/knowledge-base", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Internal server error" }),
        });
      });

      await page.goto("/clinic/knowledge-base");

      await expect(page.getByRole("heading", { name: "Clinic Knowledge Base" })).toBeVisible();

      // Stat cards show dash instead of 0
      await expect(page.getByTestId("stat-doctors")).toHaveText("\u2014");
      await expect(page.getByTestId("stat-locations")).toHaveText("\u2014");
      await expect(page.getByTestId("stat-specialties")).toHaveText("\u2014");
      await expect(page.getByTestId("stat-cities")).toHaveText("\u2014");

      // All three content sections show error boxes
      await expect(page.getByTestId("clinic-kb-error")).toBeVisible();
      await expect(page.getByTestId("clinic-kb-locations-error")).toBeVisible();
      await expect(page.getByTestId("clinic-kb-specialties-error")).toBeVisible();
    });
  });
});
