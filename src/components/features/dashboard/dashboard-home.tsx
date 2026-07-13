"use client";

import Link from "next/link";
import { Timer } from "lucide-react";
import { useTransition } from "react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { DashboardPanels } from "@/components/features/dashboard/dashboard-panels";
import { saveMood } from "@/lib/mood/actions";
import { DASHBOARD_MOODS, MOOD_EMOJI, MOOD_LABELS } from "@/lib/mood/labels";
import { daysUntil, formatDateRu } from "@/lib/dates";
import type { DashboardPanelPreference } from "@/lib/hub/panels";
import type { MoodLevel } from "@/types/domain";

type NearestCountdown = {
  id: string;
  title: string;
  target_date: string;
};

type DashboardHomeProps = {
  myName: string;
  myAvatarUrl: string | null;
  partnerName: string;
  partnerAvatarUrl: string | null;
  daysTogether: number | null;
  myMood: MoodLevel | null;
  partnerMood: MoodLevel | null;
  dailyQuestionPrompt: string;
  panelPreferences: DashboardPanelPreference[];
  nearestCountdown: NearestCountdown | null;
};

export function DashboardHome({
  myName,
  myAvatarUrl,
  partnerName,
  partnerAvatarUrl,
  daysTogether,
  myMood,
  partnerMood,
  dailyQuestionPrompt,
  panelPreferences,
  nearestCountdown,
}: DashboardHomeProps) {
  const [isPending, startTransition] = useTransition();

  function pickMood(level: MoodLevel) {
    const formData = new FormData();
    formData.set("level", level);
    startTransition(async () => {
      await saveMood(formData);
    });
  }

  return (
    <>
      <header className="mt-2 text-center">
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <UserAvatar imageUrl={myAvatarUrl} name={myName} size="md" />
            <p className="max-w-[7rem] truncate text-sm font-semibold">{myName}</p>
          </div>
          <div className="grid size-10 place-items-center rounded-full bg-[var(--accent-soft)] text-lg">
            ♥
          </div>
          <div className="flex flex-col items-center gap-2">
            <UserAvatar imageUrl={partnerAvatarUrl} name={partnerName} size="md" />
            <p className="max-w-[7rem] truncate text-sm font-semibold">{partnerName}</p>
          </div>
        </div>
      </header>

      <section className="mt-6 rounded-3xl bg-[var(--accent)] p-5 text-white">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm opacity-80">Вместе</p>
            <p className="mt-1 text-4xl font-bold">
              {daysTogether !== null ? `${daysTogether} дней` : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80">Настроение {partnerName}</p>
            <p className="mt-1 text-lg font-bold">
              {partnerMood
                ? `${MOOD_EMOJI[partnerMood]} ${MOOD_LABELS[partnerMood]}`
                : "—"}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium opacity-80">Ваше настроение</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DASHBOARD_MOODS.map((level) => (
              <button
                className={`rounded-2xl px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                  myMood === level
                    ? "bg-white text-[var(--accent)]"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
                disabled={isPending}
                key={level}
                onClick={() => pickMood(level)}
                type="button"
              >
                {MOOD_EMOJI[level]} {MOOD_LABELS[level]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {nearestCountdown ? (
        <Link
          className="mt-5 block rounded-3xl bg-gradient-to-r from-rose-500 to-orange-500 p-5 text-white transition-transform active:scale-[0.99]"
          href="/memories/countdown"
        >
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Timer aria-hidden className="size-4" />
            <span>
              {daysUntil(nearestCountdown.target_date) === 0
                ? "Сегодня"
                : daysUntil(nearestCountdown.target_date) === 1
                  ? "Завтра"
                  : `Через ${daysUntil(nearestCountdown.target_date)} дн.`}
            </span>
          </div>
          <p className="mt-2 text-lg font-bold leading-snug">{nearestCountdown.title}</p>
          <p className="mt-1 text-sm opacity-90">{formatDateRu(nearestCountdown.target_date)}</p>
        </Link>
      ) : null}

      <DashboardPanels preferences={panelPreferences} />

      <section className="mt-5 rounded-3xl surface-panel p-5">
        <p className="text-sm font-semibold text-[var(--accent)]">Вопрос дня</p>
        <h2 className="mt-2 text-xl font-bold leading-snug">{dailyQuestionPrompt}</h2>
        <Link
          className="mt-5 block w-full rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-center font-semibold text-[var(--accent)]"
          href="/question"
        >
          Ответить
        </Link>
      </section>
    </>
  );
}
