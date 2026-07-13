"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { PairWaitingPanel } from "@/components/features/pair/pair-waiting-panel";

type DashboardWaitingStateProps = {
  inviteUrl: string | null;
  relationshipStartedOn: string | null;
};

export function DashboardWaitingState({
  inviteUrl,
  relationshipStartedOn,
}: DashboardWaitingStateProps) {
  const { t } = useLanguage();

  return (
    <>
      <section className="mt-7 rounded-[1.75rem] surface-panel border border-dashed border-[var(--border)] p-5">
        <p className="text-sm font-medium text-[var(--accent)]">{t("dashboardAlmostReady")}</p>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{t("dashboardWaitingPartner")}</p>
      </section>

      <div className="mt-6">
        <PairWaitingPanel inviteUrl={inviteUrl} relationshipStartedOn={relationshipStartedOn} />
      </div>
    </>
  );
}
