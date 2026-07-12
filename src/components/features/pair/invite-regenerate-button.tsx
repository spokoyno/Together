"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createInvitation } from "@/lib/couple/actions";
import { InviteLinkDisplay } from "@/components/features/pair/invite-link-display";

type InviteRegenerateButtonProps = {
  label?: string;
};

export function InviteRegenerateButton({
  label = "Создать новую ссылку",
}: InviteRegenerateButtonProps) {
  const router = useRouter();
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
      router.refresh();
    });
  }

  if (inviteUrl) {
    return (
      <div className="grid gap-3">
        <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Новая ссылка создана. Предыдущие ссылки тоже остаются действительными до истечения срока.
        </p>
        <InviteLinkDisplay inviteUrl={inviteUrl} />
        <button
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold"
          disabled={isPending}
          onClick={handleCreate}
          type="button"
        >
          {isPending ? "Создаём..." : "Создать ещё одну ссылку"}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <button
        className="rounded-2xl bg-[var(--accent)] px-5 py-4 font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        onClick={handleCreate}
        type="button"
      >
        {isPending ? "Создаём ссылку..." : label}
      </button>
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
