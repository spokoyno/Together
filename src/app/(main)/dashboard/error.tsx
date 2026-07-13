"use client";

import { useLanguage } from "@/components/providers/language-provider";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ reset }: DashboardErrorProps) {
  const { t } = useLanguage();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 pb-28 pt-7">
      <h1 className="text-2xl font-semibold">{t("dashboardErrorTitle")}</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">{t("commonErrorGeneric")}</p>
      <button
        className="mt-6 rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-[var(--background)]"
        onClick={reset}
        type="button"
      >
        {t("commonRefresh")}
      </button>
    </main>
  );
}
