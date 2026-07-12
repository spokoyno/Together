"use client";

import { useState, useTransition } from "react";
import { createCouple } from "@/lib/couple/actions";
import { InviteLinkDisplay } from "@/components/features/pair/invite-link-display";

export function CreateCoupleForm() {
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInviteUrl(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createCouple(formData);
      if (!result.ok) {
        setError(result.error);
        if (result.error.includes("Обновите страницу")) {
          window.location.reload();
        }
        return;
      }
      setInviteUrl(result.inviteUrl);
    });
  }

  if (inviteUrl) {
    return (
      <div className="mt-8 grid gap-4">
        <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Пара создана. Отправьте ссылку партнёру.
        </p>
        <InviteLinkDisplay inviteUrl={inviteUrl} />
      </div>
    );
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Дата начала отношений</span>
        <input
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          disabled={isPending}
          name="relationshipStartedOn"
          required
          type="date"
        />
      </label>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        className="rounded-2xl bg-[var(--accent)] px-5 py-4 font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Создаём пару..." : "Создать пару и получить ссылку"}
      </button>
    </form>
  );
}
