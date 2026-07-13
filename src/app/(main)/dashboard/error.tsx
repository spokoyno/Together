"use client";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 pb-28 pt-7">
      <h1 className="text-2xl font-bold">Не удалось открыть главную</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Попробуйте обновить страницу. Если не помогло — закройте приложение полностью и откройте
        снова.
      </p>
      <button
        className="mt-6 rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white"
        onClick={reset}
        type="button"
      >
        Обновить
      </button>
    </main>
  );
}
