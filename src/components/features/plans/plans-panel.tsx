"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Check, Clock, Plus, Trash2, X } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { completePlan, createPlan, deletePlan, reschedulePlan } from "@/lib/plans/actions";
import { formatDateTimeRu } from "@/lib/dates";
import { EmptyState } from "@/components/ui/empty-state";

export type PlanItem = {
  id: string;
  title: string;
  details: string | null;
  status: string;
  due_at: string | null;
  remind_enabled: boolean;
  completed_at: string | null;
};

type PlansPanelProps = {
  activePlans: PlanItem[];
  completedPlans: PlanItem[];
};

export function PlansPanel({ activePlans, completedPlans }: PlansPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  const visibleCompleted = showCompleted ? completedPlans : completedPlans.slice(0, 5);

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createPlan(formData);
      if (!result.ok) {
        setError(result.error ?? t("plansCreateError"));
        return;
      }
      setShowCreate(false);
      event.currentTarget.reset();
    });
  }

  function handleReschedule(planId: string) {
    if (!rescheduleValue) {
      return;
    }

    startTransition(async () => {
      const result = await reschedulePlan(planId, rescheduleValue);
      if (!result.ok) {
        setError(result.error ?? t("plansRescheduleError"));
        return;
      }
      setRescheduleId(null);
      setRescheduleValue("");
    });
  }

  return (
    <>
      <section className="mt-4 grid gap-3">
        {activePlans.length ? (
          activePlans.map((plan) => (
            <article className="surface-panel rounded-3xl p-4" key={plan.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{plan.title}</p>
                  {plan.details ? (
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{plan.details}</p>
                  ) : null}
                  {plan.due_at ? (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                      <Clock aria-hidden className="size-3.5" />
                      {formatDateTimeRu(plan.due_at)}
                    </p>
                  ) : null}
                  {plan.remind_enabled ? (
                    <p className="mt-1 text-xs font-medium text-[var(--accent)]">{t("plansReminderOn")}</p>
                  ) : null}
                </div>
              </div>

              {rescheduleId === plan.id ? (
                <div className="mt-3 grid gap-2">
                  <input
                    className="rounded-2xl surface-input px-3 py-2 text-sm"
                    onChange={(event) => setRescheduleValue(event.target.value)}
                    type="datetime-local"
                    value={rescheduleValue}
                  />
                  <div className="flex gap-2">
                    <button
                      className="rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
                      disabled={isPending}
                      onClick={() => handleReschedule(plan.id)}
                      type="button"
                    >
                      {t("plansReschedule")}
                    </button>
                    <button
                      className="rounded-xl surface-input px-3 py-2 text-xs font-semibold"
                      onClick={() => setRescheduleId(null)}
                      type="button"
                    >
                      {t("commonCancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center gap-1 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                    disabled={isPending}
                    onClick={() => startTransition(() => completePlan(plan.id))}
                    type="button"
                  >
                    <Check aria-hidden className="size-4" />
                    {t("plansDone")}
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-xl surface-input px-3 py-2 text-sm font-semibold"
                    disabled={isPending}
                    onClick={() => {
                      setRescheduleId(plan.id);
                      setRescheduleValue("");
                    }}
                    type="button"
                  >
                    <CalendarClock aria-hidden className="size-4" />
                    {t("plansReschedule")}
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-xl surface-input px-3 py-2 text-sm text-[var(--muted)]"
                    disabled={isPending}
                    onClick={() => startTransition(() => deletePlan(plan.id))}
                    type="button"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              )}
            </article>
          ))
        ) : (
          <EmptyState description={t("plansEmptyHint")} title={t("plansEmptyTitle")} />
        )}
      </section>

      {completedPlans.length ? (
        <section className="mt-8">
          <button
            className="flex w-full items-center justify-between text-left"
            onClick={() => setShowCompleted((current) => !current)}
            type="button"
          >
            <h2 className="text-lg font-bold">{t("plansCompletedTitle")}</h2>
            <span className="text-sm text-[var(--muted)]">
              {completedPlans.length}
              {!showCompleted && completedPlans.length > 5 ? ` · ${t("plansShowAll")}` : ""}
            </span>
          </button>
          <div className="mt-3 grid gap-2">
            {visibleCompleted.map((plan) => (
              <article className="surface-panel rounded-2xl px-4 py-3 opacity-80" key={plan.id}>
                <p className="font-medium line-through">{plan.title}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <button
        aria-label={t("plansAdd")}
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg transition-transform active:scale-95"
        onClick={() => setShowCreate(true)}
        type="button"
      >
        <Plus aria-hidden className="size-7" strokeWidth={2.2} />
      </button>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form
            className="surface-panel w-full max-w-md rounded-3xl p-5 shadow-xl"
            onSubmit={handleCreate}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">{t("plansNewTitle")}</p>
              <button
                aria-label={t("commonClose")}
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={() => setShowCreate(false)}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <div className="grid gap-3">
              <input
                className="rounded-2xl surface-input px-4 py-3"
                name="title"
                placeholder={t("plansTitlePlaceholder")}
                required
              />
              <textarea
                className="min-h-24 rounded-2xl surface-input px-4 py-3"
                name="details"
                placeholder={t("plansDetailsPlaceholder")}
                rows={3}
              />
              <input className="rounded-2xl surface-input px-4 py-3" name="dueAt" type="datetime-local" />
              <label className="flex items-center justify-between rounded-2xl surface-input px-4 py-3">
                <span className="font-medium">{t("plansRemind")}</span>
                <input className="size-5 accent-[var(--accent)]" name="remindEnabled" type="checkbox" />
              </label>
              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
              <button
                className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? t("commonSaving") : t("plansCreate")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
