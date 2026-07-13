"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  advanceOnboardingToDistance,
  saveRelationshipDistance,
  type RelationshipDistance,
} from "@/lib/onboarding/actions";

const OPTIONS: Array<{ value: RelationshipDistance; label: string; description: string }> = [
  {
    value: "distance",
    label: "На дистанции",
    description: "Живём в разных городах или странах",
  },
  {
    value: "nearby",
    label: "Рядом",
    description: "Часто раздельно, но недалеко друг от друга",
  },
  {
    value: "together",
    label: "Живём вместе",
    description: "В одном доме или квартире",
  },
];

export function DistanceOnboardingForm() {
  const router = useRouter();
  const [selected, setSelected] = useState<RelationshipDistance | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await saveRelationshipDistance(selected);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить.");
        return;
      }
      router.replace("/pair");
      router.refresh();
    });
  }

  return (
    <form className="mt-8 grid gap-3" onSubmit={handleSubmit}>
      {OPTIONS.map((option) => {
        const active = selected === option.value;
        return (
          <button
            className={`rounded-3xl border p-4 text-left transition-colors ${
              active
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--border)] surface-panel"
            }`}
            key={option.value}
            onClick={() => setSelected(option.value)}
            type="button"
          >
            <p className="font-bold">{option.label}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{option.description}</p>
          </button>
        );
      })}
      {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
      <button
        className="mt-2 rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
        disabled={isPending || !selected}
        type="submit"
      >
        {isPending ? "Сохраняем..." : "Готово"}
      </button>
    </form>
  );
}

export function SkipToDistanceButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSkip() {
    setError("");
    startTransition(async () => {
      const result = await advanceOnboardingToDistance();
      if (!result.ok) {
        setError(result.error ?? "Не удалось продолжить.");
        return;
      }
      router.replace("/onboarding/distance");
      router.refresh();
    });
  }

  return (
    <div className="mt-4">
      <button
        className="w-full rounded-2xl surface-input px-4 py-3 font-semibold disabled:opacity-60"
        disabled={isPending}
        onClick={handleSkip}
        type="button"
      >
        {isPending ? "Переходим..." : "Пропустить"}
      </button>
      {error ? <p className="mt-2 alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
    </div>
  );
}
