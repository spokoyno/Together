"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { sendMessage } from "@/lib/chat/actions";
import { formatMessageTime } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/types/domain";
import { EmptyState } from "@/components/ui/empty-state";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pb-4" ref={scrollRef}>
        {messages.length ? (
          messages.map((message) => {
            const isMine = message.senderId === userId;

            return (
              <article
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                key={message.id}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 ${
                    isMine
                      ? "rounded-br-md bg-[var(--accent)] text-white"
                      : "rounded-bl-md border border-[var(--border)] bg-white"
                  }`}
                >
                  {!isMine ? (
                    <p className="mb-1 text-xs font-semibold text-[var(--accent)]">
                      {message.senderName}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
                  <p
                    className={`mt-2 text-[11px] ${
                      isMine ? "text-white/70" : "text-[var(--muted)]"
                    }`}
                  >
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState
            description={`Напишите первое сообщение для ${partnerName}.`}
            title="Пока тихо"
          />
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="sticky bottom-24 grid gap-2 rounded-3xl border border-[var(--border)] bg-white p-3 shadow-lg"
        onSubmit={handleSubmit}
      >
        <div className="flex items-end gap-2">
          <textarea
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-[var(--border)] px-4 py-3 text-sm"
            disabled={isPending}
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Сообщение..."
            rows={1}
            value={draft}
          />
          <button
            aria-label="Отправить сообщение"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white disabled:opacity-60"
            disabled={isPending || !draft.trim()}
            type="submit"
          >
            ↑
          </button>
        </div>
        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
