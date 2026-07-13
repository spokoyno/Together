export default function ChatLoading() {
  return (
    <main className="mx-auto flex h-[100dvh] max-w-md animate-pulse flex-col bg-[var(--chat-bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-[var(--input-bg)]" />
          <div>
            <div className="h-5 w-28 rounded-lg bg-[var(--input-bg)]" />
            <div className="mt-2 h-3 w-16 rounded bg-[var(--input-bg)]" />
          </div>
        </div>
      </header>
      <div className="flex-1 space-y-3 px-4 py-4">
        <div className="ml-auto h-12 w-2/3 rounded-2xl bg-[var(--input-bg)]" />
        <div className="h-12 w-3/5 rounded-2xl bg-[var(--input-bg)]" />
        <div className="ml-auto h-10 w-1/2 rounded-2xl bg-[var(--input-bg)]" />
      </div>
    </main>
  );
}
