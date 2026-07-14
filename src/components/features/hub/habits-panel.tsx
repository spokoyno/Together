"use client";

import { Gift, Plus, Repeat } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { ModalSheet } from "@/components/ui/modal-sheet";
import type { HubHabit } from "@/components/features/hub/types";
import {
  addCoupleHabit,
  completeCoupleHabit,
  deleteCoupleHabit,
  setHabitMotivation,
} from "@/lib/hub/lifestyle-actions";
import { formatDateLocalized } from "@/lib/dates";

type HabitsPanelProps = {
  habits: HubHabit[];
};

type HabitsView = "active" | "completed";

export function HabitsPanel({ habits }: HabitsPanelProps) {
  const [view, setView] = useState<HabitsView>("active");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [motivationDrafts, setMotivationDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { locale, t } = useLanguage();

  const active = useMemo(
    () => habits.filter((habit) => habit.status === "active"),
    [habits],
  );
  const completed = useMemo(
    () => habits.filter((habit) => habit.status === "completed"),
    [habits],
  );
  const visible = view === "active" ? active : completed;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await addCoupleHabit(title, description, plannedDate || undefined);
      if (!result.ok) {
        setError(result.error ?? t("hubErrorAdd"));
        return;
      }
      setShowCreate(false);
      setTitle("");
      setDescription("");
      setPlannedDate("");
    });
  }

  function saveMotivation(habitId: string) {
    const text = motivationDrafts[habitId]?.trim();
    if (!text) {
      return;
    }
    startTransition(async () => {
      const result = await setHabitMotivation(habitId, text);
      if (!result.ok) {
        setError(result.error ?? t("hubErrorMotivation"));
      }
    });
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        <button
          className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold ${view === "active" ? "bg-[var(--accent)] text-white" : "surface-input"}`}
          onClick={() => setView("active")}
          type="button"
        >
          {t("hubActiveTab")}
        </button>
        <button
          className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold ${view === "completed" ? "bg-[var(--accent)] text-white" : "surface-input"}`}
          onClick={() => setView("completed")}
          type="button"
        >
          {t("hubCompletedTab")}
        </button>
      </div>

      <section className="grid gap-3">
        {visible.length ? (
          visible.map((habit) => (
            <article className="rounded-3xl surface-panel p-4" key={habit.id}>
              <div className="flex items-start gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Repeat aria-hidden className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold leading-snug">{habit.title}</p>
                    <ConfirmDeleteButton
                      disabled={isPending}
                      onConfirm={() =>
                        startTransition(async () => {
                          await deleteCoupleHabit(habit.id);
                        })
                      }
                    />
                  </div>
                  {habit.description ? (
                    <p className="mt-1 text-sm text-[var(--muted)]">{habit.description}</p>
                  ) : null}
                  {habit.motivation ? (
                    <div className="mt-3 rounded-2xl bg-[var(--accent-soft)] px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
                        <Gift aria-hidden className="size-3.5" />
                        {t("hubHabitsMotivation")}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed">{habit.motivation}</p>
                    </div>
                  ) : habit.status === "active" ? (
                    <div className="mt-3 grid gap-2">
                      <input
                        className="rounded-xl surface-input px-3 py-2 text-sm"
                        onChange={(event) =>
                          setMotivationDrafts((prev) => ({
                            ...prev,
                            [habit.id]: event.target.value,
                          }))
                        }
                        placeholder={t("hubHabitsMotivationPlaceholder")}
                        value={motivationDrafts[habit.id] ?? ""}
                      />
                      <button
                        className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--accent)]"
                        disabled={isPending || !motivationDrafts[habit.id]?.trim()}
                        onClick={() => saveMotivation(habit.id)}
                        type="button"
                      >
                        {t("hubHabitsAddMotivation")}
                      </button>
                    </div>
                  ) : null}
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {habit.author_name}
                    {habit.planned_date
                      ? ` · ${formatDateLocalized(locale, habit.planned_date)}`
                      : ` · ${formatDateLocalized(locale, habit.created_at.slice(0, 10))}`}
                  </p>
                  {habit.status === "active" ? (
                    <button
                      className="mt-3 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--accent)]"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await completeCoupleHabit(habit.id);
                        })
                      }
                      type="button"
                    >
                      {t("hubHabitsComplete")}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            description={
              view === "active" ? t("hubHabitsEmptyOpen") : t("hubHabitsEmptyClosed")
            }
            title={t("hubEmptyShort")}
          />
        )}
      </section>

      {view === "active" ? (
        <button
          aria-label={t("hubHabitsAdd")}
          className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg"
          onClick={() => setShowCreate(true)}
          type="button"
        >
          <Plus aria-hidden className="size-7" />
        </button>
      ) : null}

      {showCreate ? (
        <ModalSheet as="form" onClose={() => setShowCreate(false)} onSubmit={submit} open>
            <p className="text-lg font-bold">{t("hubHabitsNew")}</p>
            <div className="mt-3 grid gap-3">
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("hubHabitsTitlePlaceholder")}
                required
                value={title}
              />
              <textarea
                className="min-h-20 rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("commonDescriptionOptional")}
                value={description}
              />
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setPlannedDate(event.target.value)}
                type="date"
                value={plannedDate}
              />
              <p className="text-xs text-[var(--muted)]">{t("hubDateCalendarHint")}</p>
              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
              <button
                className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {t("commonAdd")}
              </button>
            </div>
        </ModalSheet>
      ) : null}
    </>
  );
}
