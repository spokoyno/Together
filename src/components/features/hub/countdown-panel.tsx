"use client";

import { Plus, Timer, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import type { HubCountdownEvent } from "@/components/features/hub/types";
import { addCountdownEvent, deleteCountdownEvent } from "@/lib/hub/lifestyle-actions";
import { daysUntil, formatDateRu, todayIso } from "@/lib/dates";

type CountdownPanelProps = {
  events: HubCountdownEvent[];
};

function countdownLabel(targetDate: string) {
  const days = daysUntil(targetDate);
  if (days === 0) {
    return "Сегодня!";
  }
  if (days === 1) {
    return "Завтра";
  }
  return `Через ${days} дн.`;
}

export function CountdownPanel({ events }: CountdownPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const today = todayIso();
  const upcoming = useMemo(
    () => events.filter((event) => event.target_date >= today),
    [events, today],
  );
  const past = useMemo(
    () => events.filter((event) => event.target_date < today).reverse(),
    [events, today],
  );

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await addCountdownEvent(title, targetDate);
      if (!result.ok) {
        setError(result.error ?? "Не удалось добавить.");
        return;
      }
      setShowCreate(false);
      setTitle("");
      setTargetDate("");
    });
  }

  return (
    <>
      <section className="grid gap-3">
        {upcoming.length ? (
          upcoming.map((event) => (
            <article className="rounded-3xl bg-[var(--accent)] p-4 text-white" key={event.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Timer aria-hidden className="size-4 opacity-80" />
                    <p className="text-sm opacity-80">{countdownLabel(event.target_date)}</p>
                  </div>
                  <p className="mt-2 text-lg font-bold leading-snug">{event.title}</p>
                  <p className="mt-1 text-sm opacity-80">{formatDateRu(event.target_date)}</p>
                </div>
                <button
                  aria-label="Удалить"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteCountdownEvent(event.id);
                    })
                  }
                  type="button"
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            description="Добавьте важную дату — встречу, отпуск или праздник."
            title="Нет предстоящих событий"
          />
        )}
      </section>

      {past.length ? (
        <section className="mt-6">
          <p className="mb-3 text-sm font-semibold text-[var(--muted)]">Прошедшие</p>
          <div className="grid gap-2">
            {past.map((event) => (
              <article className="rounded-2xl surface-input px-4 py-3 opacity-80" key={event.id}>
                <p className="font-semibold">{event.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{formatDateRu(event.target_date)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <button
        aria-label="Добавить событие"
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg"
        onClick={() => setShowCreate(true)}
        type="button"
      >
        <Plus aria-hidden className="size-7" />
      </button>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-24">
          <form className="w-full rounded-3xl surface-panel p-5" onSubmit={submit}>
            <p className="text-lg font-bold">Новое событие</p>
            <div className="mt-3 grid gap-3">
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Что ждём?"
                required
                value={title}
              />
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setTargetDate(event.target.value)}
                required
                type="date"
                value={targetDate}
              />
              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
              <button
                className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                Добавить
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
