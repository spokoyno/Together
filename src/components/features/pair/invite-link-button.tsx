"use client";

import { useState, useTransition } from "react";
import { createInvitation } from "@/lib/couple/actions";
import { InviteLinkDisplay } from "@/components/features/pair/invite-link-display";

export function InviteLinkButton() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError("");
    startTransition(async () => {
      const result = await createInvitation();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInviteUrl(result.inviteUrl);
    });
  }

  if (inviteUrl) {
    return <InviteLinkDisplay inviteUrl={inviteUrl} />;
  }

  return (
    <div className="grid gap-3">
      <button
        className="rounded-2xl bg-[var(--accent)] px-5 py-4 font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        onClick={handleCreate}
        type="button"
      >
        {isPending ? "Создаём ссылку..." : "Создать ссылку-приглашение"}
      </button>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
