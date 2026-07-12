"use client";

import { useState, useTransition } from "react";
import { leaveCouple } from "@/lib/couple/actions";

type LeaveCoupleButtonProps = {
  variant?: "solo" | "complete";
  className?: string;
};

const MESSAGES = {
  solo: {
    title: "Отвязать пару?",
    body: "Приглашение станет недействительным. Вы сможете создать новую пару или принять другое приглашение.",
    confirm: "Да, отвязать",
    cancel: "Отмена",
    action: "Отвязать пару",
  },
  complete: {
    title: "Отвязать пару?",
    body: "Вы выйдете из общего пространства. Партнёр останется один и сможет пригласить кого-то снова. Совместные данные сохранятся в паре.",
    confirm: "Да, отвязать",
    cancel: "Отмена",
    action: "Отвязать пару",
  },
} as const;

export function LeaveCoupleButton({
  variant = "solo",
  className,
}: LeaveCoupleButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const copy = MESSAGES[variant];

  function handleLeave() {
    setError("");
    startTransition(async () => {
      const result = await leaveCouple();
      if (result && !result.ok) {
        setError(result.error ?? "Не удалось отвязать пару");
        setShowConfirm(false);
      }
    });
  }

  if (showConfirm) {
    return (
      <div className={className ?? "grid gap-3"}>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">{copy.title}</p>
          <p className="mt-2 text-sm leading-6 text-red-700">{copy.body}</p>
          <div className="mt-4 grid gap-2">
            <button
              className="rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
              disabled={isPending}
              onClick={handleLeave}
              type="button"
            >
              {isPending ? "Отвязываем..." : copy.confirm}
            </button>
            <button
              className="rounded-2xl border border-red-200 bg-white px-4 py-3 font-semibold text-red-700"
              disabled={isPending}
              onClick={() => setShowConfirm(false)}
              type="button"
            >
              {copy.cancel}
            </button>
          </div>
        </div>
        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <button
      className={
        className ??
        "w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700"
      }
      onClick={() => setShowConfirm(true)}
      type="button"
    >
      {copy.action}
    </button>
  );
}
