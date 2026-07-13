"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { createChatNote, deleteChatNote, toggleSaveMessage } from "@/lib/chat/actions";
import { formatDateLocalized } from "@/lib/dates";
import type { ChatNote, ChatSavedMessage } from "@/types/domain";

type ChatPersonalPanelProps = {
  userId: string;
  partnerName: string;
  savedMessages: ChatSavedMessage[];
  notes: ChatNote[];
  onSavedChange: (messageId: string, saved: boolean) => void;
  onNotesChange: (notes: ChatNote[]) => void;
};

export function ChatPersonalPanel({
  userId,
  partnerName,
  savedMessages,
  notes,
  onSavedChange,
  onNotesChange,
}: ChatPersonalPanelProps) {
  const { locale, t } = useLanguage();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreateNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isPending) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await createChatNote(text);
      if (!result.ok) {
        setError(result.error ?? t("chatActionError"));
        return;
      }

      setDraft("");
      onNotesChange([result.note, ...notes]);
    });
  }

  function handleRemoveSaved(messageId: string) {
    startTransition(async () => {
      const result = await toggleSaveMessage(messageId);
      if (!result.ok) {
        setError(result.error ?? t("chatActionError"));
        return;
      }

      onSavedChange(messageId, false);
    });
  }

  function handleDeleteNote(noteId: string) {
    startTransition(async () => {
      const result = await deleteChatNote(noteId);
      if (!result.ok) {
        setError(result.error ?? t("chatActionError"));
        return;
      }

      onNotesChange(notes.filter((note) => note.id !== noteId));
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 pb-[calc(4.75rem+env(safe-area-inset-bottom))]">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          {t("chatSavedMessages")}
        </h2>
        <p className="mt-1 text-xs text-[var(--muted)]">{t("chatSavedHint")}</p>

        {savedMessages.length ? (
          <ul className="mt-4 space-y-3">
            {savedMessages.map((message) => {
              const isMine = message.senderId === userId;

              return (
                <li className="surface-panel rounded-2xl p-3" key={message.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--muted)]">
                        {isMine ? t("commonYou") : partnerName} ·{" "}
                        {formatDateLocalized(locale, message.createdAt.slice(0, 10))}
                      </p>
                      {message.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          className="mb-1 max-h-40 w-full rounded-xl object-cover"
                          src={message.imageUrl}
                        />
                      ) : null}
                      {message.body ? (
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">
                          {message.body}
                        </p>
                      ) : null}
                    </div>
                    <button
                      aria-label={t("chatUnsave")}
                      className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--input-bg)] hover:text-[var(--accent)]"
                      disabled={isPending}
                      onClick={() => handleRemoveSaved(message.id)}
                      type="button"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl surface-panel border-dashed px-4 py-6 text-center text-sm text-[var(--muted)]">
            {t("chatBookmarkHint")}
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          {t("chatMyNotes")}
        </h2>
        <p className="mt-1 text-xs text-[var(--muted)]">{t("chatNotesHint")}</p>

        <form className="mt-4 grid gap-2" onSubmit={handleCreateNote}>
          <textarea
            className="min-h-24 rounded-2xl surface-input px-4 py-3 text-sm"
            disabled={isPending}
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("chatNewNotePlaceholder")}
            value={draft}
          />
          <button
            className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isPending || !draft.trim()}
            type="submit"
          >
            {isPending ? t("commonSaving") : t("chatAddNote")}
          </button>
        </form>

        {notes.length ? (
          <ul className="mt-4 space-y-3">
            {notes.map((note) => (
              <li className="surface-panel rounded-2xl p-3" key={note.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {note.linkedMessage ? (
                      <p className="mb-2 rounded-xl bg-[var(--input-bg)] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
                        {t("chatLinkedMessage")} «
                        {(note.linkedMessage.body ?? t("chatPhotoLabel")).slice(0, 120)}
                        {(note.linkedMessage.body?.length ?? 0) > 120 ? "…" : ""}»
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{note.body}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {formatDateLocalized(locale, note.updatedAt.slice(0, 10))}
                    </p>
                  </div>
                  <button
                    aria-label={t("chatDeleteNote")}
                    className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--input-bg)] hover:text-[var(--accent)]"
                    disabled={isPending}
                    onClick={() => handleDeleteNote(note.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl surface-panel border-dashed px-4 py-6 text-center text-sm text-[var(--muted)]">
            {t("chatNotesEmpty")}
          </p>
        )}
      </section>

      {error ? (
        <p className="alert-error mt-4 rounded-xl px-3 py-2 text-sm">{error}</p>
      ) : null}
    </div>
  );
}
