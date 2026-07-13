"use client";

import Link from "next/link";
import { Timer } from "lucide-react";
import { useTransition } from "react";
import { HeartArrowIcon } from "@/components/icons/heart-arrow-icon";
import { useLanguage } from "@/components/providers/language-provider";
import { UserAvatar } from "@/components/ui/user-avatar";
import { DashboardPanels } from "@/components/features/dashboard/dashboard-panels";
import { saveMood } from "@/lib/mood/actions";
import { DASHBOARD_MOODS, MOOD_EMOJI } from "@/lib/mood/labels";
import { MOOD_LABEL_KEYS } from "@/lib/i18n/panel-keys";
import { daysUntil, formatDateLocalized } from "@/lib/dates";
import type { DashboardPanelPreference } from "@/lib/hub/panels-preferences";
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
  const { locale, t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  function pickMood(level: MoodLevel) {
    const formData = new FormData();
    formData.set("level", level);
    startTransition(async () => {
      await saveMood(formData);
    });
  }

  function moodLabel(level: MoodLevel) {
    return t(MOOD_LABEL_KEYS[level]);
  }

  return (
    <>
      <header className="mt-1 rounded-[1.75rem] surface-panel p-5">
        <div className="flex items-center justify-center gap-5">
          <div className="flex flex-col items-center gap-2">
            <UserAvatar imageUrl={myAvatarUrl} name={myName || t("commonYou")} size="md" />
            <p className="max-w-[6.5rem] truncate text-xs font-medium">{myName || t("commonYou")}</p>
          </div>
          <div className="grid size-11 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <HeartArrowIcon className="size-6" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <UserAvatar imageUrl={partnerAvatarUrl} name={partnerName} size="md" />
            <p className="max-w-[6.5rem] truncate text-xs font-medium">{partnerName}</p>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-[var(--border)] pt-4">
          <div>
            <p className="text-xs text-[var(--muted)]">{t("dashboardTogether")}</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums">
              {daysTogether !== null ? `${daysTogether}` : "—"}
              {daysTogether !== null ? (
                <span className="ml-1.5 text-sm font-normal text-[var(--muted)]">
                  {t("commonDays")}
                </span>
              ) : null}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--muted)]">
              {t("dashboardPartnerMood", { name: partnerName })}
            </p>
            <p className="mt-0.5 text-sm font-medium">
              {partnerMood ? `${MOOD_EMOJI[partnerMood]} ${moodLabel(partnerMood)}` : "—"}
            </p>
          </div>
        </div>
      </header>

      <section className="mt-4 rounded-[1.75rem] surface-panel p-4">
        <p className="text-xs text-[var(--muted)]">{t("dashboardYourMood")}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {DASHBOARD_MOODS.map((level) => (
            <button
              className={`rounded-full px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60 ${
                myMood === level
                  ? "bg-[var(--accent-soft)] text-[var(--accent)] ring-1 ring-[var(--accent)]/30"
                  : "bg-[var(--input-bg)] text-[var(--muted)]"
              }`}
              disabled={isPending}
              key={level}
              onClick={() => pickMood(level)}
              type="button"
            >
              {MOOD_EMOJI[level]} {moodLabel(level)}
            </button>
          ))}
        </div>
      </section>

      {nearestCountdown ? (
        <Link
          className="mt-4 block rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 transition-transform active:scale-[0.99]"
          href="/memories/countdown"
        >
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <Timer aria-hidden className="size-4 text-[var(--accent)]" />
            <span>
              {daysUntil(nearestCountdown.target_date) === 0
                ? t("countdownToday")
                : daysUntil(nearestCountdown.target_date) === 1
                  ? t("countdownTomorrow")
                  : t("countdownInDays", { days: daysUntil(nearestCountdown.target_date) })}
            </span>
          </div>
          <p className="mt-2 font-semibold leading-snug">{nearestCountdown.title}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {formatDateLocalized(locale, nearestCountdown.target_date)}
          </p>
        </Link>
      ) : null}

      <DashboardPanels preferences={panelPreferences} />

      <section className="mt-6 rounded-[1.75rem] surface-panel p-5">
        <p className="text-xs font-medium text-[var(--accent)]">{t("dashboardQuestionTitle")}</p>
        <h2 className="mt-2 text-lg font-semibold leading-snug">
          {dailyQuestionPrompt || t("dashboardQuestionSoon")}
        </h2>
        <Link
          className="mt-4 block w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-center text-sm font-semibold text-[var(--foreground)]"
          href="/question"
        >
          {t("dashboardAnswer")}
        </Link>
      </section>
    </>
  );
}
