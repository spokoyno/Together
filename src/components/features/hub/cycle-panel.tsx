"use client";

import { useMemo, useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateLocalized } from "@/lib/dates";
import { buildPeriodDaySet, monthGrid } from "@/lib/cycle/calendar";
import { saveMenstrualCycle } from "@/lib/cycle/actions";
import type { MenstrualCycleData } from "@/lib/hub/load-data.server";

type CyclePanelProps = {
  cycle: MenstrualCycleData | null;
  userGender: "female" | "male" | "other" | null;
  partnerName: string;
};

const WEEKDAY_KEYS = [
  "calendarWeekdayMon",
  "calendarWeekdayTue",
  "calendarWeekdayWed",
  "calendarWeekdayThu",
  "calendarWeekdayFri",
  "calendarWeekdaySat",
  "calendarWeekdaySun",
] as const;

export function CyclePanel({ cycle, userGender, partnerName }: CyclePanelProps) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [lastStart, setLastStart] = useState(cycle?.last_period_start ?? "");
  const [cycleLength, setCycleLength] = useState(String(cycle?.cycle_length_days ?? 28));
  const [periodLength, setPeriodLength] = useState(String(cycle?.period_length_days ?? 5));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { locale, t } = useLanguage();

  const canEdit = userGender === "female";
  const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(viewMonth);

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
        setError(result.error ?? t("hubErrorSave"));
      }
    });
  }

  if (!cycle?.last_period_start && !canEdit) {
    return (
      <EmptyState
        description={t("hubCycleNoData", { name: partnerName })}
        title={t("hubCycleUnavailable")}
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
          <p className="font-bold capitalize">{monthLabel}</p>
          <button
            className="rounded-xl surface-input px-3 py-2 text-sm font-semibold"
            onClick={() => setMonthOffset((value) => value + 1)}
            type="button"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--muted)]">
          {WEEKDAY_KEYS.map((key) => (
            <span key={key}>{t(key)}</span>
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

        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">{t("hubCycleLegend")}</p>
      </section>

      {canEdit ? (
        <form className="grid gap-3 rounded-3xl surface-panel p-5" onSubmit={submit}>
          <p className="font-bold">{t("hubCycleSettings")}</p>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">{t("hubCycleLastPeriodStart")}</span>
            <input
              className="rounded-2xl surface-input px-4 py-3"
              onChange={(event) => setLastStart(event.target.value)}
              required
              type="date"
              value={lastStart}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">{t("hubCycleLengthDays")}</span>
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
            <span className="text-sm font-semibold">{t("hubCyclePeriodLengthDays")}</span>
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
              {t("hubUpdatedAt", {
                date: formatDateLocalized(locale, cycle.updated_at.slice(0, 10)),
              })}
            </p>
          ) : null}
          {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
          <button
            className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {t("commonSave")}
          </button>
        </form>
      ) : cycle?.last_period_start ? (
        <section className="rounded-3xl surface-panel p-5 text-sm text-[var(--muted)]">
          <p>
            {t("hubLastStart", { date: formatDateLocalized(locale, cycle.last_period_start) })}
          </p>
          <p className="mt-2">
            {t("hubCycleInfo", {
              cycleDays: cycle.cycle_length_days,
              periodDays: cycle.period_length_days,
            })}
          </p>
        </section>
      ) : null}
    </div>
  );
}
