"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { leaveAndAcceptInvitation } from "@/lib/couple/actions";
import { LeaveCoupleButton } from "@/components/features/pair/leave-couple-button";

type InviteConflictPanelProps = {
  token: string;
  isComplete: boolean;
};

export function InviteConflictPanel({ token, isComplete }: InviteConflictPanelProps) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSwitch() {
    setError("");
    startTransition(async () => {
      const result = await leaveAndAcceptInvitation(token);
      if (result && "error" in result && result.error) {
        setError(result.error);
      }
    });
  }

  if (isComplete) {
    return (
      <div className="grid gap-4">
        <p className="leading-7 text-[var(--muted)]">
          Вы уже состоите в полной паре. Чтобы принять другое приглашение, сначала отвяжите текущую
          пару в профиле.
        </p>
        <Link
          className="block rounded-2xl bg-[var(--accent-soft)] px-5 py-4 text-center font-semibold text-[var(--accent)]"
          href="/profile"
        >
          Перейти в профиль
        </Link>
        <Link className="text-center text-sm text-[var(--muted)]" href="/dashboard">
          На главную
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="leading-7 text-[var(--muted)]">
        Вы уже создали пару и ждёте партнёра. Можно отвязать текущую пару и принять это приглашение,
        или остаться и отправить партнёру свою ссылку.
      </p>

      <button
        className="rounded-2xl bg-[var(--accent)] px-5 py-4 font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        onClick={handleSwitch}
        type="button"
      >
        {isPending ? "Подключаем..." : "Отвязать и принять приглашение"}
      </button>

      <Link
        className="block rounded-2xl border border-[var(--border)] bg-white px-5 py-4 text-center font-semibold"
        href="/pair"
      >
        Оставить мою пару
      </Link>

      <LeaveCoupleButton variant="solo" />

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
