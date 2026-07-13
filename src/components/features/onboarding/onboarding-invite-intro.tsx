"use client";

import Link from "next/link";
import { InviteLinkDisplay } from "@/components/features/pair/invite-link-display";
import { SkipToDistanceButton } from "@/components/features/onboarding/distance-form";
import { useLanguage } from "@/components/providers/language-provider";

type OnboardingInviteIntroProps = {
  inviteUrl: string | null;
};

export function OnboardingInviteIntro({ inviteUrl }: OnboardingInviteIntroProps) {
  const { t } = useLanguage();

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("onboardingInviteTitle")}</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t("onboardingInviteHint")}</p>

      {inviteUrl ? (
        <div className="mt-8">
          <InviteLinkDisplay inviteUrl={inviteUrl} />
        </div>
      ) : (
        <section className="mt-8 rounded-[1.75rem] surface-panel p-5">
          <p className="text-sm leading-6 text-[var(--muted)]">{t("onboardingInviteCreateFirst")}</p>
          <Link
            className="mt-4 block w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-center font-semibold text-white"
            href="/pair"
          >
            {t("onboardingInviteCreatePair")}
          </Link>
        </section>
      )}

      <SkipToDistanceButton />
    </>
  );
}
