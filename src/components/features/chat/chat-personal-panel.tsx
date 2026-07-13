"use client";

import { ChevronDown, Images, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { deleteChatNote, toggleSaveMessage } from "@/lib/chat/actions";
import { formatDateLocalized } from "@/lib/dates";
import type { ChatMessage, ChatNote, ChatSavedMessage } from "@/types/domain";

type ChatPersonalPanelProps = {
  userId: string;
  partnerName: string;
  savedMessages: ChatSavedMessage[];
  notes: ChatNote[];
  mediaMessages: ChatMessage[];
  onSavedChange: (messageId: string, saved: boolean) => void;
  onNotesChange: (notes: ChatNote[]) => void;
};

export function ChatPersonalPanel({
  userId,
  partnerName,
  savedMessages,
  notes,
  mediaMessages,
  onSavedChange,
  onNotesChange,
}: ChatPersonalPanelProps) {
  const { locale, t } = useLanguage();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

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
      <section className="rounded-[1.35rem] surface-panel">
        <button
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
          onClick={() => setGalleryOpen((current) => !current)}
          type="button"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Images aria-hidden className="size-4 text-[var(--accent)]" />
            {t("chatMediaGallery")}
          </span>
          <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
            {mediaMessages.length}
            <ChevronDown
              aria-hidden
              className={`size-4 transition-transform ${galleryOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {galleryOpen ? (
          <div className="border-t border-[var(--border)] px-3 pb-3 pt-2">
            {mediaMessages.length ? (
              <div className="grid grid-cols-3 gap-2">
                {mediaMessages.map((message) =>
                  message.imageUrl ? (
                    <button
                      className="aspect-square overflow-hidden rounded-xl bg-[var(--input-bg)]"
                      key={message.id}
                      onClick={() => setFullscreenImage(message.imageUrl!)}
                      type="button"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="" className="size-full object-cover" src={message.imageUrl} />
                    </button>
                  ) : null,
                )}
              </div>
            ) : (
              <p className="px-1 py-4 text-center text-sm text-[var(--muted)]">{t("chatMediaEmpty")}</p>
            )}
          </div>
        ) : null}
      </section>

      <section className="mt-6">
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
        <p className="mt-1 text-xs text-[var(--muted)]">{t("chatNotesFromSaved")}</p>

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

      {error ? <p className="alert-error mt-4 rounded-xl px-3 py-2 text-sm">{error}</p> : null}

      {fullscreenImage ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="m-auto max-h-full max-w-full object-contain" src={fullscreenImage} />
        </div>
      ) : null}
    </div>
  );
}
