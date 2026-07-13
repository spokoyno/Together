"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLanguage } from "@/components/providers/language-provider";

type ChatPageHeaderProps = {
  partnerDisplayName: string;
  partnerAvatarUrl: string | null;
};

export function ChatPageHeader({ partnerDisplayName, partnerAvatarUrl }: ChatPageHeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="fade-up sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <Link className="flex items-center gap-3" href="/profile/partner">
        <UserAvatar imageUrl={partnerAvatarUrl} name={partnerDisplayName} size="sm" />
        <div>
          <h1 className="text-lg font-semibold">{partnerDisplayName}</h1>
          <p className="text-xs text-[var(--muted)]">{t("chatPartnerProfile")}</p>
        </div>
      </Link>
    </header>
  );
}
