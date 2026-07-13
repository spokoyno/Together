"use client";

import Link from "next/link";
import { AcceptInviteButton } from "@/components/features/pair/accept-invite-button";
import { InviteConflictPanel } from "@/components/features/pair/invite-conflict-panel";
import { useLanguage } from "@/components/providers/language-provider";
import type { MessageKey } from "@/lib/i18n/messages";

type InvitePageViewProps = {
  token: string;
  state: "invalid" | "conflict" | "accept";
  reason?: "invalid" | "expired" | "accepted" | "couple_full";
};

const REASON_KEYS: Record<NonNullable<InvitePageViewProps["reason"]>, MessageKey> = {
  invalid: "inviteReasonInvalid",
  expired: "inviteReasonExpired",
  accepted: "inviteReasonAccepted",
  couple_full: "inviteReasonCoupleFull",
};

export function InvitePageView({ token, state, reason }: InvitePageViewProps) {
  const { t } = useLanguage();

  if (state === "invalid" && reason) {
    return (
      <>
        <p className="text-sm font-medium text-[var(--accent)]">{t("inviteLabel")}</p>
        <h1 className="mt-2 text-3xl font-semibold">{t("inviteInvalidTitle")}</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">{t(REASON_KEYS[reason])}</p>
        <Link className="mt-6 inline-block text-[var(--accent)]" href="/dashboard">
          {t("backHome")}
        </Link>
      </>
    );
  }

  if (state === "conflict") {
    return (
      <>
        <p className="text-sm font-medium text-[var(--accent)]">{t("inviteLabel")}</p>
        <h1 className="mt-2 text-3xl font-semibold">{t("inviteAlreadyInPairTitle")}</h1>
        <div className="mt-6">
          <InviteConflictPanel isComplete={false} token={token} />
        </div>
      </>
    );
  }

  return (
    <>
      <p className="text-sm font-medium text-[var(--accent)]">{t("inviteLabel")}</p>
      <h1 className="mt-2 text-3xl font-semibold">{t("inviteJoinTitle")}</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">{t("inviteJoinHint")}</p>
      <div className="mt-8">
        <AcceptInviteButton token={token} />
      </div>
      <Link className="mt-6 inline-block text-sm text-[var(--muted)]" href="/auth">
        {t("inviteSignInOther")}
      </Link>
    </>
  );
}
