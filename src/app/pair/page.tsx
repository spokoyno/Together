import Link from "next/link";
import { redirect } from "next/navigation";
import { InviteLinkButton } from "@/components/features/pair/invite-link-button";
import { requireUser } from "@/lib/auth/session";
import { createCouple } from "@/lib/couple/actions";
import { getCoupleContext } from "@/lib/couple/context";
import { formatDateRu } from "@/lib/dates";

export default async function PairPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (context?.isComplete) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <Link className="text-sm text-[var(--accent)]" href="/">
        ← На главную
      </Link>

      {!context ? (
        <>
          <p className="mt-6 text-sm font-semibold text-[var(--accent)]">Пара</p>
          <h1 className="mt-2 text-3xl font-bold">Создайте ваше пространство</h1>
          <p className="mt-3 leading-7 text-[var(--muted)]">
            Укажите дату начала отношений. После этого вы получите ссылку для партнёра.
          </p>

          <form action={createCouple} className="mt-8 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Дата начала отношений</span>
              <input
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                name="relationshipStartedOn"
                required
                type="date"
              />
            </label>
            <button
              className="rounded-2xl bg-[var(--accent)] px-5 py-4 font-semibold text-white"
              type="submit"
            >
              Создать пару
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-6 text-sm font-semibold text-[var(--accent)]">Приглашение</p>
          <h1 className="mt-2 text-3xl font-bold">Подключите партнёра</h1>
          <p className="mt-3 leading-7 text-[var(--muted)]">
            Ссылка действует 7 дней. После подключения партнёра откроется полный доступ к
            приложению.
          </p>

          {context.relationshipStartedOn ? (
            <p className="mt-4 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
              Вместе с {formatDateRu(context.relationshipStartedOn)}
            </p>
          ) : null}

          <div className="mt-8">
            <InviteLinkButton />
          </div>
        </>
      )}
    </main>
  );
}
