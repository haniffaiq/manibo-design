"use client";

import { useCallback } from "react";

import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { BrowserVoiceClient, type BrowserVoiceLabels, type BrowserVoiceSessionInfo } from "@grove/web-shared/components/browser-voice-client";
import { IconPhone } from "@grove/web-shared/components/icons";
import type { TenantUiLocale } from "@grove/web-shared/types/tenant-locale";
import { createClinicBrowserSession } from "../api/clinic-bookings";

const COPY = {
  en: {
    title: "Talk to the clinic agent",
    description:
      "Open the same browser WebRTC room used by the clinic smoke contract. This keeps the Gemini clinic profile, tool flow, and voice worker path aligned with rehearsal.",
    badges: ["Same clinic runtime", "Browser WebRTC", "No PSTN in this step"] as const,
  },
  lt: {
    title: "Kalbėkite su klinikos agentu",
    description:
      "Atidarykite tą patį naršyklės WebRTC kambarį, kurį naudoja klinikos smoke testas. Taip išlaikomas tas pats Gemini profilis, įrankių eiga ir balso worker kelias kaip ir repeticijoje.",
    badges: ["Tas pats klinikos runtime", "Naršyklės WebRTC", "Šiame etape be PSTN"] as const,
  },
} as const;

const VOICE_LABELS: Record<"en" | "lt", BrowserVoiceLabels> = {
  en: {
    start: "Start browser rehearsal",
    starting: "Starting\u2026",
    mute: "Mute microphone",
    unmute: "Unmute microphone",
    end: "End session",
    ended: "Session ended.",
    states: {
      idle: "Ready to start",
      starting: "Requesting a browser session",
      connecting: "Connecting microphone and room audio",
      live: "Live and listening",
      muted: "Connected, microphone muted",
      ended: "Session ended",
      error: "Needs attention",
    },
    errors: {
      microphoneUnsupported: "This browser does not expose microphone controls.",
      playbackBlocked: "Browser audio playback is blocked. Interact with the page again and retry.",
      disconnected: "The browser voice room disconnected unexpectedly.",
    },
  },
  lt: {
    start: "Prad\u0117ti nar\u0161ykl\u0117s repeticij\u0105",
    starting: "Paleid\u017eiama\u2026",
    mute: "Nutildyti mikrofon\u0105",
    unmute: "\u012ejungti mikrofon\u0105",
    end: "Baigti sesij\u0105",
    ended: "Sesija baigta.",
    states: {
      idle: "Paruo\u0161ta prad\u0117ti",
      starting: "Pra\u0161oma nar\u0161ykl\u0117s sesijos",
      connecting: "Jungiamas mikrofonas ir kambario garsas",
      live: "Prisijungta ir klausoma",
      muted: "Prisijungta, mikrofonas nutildytas",
      ended: "Sesija baigta",
      error: "Reikia d\u0117mesio",
    },
    errors: {
      microphoneUnsupported: "\u0160i nar\u0161ykl\u0117 nepateikia mikrofono valdymo.",
      playbackBlocked: "Nar\u0161ykl\u0117 blokuoja garso atk\u016brim\u0105. Dar kart\u0105 s\u0105veikaukite su puslapiu ir bandykite i\u0161 naujo.",
      disconnected: "Nar\u0161ykl\u0117s balso kambarys netik\u0117tai atsijung\u0117.",
    },
  },
};

export function ClinicBrowserVoiceCard({ locale }: { locale: TenantUiLocale }) {
  const copy = locale === "lt" ? COPY.lt : COPY.en;
  const voiceLabels = locale === "lt" ? VOICE_LABELS.lt : VOICE_LABELS.en;

  const createSession = useCallback(async (): Promise<BrowserVoiceSessionInfo> => {
    const session = await createClinicBrowserSession();
    return {
      connect_url: session.connect_url,
      token: session.token,
      room_name: session.room_name,
      call_id: session.room_name,
    };
  }, []);

  return (
    <Card data-testid="clinic-browser-voice-card" className="overflow-hidden">
      <CardHeader className="border-b border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(6,95,70,0.08),rgba(255,255,255,0))]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(6,95,70,0.16)] bg-[rgba(6,95,70,0.08)] text-[var(--color-primary-700)]">
            <IconPhone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">{copy.title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-[var(--color-neutral-600)]">{copy.description}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {copy.badges.map((label) => (
            <span
              key={label}
              className="inline-flex h-6 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2.5 text-xs font-medium text-[var(--color-neutral-700)]"
            >
              {label}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="py-5">
        <BrowserVoiceClient createSession={createSession} labels={voiceLabels} />
      </CardContent>
    </Card>
  );
}
