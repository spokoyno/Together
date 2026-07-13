"use client";

export function TabPageSkeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-md animate-pulse px-5 pb-32 pt-8">
      <div className="h-8 w-40 rounded-xl bg-[var(--input-bg)]" />
      <div className="mt-3 h-4 w-56 rounded-lg bg-[var(--input-bg)]" />

      <div className="mt-8 h-28 rounded-3xl bg-[var(--input-bg)]" />

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="h-28 rounded-3xl bg-[var(--input-bg)]" />
        <div className="h-28 rounded-3xl bg-[var(--input-bg)]" />
        <div className="h-28 rounded-3xl bg-[var(--input-bg)]" />
        <div className="h-28 rounded-3xl bg-[var(--input-bg)]" />
      </div>

      <div className="mt-5 h-36 rounded-3xl bg-[var(--input-bg)]" />
    </main>
  );
}
