"use client";

import { useCallback, useState } from "react";
import { Button, type ButtonVariant } from "@grove/ui/button";
import { Modal } from "@grove/ui/modal";

interface ConfirmOptions {
  title: string;
  description: string;
  body?: string;
  confirmLabel: string;
  variant?: ButtonVariant;
  confirmTestId?: string;
  onConfirm: () => Promise<void>;
}

export function useConfirmDialog() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
  }, []);

  const close = useCallback(() => {
    if (!busy) setOptions(null);
  }, [busy]);

  async function execute(): Promise<void> {
    if (!options) return;
    setBusy(true);
    try {
      await options.onConfirm();
    } finally {
      setBusy(false);
      setOptions(null);
    }
  }

  function ConfirmDialog() {
    if (!options) return null;
    return (
      <Modal
        open
        onClose={close}
        title={options.title}
        description={options.description}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button
              data-testid={options.confirmTestId ?? "confirm-dialog-action"}
              variant={options.variant ?? "destructive"}
              onClick={() => void execute()}
              disabled={busy}
            >
              {busy ? "Processing..." : options.confirmLabel}
            </Button>
          </div>
        }
      >
        {options.body ? (
          <p className="text-sm text-[var(--color-neutral-600)]">{options.body}</p>
        ) : null}
      </Modal>
    );
  }

  return { confirm, ConfirmDialog } as const;
}
