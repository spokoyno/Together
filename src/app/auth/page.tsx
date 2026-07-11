export default function AuthPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <p className="text-sm font-semibold text-[var(--accent)]">Аккаунт</p>
      <h1 className="mt-2 text-3xl font-bold">Начните своё пространство</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Этот экран пока работает как UI-заглушка. Подключение Supabase описано в документации архива.
      </p>

      <form className="mt-8 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Имя</span>
          <input className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" placeholder="Ваше имя" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Email</span>
          <input className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" placeholder="name@example.com" type="email" />
        </label>
        <button className="mt-2 rounded-2xl bg-[var(--accent)] px-5 py-4 font-semibold text-white" type="button">
          Продолжить
        </button>
      </form>
    </main>
  );
}
