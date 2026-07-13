"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { MessageContextMenu } from "@/components/features/chat/message-context-menu";
import {
  createChatNote,
  deleteMessage,
  loadOlderMessages,
  markChatRead,
  sendMessage,
  toggleSaveMessage,
} from "@/lib/chat/actions";
import { mergeMessages, prependMessages, replaceOptimisticMessage } from "@/lib/chat/messages";
import { formatChatDayHeader, getChatDayKey } from "@/lib/dates";
import { compressImageFile } from "@/lib/media/compress-image.client";
import { signMediaPath } from "@/lib/media/actions";
import { uploadCoupleMediaClient } from "@/lib/media/upload.client";
import { PhotoSourcePicker } from "@/components/ui/photo-source-picker";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, ChatNote } from "@/types/domain";

type ChatPanelProps = {
  coupleId: string;
  userId: string;
  partnerName: string;
  initialMessages: ChatMessage[];
  initialHasMore: boolean;
  savedIds: Set<string>;
  onSavedChange: (messageId: string, saved: boolean, message?: ChatMessage) => void;
  onNoteCreated: (note: ChatNote) => void;
};

type ScrollAnchor = {
  scrollTop: number;
  scrollHeight: number;
};

export function ChatPanel({
  coupleId,
  userId,
  partnerName,
  initialMessages,
  initialHasMore,
  savedIds,
  onSavedChange,
  onNoteCreated,
}: ChatPanelProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingImagePath, setPendingImagePath] = useState<string | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [noteTargetId, setNoteTargetId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<ScrollAnchor | null>(null);
  const stickToBottomRef = useRef(true);
  const hasInitialScrolledRef = useRef(false);
  const prevLastMessageIdRef = useRef<string | undefined>(initialMessages.at(-1)?.id);
  const loadingOlderRef = useRef(false);

  const oldestMessage = messages[0];
  const lastMessageId = messages.at(-1)?.id;

  useLayoutEffect(() => {
    if (hasInitialScrolledRef.current) {
      return;
    }

    hasInitialScrolledRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, []);

  useLayoutEffect(() => {
    const anchor = scrollAnchorRef.current;
    const container = scrollRef.current;

    if (anchor && container) {
      scrollAnchorRef.current = null;
      container.scrollTop = anchor.scrollTop + (container.scrollHeight - anchor.scrollHeight);
      return;
    }

    const previousLastId = prevLastMessageIdRef.current;
    prevLastMessageIdRef.current = lastMessageId;

    if (!lastMessageId || lastMessageId === previousLastId) {
      return;
    }

    if (stickToBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lastMessageId, messages.length]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    stickToBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < 96;
  }, []);

  const fetchOlderMessages = useCallback(async () => {
    if (!oldestMessage || loadingOlderRef.current || !hasMore) {
      return;
    }

    const container = scrollRef.current;
    if (container) {
      scrollAnchorRef.current = {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
      };
    }

    loadingOlderRef.current = true;
    setIsLoadingOlder(true);
    setError("");

    const result = await loadOlderMessages(oldestMessage.createdAt, oldestMessage.id);

    loadingOlderRef.current = false;
    setIsLoadingOlder(false);

    if (!result.ok) {
      scrollAnchorRef.current = null;
      setError(result.error ?? t("chatErrorLoad"));
      return;
    }

    setHasMore(result.hasMore);
    setMessages((current) => prependMessages(current, result.messages));
  }, [hasMore, oldestMessage, t]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = topSentinelRef.current;

    if (!root || !sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchOlderMessages();
        }
      },
      {
        root,
        rootMargin: "120px 0px 0px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [fetchOlderMessages, hasMore]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as {
            id: string;
            couple_id: string;
            sender_id: string;
            body: string | null;
            image_path: string | null;
            created_at: string;
          };

          void (async () => {
            const imageUrl = row.image_path ? await signMediaPath(row.image_path) : null;

            setMessages((current) => {
              const incoming: ChatMessage = {
                id: row.id,
                coupleId: row.couple_id,
                senderId: row.sender_id,
                senderName: row.sender_id === userId ? t("commonYou") : partnerName,
                body: row.body,
                imagePath: row.image_path,
                imageUrl,
                createdAt: row.created_at,
              };

              if (row.sender_id === userId) {
                const pending = current.find(
                  (message) =>
                    message.sendStatus === "sending" &&
                    message.senderId === userId &&
                    (message.body ?? "") === (row.body ?? "") &&
                    (message.imagePath ?? null) === (row.image_path ?? null),
                );
                if (pending?.imageUrl?.startsWith("blob:")) {
                  URL.revokeObjectURL(pending.imageUrl);
                }
              }

              return mergeMessages(current, incoming);
            });

            if (row.sender_id !== userId) {
              void markChatRead();
            }
          })();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, partnerName, userId, t]);

  function clearPendingImage() {
    setPendingImagePath(null);
    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview);
    }
    setPendingImagePreview(null);
  }

  async function handleImagePick(file: File) {
    setError("");
    setIsUploading(true);

    let preview: string | null = null;

    try {
      const prepared = await compressImageFile(file);
      preview = URL.createObjectURL(prepared);
      setPendingImagePreview(preview);

      const result = await uploadCoupleMediaClient(coupleId, userId, prepared);

      if (!result.ok) {
        setError(result.error);
        clearPendingImage();
        return;
      }

      setPendingImagePath(result.path);
    } catch {
      setError(t("chatErrorPhoto"));
      clearPendingImage();
    } finally {
      setIsUploading(false);
    }
  }

  function detachPendingImage() {
    setPendingImagePath(null);
    setPendingImagePreview(null);
  }

  async function deliverMessage(
    clientId: string,
    text: string,
    imagePath: string | null,
  ) {
    const result = await sendMessage(text, imagePath);

    if (!result.ok) {
      setMessages((current) => replaceOptimisticMessage(current, clientId, { sendStatus: "failed" }));
      setError(result.error);
      return;
    }

    setMessages((current) => {
      const optimistic = current.find((message) => message.clientId === clientId);
      if (optimistic?.imageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(optimistic.imageUrl);
      }
      return replaceOptimisticMessage(current, clientId, result.message);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if ((!text && !pendingImagePath && !pendingImagePreview) || isUploading) {
      return;
    }

    if (!pendingImagePath && pendingImagePreview) {
      setError(t("chatErrorWaitPhoto"));
      return;
    }

    setError("");
    const imagePath = pendingImagePath;
    const imagePreview = pendingImagePreview;
    const clientId = crypto.randomUUID();
    const now = new Date().toISOString();

    const optimistic: ChatMessage = {
      id: `pending-${clientId}`,
      clientId,
      coupleId,
      senderId: userId,
      senderName: t("commonYou"),
      body: text || null,
      imagePath,
      imageUrl: imagePreview,
      createdAt: now,
      sendStatus: "sending",
    };

    setMessages((current) => mergeMessages(current, optimistic));
    setDraft("");
    detachPendingImage();
    stickToBottomRef.current = true;

    void deliverMessage(clientId, text, imagePath);
  }

  function handleRetry(message: ChatMessage) {
    if (!message.clientId || message.sendStatus !== "failed") {
      return;
    }

    setError("");
    setMessages((current) =>
      current.map((item) =>
        item.clientId === message.clientId ? { ...item, sendStatus: "sending" as const } : item,
      ),
    );

    void deliverMessage(message.clientId, message.body ?? "", message.imagePath);
  }

  function handleToggleSave(message: ChatMessage) {
    startTransition(async () => {
      const result = await toggleSaveMessage(message.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      onSavedChange(message.id, result.saved, message);
    });
  }

  function handleCreateNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = noteDraft.trim();
    if (!text || !noteTargetId || isPending) {
      return;
    }

    const targetId = noteTargetId;
    const targetMessage = messages.find((message) => message.id === targetId) ?? null;

    setError("");
    startTransition(async () => {
      const result = await createChatNote(text, targetId);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      onNoteCreated({
        ...result.note,
        linkedMessage: targetMessage,
      });
      setNoteDraft("");
      setNoteTargetId(null);
    });
  }

  function handleDeleteMessage(message: ChatMessage) {
    if (!message.id.startsWith("pending-")) {
      startTransition(async () => {
        const result = await deleteMessage(message.id);
        if (!result.ok) {
          setError(result.error ?? t("chatErrorDelete"));
          return;
        }
        setMessages((current) => current.filter((item) => item.id !== message.id));
      });
    }
  }

  const renderedMessages = useMemo(
    () =>
      messages.map((message, index) => {
        const dayKey = getChatDayKey(message.createdAt);
        const previousDayKey =
          index > 0 ? getChatDayKey(messages[index - 1]!.createdAt) : "";
        return {
          message,
          showDay: dayKey !== previousDayKey,
        };
      }),
    [messages],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4 pb-[calc(7.5rem+max(0.75rem,env(safe-area-inset-bottom))+5.25rem)]"
        onScroll={handleScroll}
        ref={scrollRef}
      >
        <div ref={topSentinelRef} className="h-px w-full" />

        {isLoadingOlder ? (
          <div className="mb-3 flex justify-center">
            <Loader2
              aria-hidden
              className="size-5 animate-spin text-[var(--muted)]"
            />
          </div>
        ) : hasMore ? (
          <p className="mb-3 text-center text-xs text-[var(--muted)]">
            {t("chatScrollUp")}
          </p>
        ) : messages.length > 0 ? (
          <p className="mb-3 text-center text-xs text-[var(--muted)]">{t("chatConversationStart")}</p>
        ) : null}

        {messages.length ? (
          <div className="space-y-2">
            {renderedMessages.map(({ message, showDay }) => {
              const isMine = message.senderId === userId;
              const isSaved = savedIds.has(message.id);
              const isNoteOpen = noteTargetId === message.id;
              const isSending = message.sendStatus === "sending";
              const isFailed = message.sendStatus === "failed";

              return (
                <div key={message.id}>
                  {showDay ? (
                    <p className="my-4 text-center text-xs font-medium text-[var(--muted)]">
                      {formatChatDayHeader(message.createdAt)}
                    </p>
                  ) : null}
                  <article
                    className={`message-enter flex items-end gap-1 ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    {!isSending && !isFailed && !message.id.startsWith("pending-") ? (
                      <MessageContextMenu
                        disabled={isPending}
                        isMine={isMine}
                        isSaved={isSaved}
                        message={message}
                        onDelete={
                          isMine ? () => handleDeleteMessage(message) : undefined
                        }
                        onError={setError}
                        onOpenNote={() => {
                          setNoteTargetId(isNoteOpen ? null : message.id);
                          setNoteDraft("");
                        }}
                        onToggleSave={() => handleToggleSave(message)}
                      />
                    ) : null}

                    <div className="max-w-[72%] min-w-0">
                      {message.imageUrl ? (
                        <button
                          className="block w-full"
                          onClick={() => setFullscreenImage(message.imageUrl)}
                          type="button"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt=""
                            className={`max-h-72 w-full object-cover ${
                              message.body ? "mb-1 rounded-t-2xl" : "rounded-2xl"
                            }`}
                            src={message.imageUrl}
                          />
                        </button>
                      ) : null}

                      {message.body ? (
                        <div
                          className={`px-3 py-2 shadow-sm ${
                            isMine
                              ? `rounded-[18px] rounded-br-[6px] bg-[var(--chat-outgoing)] text-white${isFailed ? " opacity-80" : ""}`
                              : "rounded-[18px] rounded-bl-[6px] bg-[var(--chat-incoming)] text-[var(--foreground)]"
                          } ${message.imageUrl ? "rounded-t-none" : ""}`}
                        >
                          <p className="whitespace-pre-wrap break-words text-[15px] leading-6">
                            {message.body}
                          </p>
                        </div>
                      ) : null}

                      {isSending ? (
                        <div className={`mt-1 flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <Loader2
                            aria-label={t("chatSending")}
                            className="size-4 animate-spin text-[var(--muted)]"
                          />
                        </div>
                      ) : isFailed ? (
                        <div className={`mt-1 flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <button
                            className="text-xs font-semibold text-[var(--accent)] underline"
                            onClick={() => handleRetry(message)}
                            type="button"
                          >
                            {t("chatRetry")}
                          </button>
                        </div>
                      ) : null}

                      {isNoteOpen ? (
                        <form className="mt-2 grid gap-2" onSubmit={handleCreateNote}>
                          <textarea
                            autoFocus
                            className="min-h-20 rounded-2xl surface-input px-3 py-2 text-sm"
                            disabled={isPending}
                            maxLength={2000}
                            onChange={(event) => setNoteDraft(event.target.value)}
                            placeholder={t("chatNotePlaceholder")}
                            value={noteDraft}
                          />
                          <div className="flex gap-2">
                            <button
                              className="rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                              disabled={isPending || !noteDraft.trim()}
                              type="submit"
                            >
                              {t("chatSaveNote")}
                            </button>
                            <button
                              className="rounded-xl surface-input px-3 py-2 text-xs font-semibold"
                              onClick={() => {
                                setNoteTargetId(null);
                                setNoteDraft("");
                              }}
                              type="button"
                            >
                              {t("commonCancel")}
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid h-full place-items-center px-6 text-center">
            <div>
              <p className="text-lg font-semibold">{t("chatStartTitle")}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {t("chatStartHint", { name: partnerName })}
              </p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 px-1"
        onSubmit={handleSubmit}
      >
        {pendingImagePreview ? (
          <div className="mb-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="size-16 rounded-2xl object-cover shadow-md"
              src={pendingImagePreview}
            />
            {isUploading ? (
              <Loader2 aria-hidden className="size-5 animate-spin text-[var(--muted)]" />
            ) : (
              <button
                className="rounded-full surface-input px-3 py-1 text-xs font-semibold"
                onClick={clearPendingImage}
                type="button"
              >
                {t("chatRemove")}
              </button>
            )}
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <PhotoSourcePicker
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={isPending || isUploading}
            onSelect={(file) => void handleImagePick(file)}
            renderTrigger={({ open, disabled }) => (
              <button
                aria-label={t("chatAttachPhoto")}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--surface)] text-[var(--muted)] shadow-md transition-transform active:scale-95 disabled:opacity-50"
                disabled={disabled}
                onClick={open}
                type="button"
              >
                <ImagePlus aria-hidden className="size-5" />
              </button>
            )}
          />
          <textarea
            className="max-h-28 min-h-11 flex-1 resize-none rounded-[22px] bg-[var(--surface)] px-4 py-2.5 text-[15px] shadow-md transition-colors focus:border-[var(--accent)] focus:outline-none"
            disabled={isUploading}
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={t("chatPlaceholder")}
            rows={1}
            value={draft}
          />
          <button
            aria-label={t("chatSend")}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
            disabled={isUploading || (!draft.trim() && !pendingImagePath)}
            type="submit"
          >
            <Send aria-hidden className="size-5" />
          </button>
        </div>
        {error ? (
          <p className="mt-2 alert-error rounded-xl px-3 py-2 text-sm shadow-md">{error}</p>
        ) : null}
      </form>

      {fullscreenImage ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          <button
            aria-label={t("commonClose")}
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 grid size-10 place-items-center rounded-full bg-white/15 text-white"
            onClick={() => setFullscreenImage(null)}
            type="button"
          >
            <X aria-hidden className="size-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="m-auto max-h-full max-w-full object-contain" src={fullscreenImage} />
        </div>
      ) : null}
    </div>
  );
}
