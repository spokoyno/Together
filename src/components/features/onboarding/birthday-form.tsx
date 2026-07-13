"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { saveBirthday } from "@/lib/profile/actions";

type BirthdayFormProps = {
  displayName: string;
};

export function BirthdayForm({ displayName }: BirthdayFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [birthday, setBirthday] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await saveBirthday(birthday);
      if (!result.ok) {
        setError(result.error ?? t("hubErrorSave"));
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
      <p className="text-sm text-[var(--muted)]">{t("onboardingHello", { name: displayName })}</p>
      <input
        className="rounded-2xl surface-input px-4 py-3"
        onChange={(event) => setBirthday(event.target.value)}
        required
        type="date"
        value={birthday}
      />
      {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
      <button
        className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
        disabled={isPending || !birthday}
        type="submit"
      >
        {isPending ? t("profileSaving") : t("onboardingContinue")}
      </button>
    </form>
  );
}
