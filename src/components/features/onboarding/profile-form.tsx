"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GenderSelect } from "@/components/features/profile/gender-select";
import { saveOnboardingProfile } from "@/lib/onboarding/actions";
import type { ProfileGender } from "@/types/domain";

type ProfileOnboardingFormProps = {
  displayName: string;
  initialGender?: ProfileGender | null;
};

export function ProfileOnboardingForm({
  displayName,
  initialGender = null,
}: ProfileOnboardingFormProps) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState<ProfileGender | "">(initialGender ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!gender) {
      setError("Выберите пол.");
      return;
    }

    startTransition(async () => {
      const result = await saveOnboardingProfile(name, birthday, gender);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить.");
        return;
      }
      router.replace("/onboarding/invite");
      router.refresh();
    });
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Имя</span>
        <input
          className="rounded-2xl surface-input px-4 py-3"
          onChange={(event) => setName(event.target.value)}
          placeholder="Как вас называть?"
          required
          value={name}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">День рождения</span>
        <input
          className="rounded-2xl surface-input px-4 py-3"
          onChange={(event) => setBirthday(event.target.value)}
          required
          type="date"
          value={birthday}
        />
      </label>
      <div className="grid gap-2">
        <span className="text-sm font-semibold">Пол</span>
        <GenderSelect disabled={isPending} onChange={setGender} value={gender} />
      </div>
      {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
      <button
        className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
        disabled={isPending || !name.trim() || !birthday || !gender}
        type="submit"
      >
        {isPending ? "Сохраняем..." : "Продолжить"}
      </button>
    </form>
  );
}
