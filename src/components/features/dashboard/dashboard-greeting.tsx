"use client";

import { useLanguage } from "@/components/providers/language-provider";

export function DashboardGreeting() {
  const { t } = useLanguage();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t("greetingMorning") : hour < 18 ? t("greetingAfternoon") : t("greetingEvening");

  return (
    <header className="mb-1">
      <p className="text-sm text-[var(--muted)]">{greeting}</p>
      <h1 className="text-2xl font-semibold">Together</h1>
    </header>
  );
}
