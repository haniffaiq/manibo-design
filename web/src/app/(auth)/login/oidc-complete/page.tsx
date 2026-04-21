"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function safeRedirectTarget(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://") || raw.includes("\\")) {
    return fallback;
  }
  return raw;
}

export default function OidcCompletePage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = safeRedirectTarget(params.get("target"), "/");
    router.replace(target);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-subtle,#f9fafb)]">
      <div className="rounded-md border border-[var(--color-border,#e5e7eb)] bg-white px-4 py-3 text-sm text-[var(--color-neutral-600,#4b5563)]">
        Completing sign in...
      </div>
    </div>
  );
}
