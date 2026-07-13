"use client";

import { AuthForm } from "@/components/features/auth/auth-form";
import { useLanguage } from "@/components/providers/language-provider";

type AuthPageIntroProps = {
  initialError?: string | null;
  initialMode?: "signup" | "signin";
  nextPath: string;
};

export function AuthPageIntro({ initialError, initialMode, nextPath }: AuthPageIntroProps) {
  const { t } = useLanguage();
  const resolvedError =
    initialError === "callback" ? t("authCallbackError") : initialError ?? null;

  return (
    <>
      <p className="text-sm font-medium text-[var(--accent)]">Together</p>
      <h1 className="mt-2 text-3xl font-semibold">{t("authTitle")}</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">{t("authSubtitle")}</p>

      <div className="mt-8">
        <AuthForm
          initialError={resolvedError}
          initialMode={initialMode}
          nextPath={nextPath}
        />
      </div>
    </>
  );
}
