"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import type { MessageKey } from "@/lib/i18n/messages";

type HubPanelHeaderProps = {
  titleKey: MessageKey;
  subtitleKey?: MessageKey;
};

export function HubPanelHeader({ titleKey, subtitleKey }: HubPanelHeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="mb-6">
      <Link
        className="mb-4 inline-flex min-h-11 items-center gap-1 rounded-2xl px-1 text-sm font-medium text-[var(--accent)]"
        href="/dashboard"
      >
        <ChevronLeft aria-hidden className="size-5" />
        {t("backHome")}
      </Link>
      <h1 className="text-2xl font-semibold">{t(titleKey)}</h1>
      {subtitleKey ? <p className="mt-1 text-sm text-[var(--muted)]">{t(subtitleKey)}</p> : null}
    </header>
  );
}
