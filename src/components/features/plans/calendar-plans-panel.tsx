"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Gift, Plus, X } from "lucide-react";
import { completePlan, createPlan, deletePlan } from "@/lib/plans/actions";
import { formatDateRu } from "@/lib/dates";
import { holidaysForDay, type CoupleHoliday } from "@/lib/plans/holidays";

export type CalendarPlanItem = {
  id: string;
  title: string;
  details: string | null;
  status: string;
  due_at: string | null;
  remind_enabled: boolean;
  is_surprise: boolean;
  created_by: string;
};

type CalendarPlansPanelProps = {
  plans: CalendarPlanItem[];
  userId: string;
  holidays: CoupleHoliday[];
};

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function CalendarPlansPanel({ plans, userId, holidays }: CalendarPlansPanelProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => toDateKey(new Date()));
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const activePlans = useMemo(
    () => plans.filter((plan) => plan.status === "active"),
    [plans],
  );

  const visiblePlans = useMemo(
    () =>
      activePlans.filter(
        (plan) => !plan.is_surprise || plan.created_by === userId,
      ),
    [activePlans, userId],
  );

  const plansByDay = useMemo(() => {
    const map = new Map<string, CalendarPlanItem[]>();
    for (const plan of visiblePlans) {
      if (!plan.due_at) {
        continue;
      }
      const key = plan.due_at.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(plan);
      map.set(key, list);
    }
    return map;
  }, [visiblePlans]);

  const calendarCells = useMemo(() => {
    const first = startOfMonth(month);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: Array<{ key: string; day: number | null }> = [];

    for (let i = 0; i < offset; i += 1) {
      cells.push({ key: `empty-${i}`, day: null });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(first.getFullYear(), first.getMonth(), day);
      cells.push({ key: toDateKey(date), day });
    }

    return cells;
  }, [month]);

  const selectedPlans = plansByDay.get(selectedDay) ?? [];
  const selectedHolidays = holidaysForDay(holidays, selectedDay);

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    formData.set("dueAt", `${selectedDay}T12:00`);

    startTransition(async () => {
      const result = await createPlan(formData);
      if (!result.ok) {
        setError(result.error ?? "Не удалось создать план.");
        return;
      }
      setShowCreate(false);
      event.currentTarget.reset();
    });
  }

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">Планы</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Выберите день и запланируйте активность</p>
      </header>

      <section className="mt-6 rounded-3xl surface-panel p-4">
        <div className="flex items-center justify-between">
          <button
            aria-label="Предыдущий месяц"
            className="grid size-10 place-items-center rounded-full surface-input"
            onClick={() => setMonth((current) => addMonths(current, -1))}
            type="button"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <p className="font-semibold capitalize">
            {month.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
          </p>
          <button
            aria-label="Следующий месяц"
            className="grid size-10 place-items-center rounded-full surface-input"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            type="button"
          >
            <ChevronRight aria-hidden className="size-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-[var(--muted)]">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {calendarCells.map((cell) => {
            if (!cell.day) {
              return <div key={cell.key} />;
            }

            const hasPlans = (plansByDay.get(cell.key)?.length ?? 0) > 0;
            const dayHolidays = holidaysForDay(holidays, cell.key);
            const isSelected = cell.key === selectedDay;
            const isToday = cell.key === toDateKey(new Date());

            return (
              <button
                className={`relative grid h-11 place-items-center rounded-2xl text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-[var(--accent)] text-white"
                    : isToday
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "surface-input"
                }`}
                key={cell.key}
                onClick={() => setSelectedDay(cell.key)}
                type="button"
              >
                {cell.day}
                {dayHolidays.length ? (
                  <span className="absolute right-1 top-1 text-[10px] leading-none">
                    {dayHolidays[0]?.emoji}
                  </span>
                ) : null}
                {hasPlans ? (
                  <span
                    className={`absolute bottom-1 size-1.5 rounded-full ${
                      isSelected ? "bg-white" : "bg-[var(--accent)]"
                    }`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{formatDateRu(selectedDay)}</h2>
          <button
            className="inline-flex items-center gap-1 rounded-2xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white"
            onClick={() => setShowCreate(true)}
            type="button"
          >
            <Plus aria-hidden className="size-4" />
            Добавить
          </button>
        </div>

        {selectedHolidays.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedHolidays.map((holiday) => (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]"
                key={holiday.key}
              >
                {holiday.emoji} {holiday.label}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-3 grid gap-3">
          {selectedPlans.length ? (
            selectedPlans.map((plan) => (
              <article className="rounded-3xl surface-panel p-4" key={plan.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{plan.title}</p>
                    {plan.details ? (
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{plan.details}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {plan.is_surprise ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[var(--accent)]">
                          <Gift aria-hidden className="size-3" />
                          Сюрприз
                        </span>
                      ) : null}
                      {plan.remind_enabled ? (
                        <span className="rounded-full surface-input px-2 py-1">Напоминание</span>
                      ) : null}
                    </div>
                  </div>
                  {plan.created_by === userId ? (
                    <div className="flex gap-2">
                      <button
                        className="text-xs font-semibold text-[var(--accent)]"
                        disabled={isPending}
                        onClick={() => startTransition(() => completePlan(plan.id))}
                        type="button"
                      >
                        Готово
                      </button>
                      <button
                        className="text-xs text-[var(--muted)]"
                        disabled={isPending}
                        onClick={() => startTransition(() => deletePlan(plan.id))}
                        type="button"
                      >
                        Удалить
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-3xl surface-panel border-dashed px-4 py-8 text-center text-sm text-[var(--muted)]">
              На этот день пока ничего не запланировано
            </p>
          )}
        </div>
      </section>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form
            className="w-full max-w-md rounded-3xl surface-panel p-5 shadow-xl"
            onSubmit={handleCreate}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">Новый план</p>
              <button
                aria-label="Закрыть"
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={() => setShowCreate(false)}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <p className="mb-3 text-sm text-[var(--muted)]">{formatDateRu(selectedDay)}</p>

            <div className="grid gap-3">
              <input
                className="rounded-2xl surface-input px-4 py-3"
                name="title"
                placeholder="Мероприятие"
                required
              />
              <textarea
                className="min-h-24 rounded-2xl surface-input px-4 py-3"
                name="details"
                placeholder="Описание"
                rows={3}
              />
              <label className="flex items-center justify-between rounded-2xl surface-input px-4 py-3">
                <span className="inline-flex items-center gap-2 font-medium">
                  <Gift aria-hidden className="size-4" />
                  Сюрприз
                </span>
                <input className="size-5 accent-[var(--accent)]" name="isSurprise" type="checkbox" />
              </label>
              <label className="flex items-center justify-between rounded-2xl surface-input px-4 py-3">
                <span className="font-medium">Напоминать</span>
                <input className="size-5 accent-[var(--accent)]" name="remindEnabled" type="checkbox" />
              </label>
              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
              <button
                className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Сохраняем..." : "Запланировать"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
