import { redirect } from "next/navigation";
import { createMemory, deleteMemory } from "@/lib/memories/actions";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { formatDateRu, relativeTimeRu } from "@/lib/dates";
import { EmptyState } from "@/components/ui/empty-state";

export default async function MemoriesPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (!context?.isComplete) {
    redirect("/dashboard");
  }

  const { data: memories } = await supabase
    .from("memories")
    .select("id, title, body, happened_on, tags, created_at, profiles(display_name)")
    .eq("couple_id", context.coupleId)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-8">
      <h1 className="text-3xl font-bold">Моменты</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Сохраняйте важные воспоминания вместе.
      </p>

      <form action={createMemory} className="mt-8 grid gap-3 rounded-3xl surface-panel p-5">
        <p className="font-semibold">Новое воспоминание</p>
        <input className="rounded-2xl surface-input px-4 py-3" name="title" placeholder="Заголовок" />
        <textarea
          className="rounded-2xl surface-input px-4 py-3"
          name="body"
          placeholder="Что произошло?"
          rows={4}
        />
        <input className="rounded-2xl surface-input px-4 py-3" name="happenedOn" type="date" />
        <input className="rounded-2xl surface-input px-4 py-3" name="tags" placeholder="Теги через запятую" />
        <button className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white" type="submit">
          Сохранить
        </button>
      </form>

      <section className="mt-8 grid gap-3">
        {memories?.length ? (
          memories.map((memory) => (
            <article className="rounded-3xl surface-panel p-5" key={memory.id}>
              {memory.title ? <h2 className="text-xl font-bold">{memory.title}</h2> : null}
              {memory.body ? (
                <p className="mt-2 leading-7 text-[var(--muted)]">{memory.body}</p>
              ) : null}
              <p className="mt-3 text-xs text-[var(--muted)]">
                {memory.happened_on ? formatDateRu(memory.happened_on) : relativeTimeRu(memory.created_at)}
              </p>
              {memory.tags?.length ? (
                <p className="mt-2 text-xs text-[var(--accent)]">{memory.tags.join(" · ")}</p>
              ) : null}
              <form action={deleteMemory.bind(null, memory.id)} className="mt-4">
                <button className="text-sm text-[var(--muted)]" type="submit">
                  Удалить
                </button>
              </form>
            </article>
          ))
        ) : (
          <EmptyState description="Добавьте первый момент, который хотите сохранить." title="Лента пуста" />
        )}
      </section>
    </main>
  );
}
