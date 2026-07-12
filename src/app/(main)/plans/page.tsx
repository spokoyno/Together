import { redirect } from "next/navigation";
import { createPlan, completePlan, deletePlan } from "@/lib/plans/actions";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { formatDateTimeRu } from "@/lib/dates";
import { EmptyState } from "@/components/ui/empty-state";

export default async function PlansPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (!context?.isComplete) {
    redirect("/dashboard");
  }

  const { data: plans } = await supabase
    .from("plans")
    .select("id, title, details, status, due_at, created_at, profiles(display_name)")
    .eq("couple_id", context.coupleId)
    .order("created_at", { ascending: false });

  const activePlans = plans?.filter((plan) => plan.status === "active") ?? [];
  const completedPlans = plans?.filter((plan) => plan.status === "completed") ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-8">
      <h1 className="text-3xl font-bold">Совместные планы</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Свидания, покупки, поездки и любые общие задачи.
      </p>

      <form action={createPlan} className="mt-8 grid gap-3 rounded-3xl surface-panel p-5">
        <p className="font-semibold">Новый план</p>
        <input
          className="rounded-2xl surface-input px-4 py-3"
          name="title"
          placeholder="Название"
          required
        />
        <textarea
          className="rounded-2xl surface-input px-4 py-3"
          name="details"
          placeholder="Детали (необязательно)"
          rows={3}
        />
        <input className="rounded-2xl surface-input px-4 py-3" name="dueAt" type="datetime-local" />
        <button className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white" type="submit">
          Добавить
        </button>
      </form>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Активные</h2>
        <div className="mt-4 grid gap-3">
          {activePlans.length ? (
            activePlans.map((plan) => (
              <article className="rounded-3xl surface-panel p-4" key={plan.id}>
                <p className="font-semibold">{plan.title}</p>
                {plan.details ? (
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{plan.details}</p>
                ) : null}
                {plan.due_at ? (
                  <p className="mt-2 text-xs text-[var(--muted)]">До {formatDateTimeRu(plan.due_at)}</p>
                ) : null}
                <div className="mt-4 flex gap-2">
                  <form action={completePlan.bind(null, plan.id)}>
                    <button className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]" type="submit">
                      Готово
                    </button>
                  </form>
                  <form action={deletePlan.bind(null, plan.id)}>
                    <button className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm" type="submit">
                      Удалить
                    </button>
                  </form>
                </div>
              </article>
            ))
          ) : (
            <EmptyState description="Добавьте первый совместный план." title="Пока пусто" />
          )}
        </div>
      </section>

      {completedPlans.length ? (
        <section className="mt-8">
          <h2 className="text-lg font-bold">Завершённые</h2>
          <div className="mt-4 grid gap-3">
            {completedPlans.map((plan) => (
              <article className="rounded-3xl surface-panel p-4 opacity-80" key={plan.id}>
                <p className="font-semibold line-through">{plan.title}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
