import Link from "next/link";
import { redirect } from "next/navigation";
import { PairWaitingPanel } from "@/components/features/pair/pair-waiting-panel";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContext } from "@/lib/couple/context";
import { daysBetween, daysUntil, formatDateTimeRu, greeting, relativeTimeRu, todayIso } from "@/lib/dates";
import { getOrCreateDailyQuestion } from "@/lib/question/actions";
import { MOOD_EMOJI, MOOD_LABELS } from "@/lib/mood/labels";
import type { MoodLevel } from "@/types/domain";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context) {
    redirect("/pair");
  }

  if (!context.isComplete) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-7">
        <header>
          <p className="text-sm text-[var(--muted)]">{greeting()}</p>
          <h1 className="text-2xl font-bold">Together</h1>
        </header>

        <section className="mt-7 rounded-3xl border border-dashed border-[var(--border)] bg-white p-5">
          <p className="text-sm font-semibold text-[var(--accent)]">Почти готово</p>
          <p className="mt-2 leading-7 text-[var(--muted)]">
            Приложение откроется полностью, когда партнёр примет приглашение. Пока можно
            управлять ссылкой и настройками профиля.
          </p>
        </section>

        <div className="mt-6">
          <PairWaitingPanel
            inviteUrl={null}
            relationshipStartedOn={context.relationshipStartedOn}
            showDashboardLink={false}
            showProfileLink
          />
        </div>
      </main>
    );
  }

  const me = context.members.find((member) => member.id === user.id);
  const partner = context.partner;
  const daysTogether = context.relationshipStartedOn
    ? daysBetween(context.relationshipStartedOn)
    : null;

  const [
    partnerMoodResult,
    plansResult,
    memoriesResult,
    eventsResult,
    dailyQuestion,
    myMoodResult,
  ] = await Promise.all([
    partner
      ? supabase
          .from("moods")
          .select("level, created_at")
          .eq("couple_id", context.coupleId)
          .eq("user_id", partner.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("plans")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", context.coupleId)
      .eq("status", "active"),
    supabase
      .from("memories")
      .select("id, created_at", { count: "exact" })
      .eq("couple_id", context.coupleId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("events")
      .select("title, starts_at")
      .eq("couple_id", context.coupleId)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    getOrCreateDailyQuestion(supabase, context.coupleId),
    supabase
      .from("moods")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", context.coupleId)
      .eq("user_id", user.id),
  ]);

  const partnerMood = partnerMoodResult.data;
  const activePlans = plansResult.count ?? 0;
  const memoriesCount = memoriesResult.count ?? 0;
  const latestMemory = memoriesResult.data?.[0];
  const nextEvent = eventsResult.data;
  const myMoodsCount = myMoodResult.count ?? 0;

  const partnerMoodLevel = partnerMood?.level as MoodLevel | undefined;

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-7">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">{greeting()}</p>
          <h1 className="text-2xl font-bold">
            {me?.display_name ?? "Вы"}
            {partner ? ` + ${partner.display_name}` : ""}
          </h1>
        </div>
        <div className="grid size-12 place-items-center rounded-full bg-[var(--accent-soft)] text-xl">
          ♥
        </div>
      </header>

      <section className="mt-7 rounded-3xl bg-[var(--accent)] p-5 text-white">
        <p className="text-sm opacity-80">Вместе</p>
        <p className="mt-1 text-4xl font-bold">
          {daysTogether !== null ? `${daysTogether} дней` : "—"}
        </p>
        {nextEvent ? (
          <p className="mt-4 text-sm opacity-90">
            {nextEvent.title} через {daysUntil(nextEvent.starts_at.slice(0, 10))} дн.
          </p>
        ) : (
          <p className="mt-4 text-sm opacity-90">Добавьте важное событие</p>
        )}
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <Link
          className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm"
          href="/mood"
        >
          <p className="text-sm text-[var(--muted)]">Настроение</p>
          <p className="mt-2 text-xl font-bold">
            {partnerMoodLevel
              ? `${MOOD_EMOJI[partnerMoodLevel]} ${MOOD_LABELS[partnerMoodLevel]}`
              : "—"}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {partnerMood ? relativeTimeRu(partnerMood.created_at) : "партнёр ещё не делился"}
          </p>
        </Link>

        <Link
          className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm"
          href="/events"
        >
          <p className="text-sm text-[var(--muted)]">Событие</p>
          <p className="mt-2 text-xl font-bold">
            {nextEvent ? `${daysUntil(nextEvent.starts_at.slice(0, 10))} дн.` : "—"}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {nextEvent ? nextEvent.title : "нет ближайших"}
          </p>
        </Link>

        <Link
          className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm"
          href="/plans"
        >
          <p className="text-sm text-[var(--muted)]">Планы</p>
          <p className="mt-2 text-xl font-bold">{activePlans} активных</p>
          <p className="mt-2 text-xs text-[var(--muted)]">общие задачи пары</p>
        </Link>

        <Link
          className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm"
          href="/memories"
        >
          <p className="text-sm text-[var(--muted)]">Воспоминания</p>
          <p className="mt-2 text-xl font-bold">{memoriesCount} моментов</p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {latestMemory ? relativeTimeRu(latestMemory.created_at) : "добавьте первое"}
          </p>
        </Link>
      </section>

      <section className="mt-5 rounded-3xl border border-[var(--border)] bg-white p-5">
        <p className="text-sm font-semibold text-[var(--accent)]">Вопрос дня</p>
        <h2 className="mt-2 text-xl font-bold">
          {dailyQuestion?.questions?.prompt ?? "Вопросы скоро появятся"}
        </h2>
        <Link
          className="mt-5 block w-full rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-center font-semibold text-[var(--accent)]"
          href="/question"
        >
          Ответить
        </Link>
      </section>

      <section className="mt-5 rounded-3xl border border-[var(--border)] bg-white p-5">
        <p className="text-sm font-semibold text-[var(--accent)]">Статистика</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[var(--muted)]">Ваши записи настроения</p>
            <p className="mt-1 text-lg font-bold">{myMoodsCount}</p>
          </div>
          <div>
            <p className="text-[var(--muted)]">Сегодня</p>
            <p className="mt-1 text-lg font-bold">{todayIso()}</p>
          </div>
        </div>
        {nextEvent ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Ближайшее: {nextEvent.title} — {formatDateTimeRu(nextEvent.starts_at)}
          </p>
        ) : null}
      </section>
    </main>
  );
}
