"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import {
  advanceOnboardingToDistance,
  saveRelationshipDistance,
  type RelationshipDistance,
} from "@/lib/onboarding/actions";

export function DistanceOnboardingForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [selected, setSelected] = useState<RelationshipDistance | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const options = useMemo(
    () =>
      [
        {
          value: "distance" as const,
          label: t("onboardingDistanceLong"),
          description: t("onboardingDistanceLongDesc"),
        },
        {
          value: "nearby" as const,
          label: t("onboardingDistanceNear"),
          description: t("onboardingDistanceNearDesc"),
        },
        {
          value: "together" as const,
          label: t("onboardingDistanceTogether"),
          description: t("onboardingDistanceTogetherDesc"),
        },
      ] satisfies Array<{ value: RelationshipDistance; label: string; description: string }>,
    [t],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await saveRelationshipDistance(selected);
      if (!result.ok) {
        setError(result.error ?? t("hubErrorSave"));
        return;
      }
      router.replace("/pair");
      router.refresh();
    });
  }

  return (
    <form className="mt-8 grid gap-3" onSubmit={handleSubmit}>
      {options.map((option) => {
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
        {isPending ? t("profileSaving") : t("onboardingDone")}
      </button>
    </form>
  );
}

export function SkipToDistanceButton() {
  const router = useRouter();
  const { t } = useLanguage();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSkip() {
    setError("");
    startTransition(async () => {
      const result = await advanceOnboardingToDistance();
      if (!result.ok) {
        setError(result.error ?? t("onboardingErrorContinue"));
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
        {isPending ? t("onboardingGoing") : t("onboardingSkip")}
      </button>
      {error ? <p className="mt-2 alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
    </div>
  );
}
