"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";

type ConfirmDeleteButtonProps = {
  onConfirm: () => void;
  disabled?: boolean;
};

export function ConfirmDeleteButton({ onConfirm, disabled }: ConfirmDeleteButtonProps) {
  const { t } = useLanguage();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <button
          className="rounded-xl bg-red-500/15 px-2.5 py-1.5 text-xs font-semibold text-red-400 disabled:opacity-60"
          disabled={disabled}
          onClick={() => {
            onConfirm();
            setConfirming(false);
          }}
          type="button"
        >
          {t("commonDelete")}
        </button>
        <button
          className="rounded-xl surface-input px-2.5 py-1.5 text-xs font-semibold"
          onClick={() => setConfirming(false)}
          type="button"
        >
          {t("commonCancel")}
        </button>
      </div>
    );
  }

  return (
    <button
      aria-label={t("commonDelete")}
      className="grid size-9 shrink-0 place-items-center rounded-full surface-input text-[var(--muted)] disabled:opacity-60"
      disabled={disabled}
      onClick={() => setConfirming(true)}
      type="button"
    >
      <Trash2 aria-hidden className="size-4" />
    </button>
  );
}
