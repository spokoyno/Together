"use client";

import Link from "next/link";
import { CreateCoupleForm } from "@/components/features/pair/create-couple-form";
import { PairWaitingPanel } from "@/components/features/pair/pair-waiting-panel";
import { useLanguage } from "@/components/providers/language-provider";

type PairPageShellProps = {
  hasContext: boolean;
  inviteUrl: string | null;
  relationshipStartedOn: string | null;
};

export function PairPageShell({
  hasContext,
  inviteUrl,
  relationshipStartedOn,
}: PairPageShellProps) {
  const { t } = useLanguage();

  return (
    <>
      <div className="flex items-center justify-between">
        <Link className="text-sm text-[var(--accent)]" href="/profile">
          {t("navProfile")}
        </Link>
        {hasContext ? (
          <Link className="text-sm text-[var(--muted)]" href="/dashboard">
            {t("navHome")}
          </Link>
        ) : null}
      </div>

      {!hasContext ? (
        <>
          <p className="mt-6 text-sm font-medium text-[var(--accent)]">{t("pairSectionLabel")}</p>
          <h1 className="mt-2 text-3xl font-semibold">{t("pairCreateTitle")}</h1>
          <p className="mt-3 leading-7 text-[var(--muted)]">{t("pairCreateHint")}</p>
          <CreateCoupleForm />
        </>
      ) : (
        <div className="mt-6">
          <PairWaitingPanel inviteUrl={inviteUrl} relationshipStartedOn={relationshipStartedOn} />
        </div>
      )}
    </>
  );
}
