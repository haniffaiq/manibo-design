"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { Badge, type BadgeVariant } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { Input } from "@grove/ui/input";
import { Modal } from "@grove/ui/modal";

import { StatusMessage } from "@/components/status-message";
import { type Notice } from "@/hooks/use-notice";

export interface AdminTelephonyAttachableNumberOption {
  id: string;
  phoneNumber: string;
  providerLabel: string;
  readinessLabel: string;
  readinessVariant: BadgeVariant;
}

interface AdminTelephonyNumberPickerProps {
  open: boolean;
  onClose: () => void;
  assistantName: string;
  loading: boolean;
  loadError: string | null;
  blockedReason: string | null;
  busy: boolean;
  error: string | null;
  notice: Notice | null;
  numbers: AdminTelephonyAttachableNumberOption[];
  onAttach: (numberId: string) => Promise<void>;
}

export function AdminTelephonyNumberPicker({
  open,
  onClose,
  assistantName,
  loading,
  loadError,
  blockedReason,
  busy,
  error,
  notice,
  numbers,
  onAttach,
}: AdminTelephonyNumberPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNumberId, setSelectedNumberId] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredNumbers = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    if (!query) {
      return numbers;
    }
    return numbers.filter((number) =>
      [number.phoneNumber, number.providerLabel]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [deferredSearchQuery, numbers]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedNumberId(null);
      return;
    }
    if (filteredNumbers.length === 0) {
      setSelectedNumberId(null);
      return;
    }
    if (selectedNumberId && filteredNumbers.some((number) => number.id === selectedNumberId)) {
      return;
    }
    setSelectedNumberId(filteredNumbers[0]?.id ?? null);
  }, [filteredNumbers, open, selectedNumberId]);

  const selectedNumber = useMemo(
    () => filteredNumbers.find((number) => number.id === selectedNumberId) ?? null,
    [filteredNumbers, selectedNumberId],
  );

  const emptyState = searchQuery.trim() ? "No matches." : "No numbers available.";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attach existing number"
      className="max-w-[680px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() => void (selectedNumber ? onAttach(selectedNumber.id) : Promise.resolve())}
            disabled={busy || blockedReason != null || selectedNumber == null}
          >
            {busy ? "Attaching..." : "Attach number"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4" data-testid="admin-telephony-number-picker">
        {notice ? <StatusMessage variant={notice.variant}>{notice.message}</StatusMessage> : null}
        {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}
        {loadError ? <StatusMessage variant="error">{loadError}</StatusMessage> : null}
        {blockedReason ? <StatusMessage variant="warning">{blockedReason}</StatusMessage> : null}

        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          placeholder="Search numbers or providers"
          disabled={busy || loading || numbers.length === 0}
        />

        {loading ? (
          <p className="text-sm text-[var(--color-neutral-500)]">Loading numbers...</p>
        ) : filteredNumbers.length > 0 ? (
          <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
            {filteredNumbers.map((number) => {
              const selected = number.id === selectedNumberId;
              return (
                <button
                  key={number.id}
                  type="button"
                  onClick={() => setSelectedNumberId(number.id)}
                  className={
                    selected
                      ? "w-full rounded-[var(--radius-md)] border border-[var(--color-primary-500)] bg-[var(--color-primary-50)] p-4 text-left"
                      : "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-left hover:bg-[var(--color-bg-subtle)]"
                  }
                  data-testid={`admin-telephony-number-picker-option-${number.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{number.phoneNumber}</p>
                      <p className="text-xs text-[var(--color-neutral-500)]">{number.providerLabel}</p>
                    </div>
                    <Badge variant={number.readinessVariant}>{number.readinessLabel}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-5 text-sm text-[var(--color-neutral-600)]">
            {emptyState}
          </div>
        )}
      </div>
    </Modal>
  );
}
