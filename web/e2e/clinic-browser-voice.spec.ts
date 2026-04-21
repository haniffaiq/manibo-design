import { expect } from "@playwright/test";

import { test } from "./harness";
import { isBuildEnabledSolution } from "./build-solutions";
import { primeSessionCookie } from "./session-helpers";
import { maybeWriteBrowserVoiceEvalArtifact } from "./voice-eval";

async function installFakeClinicRoom(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const scope = window as typeof window & {
      __clinicVoiceEvents?: unknown[];
      __GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__?: () => unknown;
    };

    scope.__clinicVoiceEvents = [];
    if (!navigator.mediaDevices) {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: { getUserMedia: async () => ({}) },
      });
    }

    scope.__GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__ = () => {
      const listeners = new Set<{
        onStateChange?: (state: "connected" | "disconnected" | "reconnecting") => void;
        onDisconnected?: (reason?: string) => void;
      }>();

      return {
        name: "clinic-browser-123",
        canPlaybackAudio: true,
        subscribe(events: {
          onStateChange?: (state: "connected" | "disconnected" | "reconnecting") => void;
          onDisconnected?: (reason?: string) => void;
        }) {
          listeners.add(events);
          return () => listeners.delete(events);
        },
        async connect(url: string, token: string) {
          scope.__clinicVoiceEvents?.push({ type: "connect", url, token });
          listeners.forEach((listener) => listener.onStateChange?.("connected"));
        },
        async startAudio() {
          scope.__clinicVoiceEvents?.push({ type: "startAudio" });
        },
        async setMicrophoneEnabled(enabled: boolean) {
          scope.__clinicVoiceEvents?.push({ type: "microphone", enabled });
        },
        disconnect() {
          scope.__clinicVoiceEvents?.push({ type: "disconnect" });
          listeners.forEach((listener) => listener.onDisconnected?.());
        },
      };
    };
  });
}

async function stubClinicBookingsWorkspace(page: import("@playwright/test").Page) {
  await page.route("**/api/platform/solutions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        solutions: [
          {
            solution_name: "appointment_booking",
            enabled: true,
            version: "1.0.0",
            description: "Clinic booking workspace.",
            requires_enabled: [],
            optional_enabled: [],
            desired_revision: "latest",
            active_revision: "2026-03-01",
          },
        ],
      }),
    });
  });

  await page.route("**/api/platform/clinic/booking-results**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: [], total: 0, limit: 50, offset: 0 }),
    });
  });

  await page.route("**/api/platform/clinic/follow-ups**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [],
        summary: {
          total: 0,
          urgent: 0,
          normal: 0,
          open: 0,
          claimed: 0,
          resolved: 0,
          handed_off: 0,
          pending: 0,
          failed: 0,
        },
        limit: 50,
        offset: 0,
      }),
    });
  });

  await page.route("**/api/platform/team/users", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ users: [] }),
    });
  });

  await page.route("**/api/platform/clinic/integration-status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ overall_status: "ready", integrations: [] }),
    });
  });

  await page.route("**/api/platform/solutions/appointment_booking/config/schema", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        solution_name: "appointment_booking",
        title: "Clinic booking settings",
        description: "Controls clinic integrations and reminder timing.",
        fields: [],
      }),
    });
  });

  await page.route("**/api/platform/solutions/appointment_booking/config", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        solution_name: "appointment_booking",
        config: {
          crm_adapter: "clinic_ehr",
          notification_adapter: "telnyx_sms",
          reminder_minutes_before_appointment: 90,
          custom_fields: {},
        },
      }),
    });
  });

  await page.route("**/api/platform/clinic/browser-session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        room_name: "clinic-browser-123",
        participant_identity: "clinic-browser-user-123",
        token: "jwt-token",
        connect_url: "wss://voice.example.com",
        profile: "gemini-3-flash-preview-structured-routing",
        expires_at: "2026-03-12T12:00:00Z",
      }),
    });
  });
}

async function exerciseVoiceCard(page: import("@playwright/test").Page) {
  const startedAt = Date.now();
  await page.goto("/bookings");

  await expect(page.getByTestId("clinic-browser-voice-card")).toBeVisible();
  await expect(page.getByTestId("browser-voice-state")).toContainText("Ready");
  await page.getByTestId("browser-voice-start").click();
  await expect(page.getByTestId("browser-voice-state")).toContainText("Live");
  await expect(page.getByTestId("browser-voice-room")).toContainText("clinic-browser-123");

  await page.getByTestId("browser-voice-mute").click();
  await expect(page.getByTestId("browser-voice-state")).toContainText(/muted/i);

  await page.getByTestId("browser-voice-end").click();
  await expect(page.getByTestId("browser-voice-ended")).toBeVisible();

  const events = await page.evaluate(() => {
    const scope = window as typeof window & { __clinicVoiceEvents?: unknown[] };
    return scope.__clinicVoiceEvents ?? [];
  });
  expect(events).toEqual([
    { type: "connect", url: "wss://voice.example.com", token: "jwt-token" },
    { type: "startAudio" },
    { type: "microphone", enabled: true },
    { type: "microphone", enabled: false },
    { type: "disconnect" },
  ]);

  await maybeWriteBrowserVoiceEvalArtifact({
    outputPath: process.env.GROVE_CLINIC_BROWSER_VOICE_JSON_OUTPUT,
    contract: {
      label: "clinic-browser-voice",
      transport: "browser_live_room_seam",
      requiredMarkers: ["connect", "startAudio", "microphoneEnabled", "microphoneMuted", "disconnect"],
      metadata: { ui_surface: "bookings" },
    },
    observation: {
      durationS: Number(((Date.now() - startedAt) / 1000).toFixed(3)),
      markers: {
        connect: events.some(
          (event) =>
            typeof event === "object" &&
            event !== null &&
            "type" in event &&
            (event as { type: string }).type === "connect",
        ),
        startAudio: events.some(
          (event) =>
            typeof event === "object" &&
            event !== null &&
            "type" in event &&
            (event as { type: string }).type === "startAudio",
        ),
        microphoneEnabled: events.some(
          (event) =>
            typeof event === "object" &&
            event !== null &&
            "type" in event &&
            "enabled" in event &&
            (event as { type: string; enabled: boolean }).type === "microphone" &&
            (event as { type: string; enabled: boolean }).enabled === true,
        ),
        microphoneMuted: events.some(
          (event) =>
            typeof event === "object" &&
            event !== null &&
            "type" in event &&
            "enabled" in event &&
            (event as { type: string; enabled: boolean }).type === "microphone" &&
            (event as { type: string; enabled: boolean }).enabled === false,
        ),
        disconnect: events.some(
          (event) =>
            typeof event === "object" &&
            event !== null &&
            "type" in event &&
            (event as { type: string }).type === "disconnect",
        ),
      },
      metadata: {
        room_name: "clinic-browser-123",
      },
    },
  });
}

test.describe("clinic browser voice", () => {
  test.skip(!isBuildEnabledSolution("appointment_booking"), "Appointment booking route is excluded from this build.");

  test("desktop operator can start and stop the clinic browser rehearsal", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await installFakeClinicRoom(page);
    await stubClinicBookingsWorkspace(page);
    await exerciseVoiceCard(page);
  });

  test("mobile operator still gets the same start, mute, and end controls", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await primeSessionCookie(page, "client_admin");
    await installFakeClinicRoom(page);
    await stubClinicBookingsWorkspace(page);
    await exerciseVoiceCard(page);
  });
});
