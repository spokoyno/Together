"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { markChatRead, sendMessage } from "@/lib/chat/actions";
import { formatChatDayHeader, formatMessageTime, getChatDayKey } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/types/domain";

type ChatPanelProps = {
  coupleId: string;
  userId: string;
  partnerName: string;
  initialMessages: ChatMessage[];
};

function mergeMessages(current: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  if (current.some((message) => message.id === incoming.id)) {
    return current;
  }

  return [...current, incoming].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function ChatPanel({
  coupleId,
  userId,
  partnerName,
  initialMessages,
}: ChatPanelProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void markChatRead();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {messages.length ? (
          <div className="space-y-2">
            {renderedMessages.map(({ message, showDay }) => {
              const isMine = message.senderId === userId;

              return (
                <div key={message.id}>
                  {showDay ? (
                    <p className="my-4 text-center text-xs font-medium text-[var(--muted)]">
                      {formatChatDayHeader(message.createdAt)}
                    </p>
                  ) : null}
                  <article className={`message-enter flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[82%] px-3.5 py-2 shadow-sm ${
                        isMine
                          ? "rounded-[18px] rounded-br-[6px] bg-[var(--chat-outgoing)] text-white"
                          : "rounded-[18px] rounded-bl-[6px] bg-[var(--chat-incoming)] text-[var(--foreground)]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-[15px] leading-6">
                        {message.body}
                      </p>
                      <p
                        className={`mt-1 text-right text-[11px] ${
                          isMine ? "text-white/75" : "text-[var(--muted)]"
                        }`}
                      >
                        {formatMessageTime(message.createdAt)}
                      </p>
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
          <p className="mt-2 alert-error rounded-xl px-3 py-2 text-sm">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
