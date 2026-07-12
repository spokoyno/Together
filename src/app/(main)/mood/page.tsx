import { redirect } from "next/navigation";
import { saveMood } from "@/lib/mood/actions";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContext } from "@/lib/couple/context";
import { relativeTimeRu } from "@/lib/dates";
import { MOOD_EMOJI, MOOD_LABELS } from "@/lib/mood/labels";
import type { MoodLevel } from "@/types/domain";
import { EmptyState } from "@/components/ui/empty-state";

const moodLevels: MoodLevel[] = ["great", "good", "neutral", "low", "hard"];

export default async function MoodPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    redirect("/dashboard");
  }

  const { data: myMoods } = await supabase
    .from("moods")
    .select("level, energy, note, created_at")
    .eq("couple_id", context.coupleId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: partnerMoods } = context?.partner
    ? await supabase
        .from("moods")
        .select("level, energy, note, created_at")
        .eq("couple_id", context.coupleId)
        .eq("user_id", context.partner.id)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] };

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-8">
      <h1 className="text-3xl font-bold">Настроение</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Делитесь состоянием добровольно — это не слежка, а способ быть ближе.
      </p>

      <form action={saveMood} className="mt-8 grid gap-3 rounded-3xl surface-panel p-5">
        <p className="font-semibold">Как вы сейчас?</p>
        <select className="rounded-2xl surface-input px-4 py-3" name="level" required>
          {moodLevels.map((level) => (
            <option key={level} value={level}>
              {MOOD_EMOJI[level]} {MOOD_LABELS[level]}
            </option>
          ))}
        </select>
        <label className="grid gap-2">
          <span className="text-sm">Энергия (1–5)</span>
          <input className="rounded-2xl surface-input px-4 py-3" max={5} min={1} name="energy" type="number" />
        </label>
        <textarea
          className="rounded-2xl surface-input px-4 py-3"
          maxLength={500}
          name="note"
          placeholder="Комментарий (необязательно)"
          rows={3}
        />
        <button className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white" type="submit">
          Поделиться
        </button>
      </form>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Ваша история</h2>
        <div className="mt-4 grid gap-3">
          {myMoods?.length ? (
            myMoods.map((mood) => {
              const level = mood.level as MoodLevel;
              return (
                <article className="rounded-3xl surface-panel p-4" key={mood.created_at}>
                  <p className="font-semibold">
                    {MOOD_EMOJI[level]} {MOOD_LABELS[level]}
                  </p>
                  {mood.note ? <p className="mt-2 text-sm text-[var(--muted)]">{mood.note}</p> : null}
                  <p className="mt-2 text-xs text-[var(--muted)]">{relativeTimeRu(mood.created_at)}</p>
                </article>
              );
            })
          ) : (
            <EmptyState description="Запишите первое настроение." title="История пуста" />
          )}
        </div>
      </section>

      {context?.partner ? (
        <section className="mt-8">
          <h2 className="text-lg font-bold">{context.partner.display_name}</h2>
          <div className="mt-4 grid gap-3">
            {partnerMoods?.length ? (
              partnerMoods.map((mood) => {
                const level = mood.level as MoodLevel;
                return (
                  <article className="rounded-3xl surface-panel p-4" key={mood.created_at}>
                    <p className="font-semibold">
                      {MOOD_EMOJI[level]} {MOOD_LABELS[level]}
                    </p>
                    {mood.note ? <p className="mt-2 text-sm text-[var(--muted)]">{mood.note}</p> : null}
                    <p className="mt-2 text-xs text-[var(--muted)]">{relativeTimeRu(mood.created_at)}</p>
                  </article>
                );
              })
            ) : (
              <EmptyState description="Партнёр ещё не делился настроением." title="Пока тихо" />
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
