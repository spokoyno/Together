"use client";

import { useState, useTransition } from "react";
import { acceptInvitation } from "@/lib/couple/actions";

type AcceptInviteButtonProps = {
  token: string;
};

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    setError("");
    startTransition(async () => {
      const result = await acceptInvitation(token);
      if (result && "error" in result && result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="grid gap-3">
      <button
        className="rounded-2xl bg-[var(--accent)] px-5 py-4 font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        onClick={handleAccept}
        type="button"
      >
        {isPending ? "Подключаем..." : "Принять приглашение"}
      </button>
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
