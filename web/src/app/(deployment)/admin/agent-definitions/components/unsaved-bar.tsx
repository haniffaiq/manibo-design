"use client";

import { Button } from "@grove/ui/button";

export interface UnsavedBarProps {
  visible: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
}

/**
 * Sticky bottom bar that appears whenever the detail panel has unsaved
 * changes. "Save" creates a new draft version; "Discard" reverts to the
 * last saved snapshot.
 */
export function UnsavedBar({ visible, onSave, onDiscard, saving }: UnsavedBarProps) {
  if (!visible) return null;
  return (
    <div className="sticky bottom-0 z-30 flex items-center justify-between gap-3 border-t border-[var(--color-border)] bg-white px-5 py-2.5 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      <span className="inline-flex items-center gap-2 text-[12px] font-medium text-[var(--color-neutral-700)]">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Unsaved changes
      </span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
          Discard
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save as new draft"}
        </Button>
      </div>
    </div>
  );
}
