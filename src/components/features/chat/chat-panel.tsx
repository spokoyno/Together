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
import { Bookmark, BookmarkCheck, ImagePlus, Loader2, Send, Sparkles, StickyNote } from "lucide-react";
import {
  createChatNote,
  loadOlderMessages,
  markChatRead,
  postMessageToMoments,
  sendMessage,
  toggleSaveMessage,
} from "@/lib/chat/actions";
import { mergeMessages, prependMessages, replaceOptimisticMessage } from "@/lib/chat/messages";
import { formatChatDayHeader, formatMessageTime, getChatDayKey } from "@/lib/dates";
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
  const [isPending, startTransition] = useTransition();

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
      setError(result.error ?? "Не удалось загрузить сообщения.");
      return;
    }

    setHasMore(result.hasMore);
    setMessages((current) => prependMessages(current, result.messages));
  }, [hasMore, oldestMessage]);

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
                senderName: row.sender_id === userId ? "Вы" : partnerName,
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
  }, [coupleId, partnerName, userId]);

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
      setError("Не удалось обработать фото.");
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
      setError("Дождитесь загрузки фото.");
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
      senderName: "Вы",
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

  function handlePostToMoments(messageId: string) {
    startTransition(async () => {
      const result = await postMessageToMoments(messageId);
      if (!result.ok) {
        setError(result.error ?? "Не удалось добавить в моменты.");
      }
    });
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
            Листайте вверх для более ранних сообщений
          </p>
        ) : messages.length > 0 ? (
          <p className="mb-3 text-center text-xs text-[var(--muted)]">Начало переписки</p>
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
                  <article className={`message-enter flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[88%]">
                      <div
                        className={`px-3.5 py-2 shadow-sm ${
                          isMine
                            ? `rounded-[18px] rounded-br-[6px] bg-[var(--chat-outgoing)] text-white${isFailed ? " opacity-80" : ""}`
                            : "rounded-[18px] rounded-bl-[6px] bg-[var(--chat-incoming)] text-[var(--foreground)]"
                        }`}
                      >
                        {message.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt=""
                            className="mb-1 max-h-64 w-full rounded-xl object-cover"
                            src={message.imageUrl}
                          />
                        ) : null}
                        {message.body ? (
                          <p className="whitespace-pre-wrap break-words text-[15px] leading-6">
                            {message.body}
                          </p>
                        ) : null}
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 ${
                            isMine ? "text-white/75" : "text-[var(--muted)]"
                          }`}
                        >
                          <button
                            aria-label={isSaved ? "Убрать из сохранённых" : "Сохранить в личное"}
                            className={`grid size-7 place-items-center rounded-full transition-colors ${
                              isMine ? "hover:bg-white/15" : "hover:bg-[var(--input-bg)]"
                            } ${isSaved ? "text-[var(--accent)]" : ""}`}
                            disabled={isPending || isSending || isFailed}
                            onClick={() => handleToggleSave(message)}
                            type="button"
                          >
                            {isSaved ? (
                              <BookmarkCheck aria-hidden className="size-4" />
                            ) : (
                              <Bookmark aria-hidden className="size-4" />
                            )}
                          </button>
                          <button
                            aria-label="Добавить заметку"
                            className={`grid size-7 place-items-center rounded-full transition-colors ${
                              isMine ? "hover:bg-white/15" : "hover:bg-[var(--input-bg)]"
                            } ${isNoteOpen ? "text-[var(--accent)]" : ""}`}
                            disabled={isPending || isSending || isFailed}
                            onClick={() => {
                              setNoteTargetId(isNoteOpen ? null : message.id);
                              setNoteDraft("");
                            }}
                            type="button"
                          >
                            <StickyNote aria-hidden className="size-4" />
                          </button>
                          {message.imagePath && isMine && !isSending && !isFailed ? (
                            <button
                              aria-label="Добавить в моменты"
                              className={`grid size-7 place-items-center rounded-full transition-colors ${
                                isMine ? "hover:bg-white/15" : "hover:bg-[var(--input-bg)]"
                              }`}
                              disabled={isPending}
                              onClick={() => handlePostToMoments(message.id)}
                              type="button"
                            >
                              <Sparkles aria-hidden className="size-4" />
                            </button>
                          ) : null}
                          {isSending ? (
                            <Loader2
                              aria-label="Отправляется"
                              className="size-3.5 animate-spin opacity-80"
                            />
                          ) : isFailed ? (
                            <button
                              className="text-[11px] font-semibold underline"
                              onClick={() => handleRetry(message)}
                              type="button"
                            >
                              Повторить
                            </button>
                          ) : null}
                          <span className="text-[11px]">{formatMessageTime(message.createdAt)}</span>
                        </div>
                      </div>

                      {isNoteOpen ? (
                        <form className="mt-2 grid gap-2" onSubmit={handleCreateNote}>
                          <textarea
                            autoFocus
                            className="min-h-20 rounded-2xl surface-input px-3 py-2 text-sm"
                            disabled={isPending}
                            maxLength={2000}
                            onChange={(event) => setNoteDraft(event.target.value)}
                            placeholder="Ваша личная заметка к этому сообщению..."
                            value={noteDraft}
                          />
                          <div className="flex gap-2">
                            <button
                              className="rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                              disabled={isPending || !noteDraft.trim()}
                              type="submit"
                            >
                              Сохранить заметку
                            </button>
                            <button
                              className="rounded-xl surface-input px-3 py-2 text-xs font-semibold"
                              onClick={() => {
                                setNoteTargetId(null);
                                setNoteDraft("");
                              }}
                              type="button"
                            >
                              Отмена
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
              <p className="text-lg font-semibold">Начните переписку</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Напишите {partnerName} — сообщения приходят мгновенно.
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
                Убрать
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
                aria-label="Прикрепить фото"
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
            placeholder="Сообщение"
            rows={1}
            value={draft}
          />
          <button
            aria-label="Отправить сообщение"
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
    </div>
  );
}
