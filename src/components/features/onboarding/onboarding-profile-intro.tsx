"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { ProfileOnboardingForm } from "@/components/features/onboarding/profile-form";
import type { ProfileGender } from "@/types/domain";

type OnboardingProfileIntroProps = {
  displayName: string;
  initialGender: ProfileGender | null;
};

export function OnboardingProfileIntro({
  displayName,
  initialGender,
}: OnboardingProfileIntroProps) {
  const { t } = useLanguage();

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("onboardingProfileTitle")}</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t("onboardingProfileHint")}</p>
      <ProfileOnboardingForm displayName={displayName} initialGender={initialGender} />
    </>
  );
}
