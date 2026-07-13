"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { DistanceOnboardingForm } from "@/components/features/onboarding/distance-form";

export function OnboardingDistanceIntro() {
  const { t } = useLanguage();

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("onboardingDistanceTitle")}</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t("onboardingDistanceHint")}</p>
      <DistanceOnboardingForm />
    </>
  );
}
