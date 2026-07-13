"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { useLanguage } from "@/components/providers/language-provider";
import { relativeTimeLocalized } from "@/lib/dates";
import { MOOD_LABEL_KEYS } from "@/lib/i18n/panel-keys";
import { saveMood } from "@/lib/mood/actions";
import { MOOD_EMOJI } from "@/lib/mood/labels";
import type { MoodLevel } from "@/types/domain";

type MoodEntry = {
  level: string;
  energy: number | null;
  note: string | null;
  created_at: string;
};

type MoodPageContentProps = {
  myMoods: MoodEntry[];
  partnerMoods: MoodEntry[];
  partnerName: string | null;
};

const moodLevels: MoodLevel[] = ["great", "good", "neutral", "low", "hard"];

export function MoodPageContent({ myMoods, partnerMoods, partnerName }: MoodPageContentProps) {
  const { locale, t } = useLanguage();

  function moodLabel(level: MoodLevel) {
    return t(MOOD_LABEL_KEYS[level]);
  }

  return (
    <>
      <h1 className="text-3xl font-semibold">{t("moodPageTitle")}</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">{t("moodPageHint")}</p>

      <form action={saveMood} className="mt-8 grid gap-3 rounded-[1.75rem] surface-panel p-5">
        <p className="font-semibold">{t("moodHowAreYou")}</p>
        <select className="rounded-2xl surface-input px-4 py-3" name="level" required>
          {moodLevels.map((level) => (
            <option key={level} value={level}>
              {MOOD_EMOJI[level]} {moodLabel(level)}
            </option>
          ))}
        </select>
        <label className="grid gap-2">
          <span className="text-sm">{t("moodEnergy")}</span>
          <input
            className="rounded-2xl surface-input px-4 py-3"
            max={5}
            min={1}
            name="energy"
            type="number"
          />
        </label>
        <textarea
          className="rounded-2xl surface-input px-4 py-3"
          maxLength={500}
          name="note"
          placeholder={t("moodNotePlaceholder")}
          rows={3}
        />
        <button
          className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white"
          type="submit"
        >
          {t("moodShare")}
        </button>
      </form>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t("moodHistoryTitle")}</h2>
        <div className="mt-4 grid gap-3">
          {myMoods.length ? (
            myMoods.map((mood) => {
              const level = mood.level as MoodLevel;
              return (
                <article className="rounded-[1.75rem] surface-panel p-4" key={mood.created_at}>
                  <p className="font-semibold">
                    {MOOD_EMOJI[level]} {moodLabel(level)}
                  </p>
                  {mood.note ? <p className="mt-2 text-sm text-[var(--muted)]">{mood.note}</p> : null}
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {relativeTimeLocalized(locale, mood.created_at)}
                  </p>
                </article>
              );
            })
          ) : (
            <EmptyState description={t("moodHistoryEmptyDesc")} title={t("moodHistoryEmpty")} />
          )}
        </div>
      </section>

      {partnerName ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">{partnerName}</h2>
          <div className="mt-4 grid gap-3">
            {partnerMoods.length ? (
              partnerMoods.map((mood) => {
                const level = mood.level as MoodLevel;
                return (
                  <article className="rounded-[1.75rem] surface-panel p-4" key={mood.created_at}>
                    <p className="font-semibold">
                      {MOOD_EMOJI[level]} {moodLabel(level)}
                    </p>
                    {mood.note ? (
                      <p className="mt-2 text-sm text-[var(--muted)]">{mood.note}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {relativeTimeLocalized(locale, mood.created_at)}
                    </p>
                  </article>
                );
              })
            ) : (
              <EmptyState description={t("moodPartnerQuietDesc")} title={t("moodPartnerQuiet")} />
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}
