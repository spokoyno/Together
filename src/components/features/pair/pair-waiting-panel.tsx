"use client";

import { InviteLinkDisplay } from "@/components/features/pair/invite-link-display";
import { useLanguage } from "@/components/providers/language-provider";
import { formatDateLocalized } from "@/lib/dates";

type PairWaitingPanelProps = {
  inviteUrl: string | null;
  relationshipStartedOn: string | null;
};

export function PairWaitingPanel({ inviteUrl, relationshipStartedOn }: PairWaitingPanelProps) {
  const { locale, t } = useLanguage();

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-medium text-[var(--accent)]">{t("profileWaitingPartner")}</p>
        <h1 className="mt-2 text-3xl font-semibold">{t("pairWaitingTitle")}</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">{t("pairWaitingHint")}</p>
      </div>

      {relationshipStartedOn ? (
        <p className="rounded-2xl surface-input px-4 py-3 text-sm">
          {t("pairTogetherSince", {
            date: formatDateLocalized(locale, relationshipStartedOn),
          })}
        </p>
      ) : null}

      {inviteUrl ? (
        <InviteLinkDisplay inviteUrl={inviteUrl} />
      ) : (
        <p className="alert-error rounded-2xl px-4 py-3 text-sm">{t("pairInviteError")}</p>
      )}
    </div>
  );
}
