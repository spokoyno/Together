"use client";

import { useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { leaveCouple } from "@/lib/couple/actions";

type LeaveCoupleButtonProps = {
  variant?: "solo" | "complete";
  className?: string;
};

export function LeaveCoupleButton({
  variant = "solo",
  className,
}: LeaveCoupleButtonProps) {
  const { t } = useLanguage();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const title = variant === "solo" ? t("pairUnlinkInviteTitle") : t("pairUnlinkFullTitle");
  const body = variant === "solo" ? t("pairUnlinkInviteBody") : t("pairUnlinkFullBody");

  function handleLeave() {
    setError("");
    startTransition(async () => {
      const result = await leaveCouple();
      if (result && !result.ok) {
        setError(result.error ?? t("pairErrorUnlink"));
        setShowConfirm(false);
      }
    });
  }

  if (showConfirm) {
    return (
      <div className={className ?? "grid gap-3"}>
        <div className="alert-error rounded-2xl p-4">
          <p className="font-semibold">{title}</p>
          <p className="mt-2 text-sm leading-6 opacity-90">{body}</p>
          <div className="mt-4 grid gap-2">
            <button
              className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
              disabled={isPending}
              onClick={handleLeave}
              type="button"
            >
              {isPending ? t("pairUnlinkPending") : t("pairUnlinkConfirm")}
            </button>
            <button
              className="surface-input rounded-2xl px-4 py-3 font-semibold"
              disabled={isPending}
              onClick={() => setShowConfirm(false)}
              type="button"
            >
              {t("profileCancel")}
            </button>
          </div>
        </div>
        {error ? (
          <p className="alert-error rounded-2xl px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <button
      className={
        className ??
        "alert-error w-full rounded-2xl px-5 py-4 font-semibold"
      }
      onClick={() => setShowConfirm(true)}
      type="button"
    >
      {t("pairUnlink")}
    </button>
  );
}
