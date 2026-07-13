"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { UpdatePasswordForm } from "@/components/features/auth/update-password-form";

export function UpdatePasswordIntro() {
  const { t } = useLanguage();

  return (
    <>
      <p className="text-sm font-medium text-[var(--accent)]">{t("authNewPassword")}</p>
      <h1 className="mt-2 text-3xl font-semibold">{t("authUpdatePasswordTitle")}</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">{t("authUpdatePasswordHint")}</p>
      <UpdatePasswordForm />
    </>
  );
}
