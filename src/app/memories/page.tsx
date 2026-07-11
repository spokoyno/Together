import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <Link className="text-sm text-[var(--accent)]" href="/dashboard">← Назад</Link>
      <h1 className="mt-5 text-3xl font-bold">Наши моменты</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">Приватная лента фотографий и текстовых воспоминаний пары.</p>
      <div className="mt-8 rounded-3xl border border-dashed border-[var(--border)] bg-white p-8 text-center text-[var(--muted)]">
        Пустое состояние. Реализация описана в docs/SCREENS.md и docs/BACKLOG.md.
      </div>
    </main>
  );
}
