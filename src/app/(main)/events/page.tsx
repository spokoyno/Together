import { redirect } from "next/navigation";
import { createEvent, deleteEvent } from "@/lib/memories/actions";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContext } from "@/lib/couple/context";
import { daysUntil, formatDateTimeRu } from "@/lib/dates";
import { EmptyState } from "@/components/ui/empty-state";

export default async function EventsPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    redirect("/dashboard");
  }

  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at")
    .eq("couple_id", context.coupleId)
    .order("starts_at", { ascending: true });

  const upcoming = events?.filter((event) => new Date(event.starts_at) >= new Date()) ?? [];
  const past = events?.filter((event) => new Date(event.starts_at) < new Date()) ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-8">
      <h1 className="text-3xl font-bold">События</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Годовщины, встречи и важные даты с обратным отсчётом.
      </p>

      <form action={createEvent} className="mt-8 grid gap-3 rounded-3xl surface-panel p-5">
        <p className="font-semibold">Новое событие</p>
        <input className="rounded-2xl surface-input px-4 py-3" name="title" placeholder="Название" required />
        <input className="rounded-2xl surface-input px-4 py-3" name="startsAt" required type="datetime-local" />
        <button className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white" type="submit">
          Добавить
        </button>
      </form>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Ближайшие</h2>
        <div className="mt-4 grid gap-3">
          {upcoming.length ? (
            upcoming.map((event) => (
              <article className="rounded-3xl surface-panel p-4" key={event.id}>
                <p className="font-semibold">{event.title}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{formatDateTimeRu(event.starts_at)}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--accent)]">
                  через {daysUntil(event.starts_at.slice(0, 10))} дн.
                </p>
                <form action={deleteEvent.bind(null, event.id)} className="mt-4">
                  <button className="text-sm text-[var(--muted)]" type="submit">
                    Удалить
                  </button>
                </form>
              </article>
            ))
          ) : (
            <EmptyState description="Добавьте первую важную дату." title="Нет событий" />
          )}
        </div>
      </section>

      {past.length ? (
        <section className="mt-8">
          <h2 className="text-lg font-bold">Прошедшие</h2>
          <div className="mt-4 grid gap-3">
            {past.map((event) => (
              <article className="rounded-3xl surface-panel p-4 opacity-75" key={event.id}>
                <p className="font-semibold">{event.title}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{formatDateTimeRu(event.starts_at)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
