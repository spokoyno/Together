"use client";

import { useLanguage } from "@/components/providers/language-provider";

type HubPanelErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function HubPanelError({ reset }: HubPanelErrorProps) {
  const { t } = useLanguage();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 pb-32 pt-8">
      <h1 className="text-2xl font-bold">{t("commonErrorSection")}</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        {t("commonRefresh")}
      </p>
      <div className="mt-6 grid gap-2">
        <button
          className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white"
          onClick={reset}
          type="button"
        >
          {t("commonRefresh")}
        </button>
        <a
          className="rounded-2xl surface-input px-4 py-3 text-center font-semibold"
          href="/dashboard"
        >
          {t("backHome")}
        </a>
      </div>
    </main>
  );
}
