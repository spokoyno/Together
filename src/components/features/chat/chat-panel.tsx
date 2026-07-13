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
import { ChatMessageRow } from "@/components/features/chat/chat-message-row";
import { VoiceRecordButton } from "@/components/features/chat/voice-record-button";
import {
  deleteMessage,
  loadOlderMessages,
  markChatRead,
  saveMessageWithNote,
  sendMessage,
} from "@/lib/chat/actions";
import {
  mergeMessages,
  prependMessages,
  replaceOptimisticMessage,
  updateMessageLike,
} from "@/lib/chat/messages";
import { useChatTyping } from "@/lib/chat/typing.client";
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
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [pendingImagePath, setPendingImagePath] = useState<string | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [saveNoteTarget, setSaveNoteTarget] = useState<ChatMessage | null>(null);
  const [saveNoteDraft, setSaveNoteDraft] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();
  const { partnerTyping, broadcastTyping } = useChatTyping(coupleId, userId);

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
  const canSend = Boolean(draft.trim() || pendingImagePath);

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
      { root, rootMargin: "120px 0px 0px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
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
            audio_path: string | null;
            reply_to_id: string | null;
            created_at: string;
          };

          void (async () => {
            const [imageUrl, audioUrl] = await Promise.all([
              row.image_path ? signMediaPath(row.image_path) : Promise.resolve(null),
              row.audio_path ? signMediaPath(row.audio_path) : Promise.resolve(null),
            ]);

            setMessages((current) => {
              const incoming: ChatMessage = {
                id: row.id,
                coupleId: row.couple_id,
                senderId: row.sender_id,
                senderName: row.sender_id === userId ? t("commonYou") : partnerName,
                body: row.body,
                imagePath: row.image_path,
                imageUrl,
                audioPath: row.audio_path,
                audioUrl,
                replyToId: row.reply_to_id,
                createdAt: row.created_at,
                likeCount: 0,
                likedByMe: false,
              };

              if (row.sender_id === userId) {
                const pending = current.find(
                  (message) =>
                    message.sendStatus === "sending" &&
                    message.senderId === userId &&
                    (message.body ?? "") === (row.body ?? "") &&
                    (message.imagePath ?? null) === (row.image_path ?? null) &&
                    (message.audioPath ?? null) === (row.audio_path ?? null),
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

    try {
      const prepared = await compressImageFile(file);
      const preview = URL.createObjectURL(prepared);
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
    audioPath: string | null,
    replyToId: string | null,
  ) {
    const result = await sendMessage(text, {
      imagePath,
      audioPath,
      replyToId,
    });

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

  function pushOptimisticMessage(
    text: string,
    imagePath: string | null,
    imagePreview: string | null,
    audioPath: string | null,
    audioPreview: string | null,
    replyToMessage: ChatMessage | null,
  ) {
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
      audioPath,
      audioUrl: audioPreview,
      replyToId: replyToMessage?.id ?? null,
      replyTo: replyToMessage
        ? {
            id: replyToMessage.id,
            body: replyToMessage.body,
            imagePath: replyToMessage.imagePath,
            senderName: replyToMessage.senderName,
          }
        : null,
      createdAt: now,
      sendStatus: "sending",
      likeCount: 0,
      likedByMe: false,
    };

    setMessages((current) => mergeMessages(current, optimistic));
    stickToBottomRef.current = true;
    void deliverMessage(clientId, text, imagePath, audioPath, replyToMessage?.id ?? null);
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
    const currentReply = replyTo;

    setDraft("");
    setReplyTo(null);
    detachPendingImage();

    pushOptimisticMessage(text, imagePath, imagePreview, null, null, currentReply);
  }

  async function handleVoiceRecorded(file: File) {
    setError("");
    setIsUploading(true);

    try {
      const result = await uploadCoupleMediaClient(coupleId, userId, file);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const preview = URL.createObjectURL(file);
      const currentReply = replyTo;
      setReplyTo(null);
      pushOptimisticMessage("", null, null, result.path, preview, currentReply);
    } catch {
      setError(t("chatVoiceUploadError"));
    } finally {
      setIsUploading(false);
    }
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

    void deliverMessage(
      message.clientId,
      message.body ?? "",
      message.imagePath ?? null,
      message.audioPath ?? null,
      message.replyToId ?? null,
    );
  }

  function handleSaveWithNote(message: ChatMessage) {
    setSaveNoteTarget(message);
    setSaveNoteDraft("");
  }

  function submitSaveWithNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = saveNoteDraft.trim();
    if (!text || !saveNoteTarget) {
      return;
    }

    const target = saveNoteTarget;
    setError("");
    startTransition(async () => {
      const result = await saveMessageWithNote(target.id, text);
      if (!result.ok) {
        setError(result.error ?? t("chatActionError"));
        return;
      }

      onSavedChange(target.id, true, target);
      onNoteCreated({ ...result.note, linkedMessage: target });
      setSaveNoteTarget(null);
      setSaveNoteDraft("");
    });
  }

  function handleDeleteMessage(message: ChatMessage) {
    startTransition(async () => {
      const result = await deleteMessage(message.id);
      if (!result.ok) {
        setError(result.error ?? t("chatErrorDelete"));
        return;
      }
      setMessages((current) => current.filter((item) => item.id !== message.id));
    });
  }

  function handleLikeChange(messageId: string, liked: boolean, likeCount: number) {
    setMessages((current) => updateMessageLike(current, messageId, liked, likeCount));
  }

  const renderedMessages = useMemo(
    () =>
      messages.map((message, index) => {
        const dayKey = getChatDayKey(message.createdAt);
        const previousDayKey = index > 0 ? getChatDayKey(messages[index - 1]!.createdAt) : "";
        return { message, showDay: dayKey !== previousDayKey };
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
            <Loader2 aria-hidden className="size-5 animate-spin text-[var(--muted)]" />
          </div>
        ) : hasMore ? (
          <p className="mb-3 text-center text-xs text-[var(--muted)]">{t("chatScrollUp")}</p>
        ) : messages.length > 0 ? (
          <p className="mb-3 text-center text-xs text-[var(--muted)]">{t("chatConversationStart")}</p>
        ) : null}

        {messages.length ? (
          <div className="space-y-2">
            {renderedMessages.map(({ message, showDay }) => (
              <div key={message.id}>
                {showDay ? (
                  <p className="my-4 text-center text-xs font-medium text-[var(--muted)]">
                    {formatChatDayHeader(message.createdAt)}
                  </p>
                ) : null}
                <ChatMessageRow
                  isMine={message.senderId === userId}
                  isPending={isPending}
                  isSaved={savedIds.has(message.id)}
                  message={message}
                  onDelete={() => handleDeleteMessage(message)}
                  onError={setError}
                  onImageOpen={setFullscreenImage}
                  onLikeChange={handleLikeChange}
                  onReply={setReplyTo}
                  onToggleSaveWithNote={handleSaveWithNote}
                />
                {message.sendStatus === "failed" ? (
                  <div className={`mt-1 flex ${message.senderId === userId ? "justify-end" : "justify-start"}`}>
                    <button
                      className="text-xs font-semibold text-[var(--accent)] underline"
                      onClick={() => handleRetry(message)}
                      type="button"
                    >
                      {t("chatRetry")}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
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

      {partnerTyping ? (
        <div className="px-4 pb-1">
          <p className="chat-typing-indicator text-xs text-[var(--muted)]">
            {t("chatTyping", { name: partnerName })}
          </p>
        </div>
      ) : null}

      <form
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 px-1"
        onSubmit={handleSubmit}
      >
        {replyTo ? (
          <div className="mb-2 flex items-center gap-2 rounded-2xl surface-panel px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--accent)]">
                {t("chatReplyTo", { name: replyTo.senderName })}
              </p>
              <p className="truncate text-xs text-[var(--muted)]">
                {replyTo.body ?? t("chatPhotoLabel")}
              </p>
            </div>
            <button
              aria-label={t("commonClose")}
              className="grid size-8 place-items-center rounded-full surface-input"
              onClick={() => setReplyTo(null)}
              type="button"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ) : null}

        {pendingImagePreview ? (
          <div className="mb-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="size-16 rounded-2xl object-cover shadow-md" src={pendingImagePreview} />
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
            onChange={(event) => {
              setDraft(event.target.value);
              if (event.target.value.trim()) {
                broadcastTyping();
              }
            }}
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
          {canSend ? (
            <button
              aria-label={t("chatSend")}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
              disabled={isUploading}
              type="submit"
            >
              <Send aria-hidden className="size-5" />
            </button>
          ) : (
            <VoiceRecordButton
              disabled={isPending || isUploading}
              onError={setError}
              onRecorded={(file) => void handleVoiceRecorded(file)}
            />
          )}
        </div>
        {error ? (
          <p className="mt-2 alert-error rounded-xl px-3 py-2 text-sm shadow-md">{error}</p>
        ) : null}
      </form>

      {saveNoteTarget ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form
            className="w-full max-w-md rounded-3xl surface-panel p-5 shadow-xl"
            onSubmit={submitSaveWithNote}
          >
            <p className="text-lg font-semibold">{t("chatSaveWithNote")}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{t("chatSaveWithNoteHint")}</p>
            <textarea
              autoFocus
              className="mt-4 min-h-24 w-full rounded-2xl surface-input px-4 py-3 text-sm"
              disabled={isPending}
              maxLength={2000}
              onChange={(event) => setSaveNoteDraft(event.target.value)}
              placeholder={t("chatNotePlaceholder")}
              value={saveNoteDraft}
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="rounded-2xl surface-input py-3 font-semibold"
                onClick={() => setSaveNoteTarget(null)}
                type="button"
              >
                {t("commonCancel")}
              </button>
              <button
                className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending || !saveNoteDraft.trim()}
                type="submit"
              >
                {t("commonSave")}
              </button>
            </div>
          </form>
        </div>
      ) : null}

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
