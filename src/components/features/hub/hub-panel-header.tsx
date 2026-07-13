"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

type HubPanelHeaderProps = {
  title: string;
  subtitle?: string;
};

export function HubPanelHeader({ title, subtitle }: HubPanelHeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="mb-6">
      <Link
        className="mb-4 inline-flex min-h-11 items-center gap-1 rounded-2xl px-1 text-sm font-semibold text-[var(--accent)]"
        href="/dashboard"
      >
        <ChevronLeft aria-hidden className="size-5" />
        {t("backHome")}
      </Link>
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
    </header>
  );
}
