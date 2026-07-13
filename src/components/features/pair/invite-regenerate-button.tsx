"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { createInvitation } from "@/lib/couple/actions";
import { InviteLinkDisplay } from "@/components/features/pair/invite-link-display";

type InviteRegenerateButtonProps = {
  label?: string;
};

export function InviteRegenerateButton({ label }: InviteRegenerateButtonProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const buttonLabel = label ?? t("pairRegenerate");

  function handleCreate() {
    setError("");
    startTransition(async () => {
      const result = await createInvitation();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInviteUrl(result.inviteUrl);
      router.refresh();
    });
  }

  if (inviteUrl) {
    return (
      <div className="grid gap-3">
        <p className="rounded-2xl alert-success rounded-2xl px-4 py-3 text-sm">
          {t("pairNewLinkCreated")}
        </p>
        <InviteLinkDisplay inviteUrl={inviteUrl} />
        <button
          className="rounded-2xl surface-input px-4 py-3 text-sm font-semibold"
          disabled={isPending}
          onClick={handleCreate}
          type="button"
        >
          {isPending ? t("pairCreating") : t("pairCreateAnother")}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <button
        className="rounded-2xl bg-[var(--accent)] px-5 py-4 font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        onClick={handleCreate}
        type="button"
      >
        {isPending ? t("pairCreatingLink") : buttonLabel}
      </button>
      {error ? (
        <p className="alert-error rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
