import Link from "next/link";

const cards = [
  { title: "Настроение", value: "Спокойное", note: "обновлено недавно" },
  { title: "До встречи", value: "12 дней", note: "следующее событие" },
  { title: "Наши планы", value: "4 активных", note: "1 на этой неделе" },
  { title: "Воспоминания", value: "18 моментов", note: "последнее вчера" },
];

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-7">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">Доброе утро</p>
          <h1 className="text-2xl font-bold">Alex + Partner</h1>
        </div>
        <div className="grid size-12 place-items-center rounded-full bg-[var(--accent-soft)] text-xl">♥</div>
      </header>

      <section className="mt-7 rounded-3xl bg-[var(--accent)] p-5 text-white">
        <p className="text-sm opacity-80">Вместе</p>
        <p className="mt-1 text-4xl font-bold">428 дней</p>
        <p className="mt-4 text-sm opacity-90">Следующая годовщина через 302 дня</p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <article key={card.title} className="rounded-3xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <p className="text-sm text-[var(--muted)]">{card.title}</p>
            <p className="mt-2 text-xl font-bold">{card.value}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 rounded-3xl border border-[var(--border)] bg-white p-5">
        <p className="text-sm font-semibold text-[var(--accent)]">Вопрос дня</p>
        <h2 className="mt-2 text-xl font-bold">Что нам стоит обязательно сделать этим летом?</h2>
        <button className="mt-5 w-full rounded-2xl bg-[var(--accent-soft)] px-4 py-3 font-semibold text-[var(--accent)]">
          Ответить
        </button>
      </section>

      <nav className="fixed bottom-4 left-1/2 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 justify-around rounded-3xl border border-[var(--border)] bg-white/95 p-3 shadow-lg backdrop-blur">
        <Link href="/dashboard">Главная</Link>
        <Link href="/plans">Планы</Link>
        <Link href="/memories">Моменты</Link>
        <Link href="/profile">Профиль</Link>
      </nav>
    </main>
  );
}
