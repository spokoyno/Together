"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCouple } from "@/lib/couple/actions";

export function CreateCoupleForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createCouple(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Дата начала отношений</span>
        <input
          className="rounded-2xl surface-input px-4 py-3"
          disabled={isPending}
          name="relationshipStartedOn"
          required
          type="date"
        />
      </label>

      {error ? (
        <p className="alert-error rounded-2xl px-4 py-3 text-sm">
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
