import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getCoupleContext } from "@/lib/couple/context";

const features = [
  "Настроение партнёра",
  "Совместные планы",
  "Вопрос дня",
  "Лента воспоминаний",
];

export default async function LandingPage() {
  const { supabase, user } = await getSessionUser();
  const context = user ? await getCoupleContext(supabase, user.id) : null;

  const primaryHref = user
    ? context?.isComplete
      ? "/dashboard"
      : "/pair"
    : "/auth";
  const primaryLabel = user
    ? context?.isComplete
      ? "Открыть приложение"
      : "Подключить пару"
    : "Создать аккаунт";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
      <div className="mb-auto">
        <div className="mb-10 inline-flex rounded-full border border-[var(--border)] bg-white px-3 py-1 text-sm">
          Pre-MVP
        </div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Together
        </p>
        <h1 className="text-4xl font-bold leading-tight">
          Одно приватное пространство для двоих
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">
          Сохраняйте планы, настроение, ответы и важные воспоминания без лишней сложности.
        </p>

        <div className="mt-8 grid gap-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm"
            >
              {feature}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-3">
        <Link
          className="rounded-2xl bg-[var(--accent)] px-5 py-4 text-center font-semibold text-white"
          href={primaryHref}
        >
          {primaryLabel}
        </Link>
        {!user ? (
          <Link
            className="rounded-2xl border border-[var(--border)] bg-white px-5 py-4 text-center font-semibold"
            href="/auth"
          >
            Войти
          </Link>
        ) : null}
      </div>
    </main>
  );
}
