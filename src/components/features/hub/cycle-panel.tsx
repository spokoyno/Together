"use client";

import { useMemo, useState, useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateRu } from "@/lib/dates";
import { buildPeriodDaySet, monthGrid } from "@/lib/cycle/calendar";
import { saveMenstrualCycle } from "@/lib/cycle/actions";
import type { MenstrualCycleData } from "@/lib/hub/load-data.server";

type CyclePanelProps = {
  cycle: MenstrualCycleData | null;
  userGender: "female" | "male" | "other" | null;
  partnerName: string;
};

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export function CyclePanel({ cycle, userGender, partnerName }: CyclePanelProps) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [lastStart, setLastStart] = useState(cycle?.last_period_start ?? "");
  const [cycleLength, setCycleLength] = useState(String(cycle?.cycle_length_days ?? 28));
  const [periodLength, setPeriodLength] = useState(String(cycle?.period_length_days ?? 5));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const canEdit = userGender === "female";
  const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const periodDays = useMemo(() => {
    if (!cycle?.last_period_start) {
      return new Set<string>();
    }

    const rangeStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const rangeEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, "0")}`;

    return buildPeriodDaySet({
      lastPeriodStart: cycle.last_period_start,
      cycleLengthDays: cycle.cycle_length_days,
      periodLengthDays: cycle.period_length_days,
      rangeStart,
      rangeEnd,
    });
  }, [cycle, month, year]);

  const cells = monthGrid(year, month);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await saveMenstrualCycle({
        lastPeriodStart: lastStart,
        cycleLengthDays: Number(cycleLength),
        periodLengthDays: Number(periodLength),
      });
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить.");
      }
    });
  }

  if (!cycle?.last_period_start && !canEdit) {
    return (
      <EmptyState
        description={`${partnerName} ещё не указала данные цикла.`}
        title="Календарь недоступен"
      />
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl surface-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            className="rounded-xl surface-input px-3 py-2 text-sm font-semibold"
            onClick={() => setMonthOffset((value) => value - 1)}
            type="button"
          >
            ←
          </button>
          <p className="font-bold">
            {MONTH_NAMES[month]} {year}
          </p>
          <button
            className="rounded-xl surface-input px-3 py-2 text-sm font-semibold"
            onClick={() => setMonthOffset((value) => value + 1)}
            type="button"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--muted)]">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const isPeriod = cell.key && periodDays.has(cell.key);
            return (
              <div
                className={`grid aspect-square place-items-center rounded-xl text-sm ${
                  isPeriod ? "bg-rose-500 font-semibold text-white" : "surface-input"
                }`}
                key={cell.key}
              >
                {cell.day ?? ""}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
          Розовым отмечены примерные дни месячных. Прогноз ориентировочный.
        </p>
      </section>

      {canEdit ? (
        <form className="grid gap-3 rounded-3xl surface-panel p-5" onSubmit={submit}>
          <p className="font-bold">Настройки цикла</p>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Начало последних месячных</span>
            <input
              className="rounded-2xl surface-input px-4 py-3"
              onChange={(event) => setLastStart(event.target.value)}
              required
              type="date"
              value={lastStart}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Длина цикла (дней)</span>
            <input
              className="rounded-2xl surface-input px-4 py-3"
              max={45}
              min={20}
              onChange={(event) => setCycleLength(event.target.value)}
              required
              type="number"
              value={cycleLength}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Длительность месячных (дней)</span>
            <input
              className="rounded-2xl surface-input px-4 py-3"
              max={10}
              min={2}
              onChange={(event) => setPeriodLength(event.target.value)}
              required
              type="number"
              value={periodLength}
            />
          </label>
          {cycle?.updated_at ? (
            <p className="text-xs text-[var(--muted)]">
              Обновлено {formatDateRu(cycle.updated_at.slice(0, 10))}
            </p>
          ) : null}
          {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
          <button
            className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            Сохранить
          </button>
        </form>
      ) : cycle?.last_period_start ? (
        <section className="rounded-3xl surface-panel p-5 text-sm text-[var(--muted)]">
          <p>
            Последнее начало: {formatDateRu(cycle.last_period_start)}
          </p>
          <p className="mt-2">
            Цикл ~{cycle.cycle_length_days} дн., месячные ~{cycle.period_length_days} дн.
          </p>
        </section>
      ) : null}
    </div>
  );
}
