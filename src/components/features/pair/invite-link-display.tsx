"use client";

export function InviteLinkDisplay({ inviteUrl }: { inviteUrl: string }) {
  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-sm text-[var(--muted)]">Отправьте эту ссылку партнёру:</p>
      <p className="mt-2 break-all text-sm font-medium">{inviteUrl}</p>
      <button
        className="mt-4 w-full rounded-2xl bg-[var(--accent-soft)] px-4 py-3 font-semibold text-[var(--accent)]"
        onClick={handleCopy}
        type="button"
      >
        Скопировать
      </button>
    </div>
  );
}
