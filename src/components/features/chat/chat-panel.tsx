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
import { Bookmark, BookmarkCheck, Loader2, Send, StickyNote } from "lucide-react";
import {
  createChatNote,
  loadOlderMessages,
  markChatRead,
  sendMessage,
  toggleSaveMessage,
} from "@/lib/chat/actions";
import { mergeMessages, prependMessages } from "@/lib/chat/messages";
import { formatChatDayHeader, formatMessageTime, getChatDayKey } from "@/lib/dates";
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

  useEffect(() => {
    void markChatRead();
  }, []);

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
        (payload) => {
          const row = payload.new as {
            id: string;
            couple_id: string;
            sender_id: string;
            body: string;
            created_at: string;
          };

          setMessages((current) =>
            mergeMessages(current, {
              id: row.id,
              coupleId: row.couple_id,
              senderId: row.sender_id,
              senderName: row.sender_id === userId ? "Вы" : partnerName,
              body: row.body,
              createdAt: row.created_at,
            }),
          );

          if (row.sender_id !== userId) {
            void markChatRead();
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, partnerName, userId]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isPending) {
      return;
    }

    setError("");
    setDraft("");
    stickToBottomRef.current = true;

    startTransition(async () => {
      const result = await sendMessage(text);
      if (!result.ok) {
        setError(result.error);
        setDraft(text);
        return;
      }

      setMessages((current) => mergeMessages(current, result.message));
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
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
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
                            ? "rounded-[18px] rounded-br-[6px] bg-[var(--chat-outgoing)] text-white"
                            : "rounded-[18px] rounded-bl-[6px] bg-[var(--chat-incoming)] text-[var(--foreground)]"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-[15px] leading-6">
                          {message.body}
                        </p>
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
                            disabled={isPending}
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
                            disabled={isPending}
                            onClick={() => {
                              setNoteTargetId(isNoteOpen ? null : message.id);
                              setNoteDraft("");
                            }}
                            type="button"
                          >
                            <StickyNote aria-hidden className="size-4" />
                          </button>
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
        className="border-t border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3 pb-[calc(4.75rem+env(safe-area-inset-bottom))]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-end gap-2">
          <textarea
            className="max-h-28 min-h-11 flex-1 resize-none rounded-full surface-input px-4 py-2.5 text-[15px] transition-colors focus:border-[var(--accent)] focus:outline-none"
            disabled={isPending}
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
            className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white transition-transform active:scale-95 disabled:opacity-50"
            disabled={isPending || !draft.trim()}
            type="submit"
          >
            <Send aria-hidden className="size-5" />
          </button>
        </div>
        {error ? (
          <p className="mt-2 alert-error rounded-xl px-3 py-2 text-sm">{error}</p>
        ) : null}
      </form>
    </div>
  );
}
