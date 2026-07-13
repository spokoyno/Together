"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { copyTextToClipboard } from "@/lib/clipboard/copy-text.client";

export function InviteLinkDisplay({ inviteUrl }: { inviteUrl: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleCopy() {
    setError("");
    const ok = await copyTextToClipboard(inviteUrl);

    if (!ok) {
      setError(t("pairCopyError"));
      return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl surface-panel p-4">
      <p className="text-sm text-[var(--muted)]">{t("pairInviteSendHint")}</p>
      <p className="mt-2 break-all text-sm font-medium">{inviteUrl}</p>
      <button
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent-soft)] px-4 py-3 font-semibold text-[var(--accent)]"
        onClick={() => void handleCopy()}
        type="button"
      >
        {copied ? (
          <>
            <Check aria-hidden className="size-4" />
            {t("pairCopied")}
          </>
        ) : (
          <>
            <Copy aria-hidden className="size-4" />
            {t("pairCopyLink")}
          </>
        )}
      </button>
      {error ? <p className="mt-2 text-xs text-[var(--danger-text)]">{error}</p> : null}
    </div>
  );
}
