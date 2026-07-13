"use client";

import { Gift, Heart, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import type { HubComplimentState } from "@/components/features/hub/types";
import { addCompliment, drawCompliment } from "@/lib/hub/actions";

type ComplimentsPanelProps = {
  partnerName: string;
  state: HubComplimentState;
};

const JAR_CAPACITY = 12;

function jarFill(count: number) {
  return Math.min(100, Math.round((count / JAR_CAPACITY) * 100));
}

export function ComplimentsPanel({ partnerName, state }: ComplimentsPanelProps) {
  const [draft, setDraft] = useState("");
  const [drawnText, setDrawnText] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitCompliment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await addCompliment(draft);
      if (!result.ok) {
        setError(result.error ?? "Не удалось добавить комплимент.");
        return;
      }
      setDraft("");
    });
  }

  function pullCompliment() {
    setError("");
    setDrawnText(null);
    startTransition(async () => {
      const result = await drawCompliment();
      if (!result.ok) {
        setError(result.error ?? "Не удалось достать комплимент.");
        return;
      }
      setDrawnText(result.text);
    });
  }

  return (
    <section className="grid gap-5">
      <article className="rounded-3xl surface-panel p-5">
        <p className="text-sm font-semibold text-[var(--accent)]">Банка {partnerName}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Кладите комплименты партнёру — он сможет достать один раз в час.
        </p>

        <div className="relative mx-auto mt-6 w-40">
          <div className="overflow-hidden rounded-b-[2rem] rounded-t-xl border-2 border-[var(--border)] bg-[var(--input-bg)]">
            <div
              className="flex min-h-32 items-end justify-center bg-gradient-to-t from-[var(--accent-soft)] to-[var(--accent)]/20 transition-all duration-500"
              style={{ height: `${Math.max(32, jarFill(state.partnerJarCount) * 1.2)}px` }}
            >
              <Heart
                aria-hidden
                className="mb-2 size-6 text-[var(--accent)]"
                fill="currentColor"
              />
            </div>
          </div>
          <div className="absolute -top-2 left-1/2 h-3 w-16 -translate-x-1/2 rounded-full border-2 border-[var(--border)] bg-[var(--panel-bg)]" />
        </div>
        <p className="mt-3 text-center text-sm text-[var(--muted)]">
          В банке партнёра: {state.partnerJarCount}
        </p>

        <form className="mt-5 grid gap-3" onSubmit={submitCompliment}>
          <textarea
            className="min-h-20 rounded-2xl surface-input px-4 py-3"
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Комплимент для ${partnerName}...`}
            value={draft}
          />
          <button
            className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
            disabled={isPending || !draft.trim()}
            type="submit"
          >
            {isPending ? "Кладём..." : "Положить в банку"}
          </button>
        </form>
      </article>

      <article className="rounded-3xl surface-panel p-5">
        <p className="text-sm font-semibold text-[var(--accent)]">Ваша банка</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Доставайте комплименты от партнёра — не чаще одного в час.
        </p>

        <div className="relative mx-auto mt-6 w-40">
          <div className="overflow-hidden rounded-b-[2rem] rounded-t-xl border-2 border-[var(--border)] bg-[var(--input-bg)]">
            <div
              className="flex min-h-32 items-end justify-center bg-gradient-to-t from-pink-100 to-pink-300/30 transition-all duration-500 dark:from-pink-950 dark:to-pink-800/20"
              style={{ height: `${Math.max(32, jarFill(state.myJarCount) * 1.2)}px` }}
            >
              <Sparkles aria-hidden className="mb-2 size-6 text-pink-500" />
            </div>
          </div>
          <div className="absolute -top-2 left-1/2 h-3 w-16 -translate-x-1/2 rounded-full border-2 border-[var(--border)] bg-[var(--panel-bg)]" />
        </div>

        <p className="mt-3 text-center text-sm text-[var(--muted)]">
          У вас: {state.myJarCount} {state.myJarCount === 1 ? "комплимент" : "комплиментов"}
        </p>

        {drawnText ? (
          <div className="mt-5 rounded-2xl bg-[var(--accent-soft)] p-4 text-center">
            <Gift aria-hidden className="mx-auto size-6 text-[var(--accent)]" />
            <p className="mt-2 text-lg font-semibold leading-7">{drawnText}</p>
          </div>
        ) : null}

        {error ? <p className="mt-3 alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

        <button
          className="mt-4 w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
          disabled={!state.canDraw || isPending}
          onClick={pullCompliment}
          type="button"
        >
          {isPending
            ? "Достаём..."
            : state.waitMinutes > 0
              ? `Подождите ${state.waitMinutes} мин`
              : state.myJarCount
                ? "Достать комплимент"
                : "Банка пуста"}
        </button>
      </article>
    </section>
  );
}
