"use client";

import { CornerUpLeft, Heart, Loader2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { MessageContextMenu } from "@/components/features/chat/message-context-menu";
import { toggleMessageLike } from "@/lib/chat/actions";
import type { ChatMessage } from "@/types/domain";

type ChatMessageRowProps = {
  message: ChatMessage;
  isMine: boolean;
  isSaved: boolean;
  isPending: boolean;
  onReply: (message: ChatMessage) => void;
  onToggleSaveWithNote: (message: ChatMessage) => void;
  onDelete?: () => void;
  onError: (message: string) => void;
  onLikeChange: (messageId: string, liked: boolean, likeCount: number) => void;
  onImageOpen: (url: string) => void;
};

export function ChatMessageRow({
  message,
  isMine,
  isSaved,
  isPending,
  onReply,
  onToggleSaveWithNote,
  onDelete,
  onError,
  onLikeChange,
  onImageOpen,
}: ChatMessageRowProps) {
  const { t } = useLanguage();
  const [dragX, setDragX] = useState(0);
  const [swipeTriggered, setSwipeTriggered] = useState(false);
  const [, startTransition] = useTransition();
  const lastTapRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSending = message.sendStatus === "sending";
  const isFailed = message.sendStatus === "failed";
  const isPendingMessage = message.id.startsWith("pending-");

  function handleDoubleTap() {
    if (isPendingMessage || isSending || isFailed) {
      return;
    }

    startTransition(async () => {
      const result = await toggleMessageLike(message.id);
      if (!result.ok) {
        onError(result.error ?? t("chatActionError"));
        return;
      }
      onLikeChange(message.id, result.liked, result.likeCount);
    });
  }

  function handleBubbleClick() {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      lastTapRef.current = 0;
      handleDoubleTap();
      return;
    }
    lastTapRef.current = now;
  }

  function onTouchStart(event: React.TouchEvent) {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setSwipeTriggered(false);
  }

  function onTouchMove(event: React.TouchEvent) {
    const touch = event.touches[0];
    const start = touchStartRef.current;
    if (!touch || !start) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = Math.abs(touch.clientY - start.y);
    if (deltaY > 28) {
      return;
    }

    const clamped = isMine
      ? Math.max(-72, Math.min(0, deltaX))
      : Math.min(72, Math.max(0, deltaX));
    setDragX(clamped);

    if (Math.abs(clamped) > 52 && !swipeTriggered) {
      setSwipeTriggered(true);
      onReply(message);
    }
  }

  function onTouchEnd() {
    touchStartRef.current = null;
    setDragX(0);
    setSwipeTriggered(false);
  }

  return (
    <article
      className={`message-enter flex items-end gap-1 ${isMine ? "justify-end" : "justify-start"}`}
    >
      {!isMine && !isSending && !isFailed && !isPendingMessage ? (
        <button
          aria-label={t("chatReply")}
          className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--input-bg)] hover:text-[var(--accent)]"
          disabled={isPending}
          onClick={() => onReply(message)}
          type="button"
        >
          <CornerUpLeft aria-hidden className="size-4" />
        </button>
      ) : null}

      {!isSending && !isFailed && !isPendingMessage ? (
        <MessageContextMenu
          disabled={isPending}
          isMine={isMine}
          isSaved={isSaved}
          message={message}
          onDelete={isMine ? onDelete : undefined}
          onError={onError}
          onSaveWithNote={() => onToggleSaveWithNote(message)}
        />
      ) : null}

      <div
        className="max-w-[72%] min-w-0 transition-transform duration-150"
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
        onTouchStart={onTouchStart}
        style={{ transform: `translateX(${dragX}px)` }}
      >
        {message.replyTo ? (
          <div
            className={`mb-1 rounded-xl border-l-2 border-[var(--accent)] bg-[var(--input-bg)] px-3 py-2 text-xs ${
              isMine ? "ml-2" : "mr-2"
            }`}
          >
            <p className="font-medium text-[var(--accent)]">{message.replyTo.senderName}</p>
            <p className="mt-0.5 line-clamp-2 text-[var(--muted)]">
              {message.replyTo.body ?? t("chatPhotoLabel")}
            </p>
          </div>
        ) : null}

        {message.imageUrl ? (
          <button className="block w-full" onClick={() => onImageOpen(message.imageUrl!)} type="button">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className={`max-h-72 w-full object-cover ${
                message.body || message.audioUrl ? "mb-1 rounded-t-2xl" : "rounded-2xl"
              }`}
              src={message.imageUrl}
            />
          </button>
        ) : null}

        {message.audioUrl ? (
          <div
            className={`px-3 py-2 shadow-sm ${
              isMine
                ? "rounded-[18px] rounded-br-[6px] bg-[var(--chat-outgoing)] text-white"
                : "rounded-[18px] rounded-bl-[6px] bg-[var(--chat-incoming)]"
            } ${message.body ? "mb-1" : ""}`}
          >
            <audio className="w-full max-w-[220px]" controls preload="none" src={message.audioUrl}>
              <track kind="captions" />
            </audio>
          </div>
        ) : null}

        {message.body ? (
          <div
            className={`px-3 py-2 shadow-sm ${
              isMine
                ? `rounded-[18px] rounded-br-[6px] bg-[var(--chat-outgoing)] text-white${isFailed ? " opacity-80" : ""}`
                : "rounded-[18px] rounded-bl-[6px] bg-[var(--chat-incoming)] text-[var(--foreground)]"
            } ${message.imageUrl ? "rounded-t-none" : ""}`}
            onClick={handleBubbleClick}
            onKeyDown={() => undefined}
            role="button"
            tabIndex={0}
          >
            <p className="whitespace-pre-wrap break-words text-[15px] leading-6">{message.body}</p>
          </div>
        ) : null}

        {(message.likeCount ?? 0) > 0 ? (
          <div className={`mt-1 flex ${isMine ? "justify-end" : "justify-start"}`}>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--accent)] shadow-sm">
              <Heart
                aria-hidden
                className={`size-3 ${message.likedByMe ? "fill-current" : ""}`}
              />
              {message.likeCount}
            </span>
          </div>
        ) : null}

        {isSending ? (
          <div className={`mt-1 flex ${isMine ? "justify-end" : "justify-start"}`}>
            <Loader2 aria-label={t("chatSending")} className="size-4 animate-spin text-[var(--muted)]" />
          </div>
        ) : null}
      </div>
    </article>
  );
}
