"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/features/chat/chat-panel";
import { ChatPersonalPanel } from "@/components/features/chat/chat-personal-panel";
import type { ChatMessage, ChatNote, ChatSavedMessage } from "@/types/domain";

type ChatTab = "chat" | "personal";

type ChatShellProps = {
  coupleId: string;
  userId: string;
  partnerName: string;
  initialMessages: ChatMessage[];
  initialSavedIds: string[];
  initialSavedMessages: ChatSavedMessage[];
  initialNotes: ChatNote[];
};

export function ChatShell({
  coupleId,
  userId,
  partnerName,
  initialMessages,
  initialSavedIds,
  initialSavedMessages,
  initialNotes,
}: ChatShellProps) {
  const [tab, setTab] = useState<ChatTab>("chat");
  const [savedIds, setSavedIds] = useState(() => new Set(initialSavedIds));
  const [savedMessages, setSavedMessages] = useState(initialSavedMessages);
  const [notes, setNotes] = useState(initialNotes);

  function handleSavedChange(messageId: string, saved: boolean, message?: ChatMessage) {
    setSavedIds((current) => {
      const next = new Set(current);
      if (saved) {
        next.add(messageId);
      } else {
        next.delete(messageId);
      }
      return next;
    });

    if (saved && message) {
      setSavedMessages((current) => {
        if (current.some((item) => item.id === messageId)) {
          return current;
        }
        return [{ ...message, savedAt: new Date().toISOString() }, ...current];
      });
      return;
    }

    setSavedMessages((current) => current.filter((item) => item.id !== messageId));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-[var(--border)] bg-[var(--surface-elevated)] px-4 pb-3">
        <div className="flex gap-1 rounded-full bg-[var(--input-bg)] p-1">
          <button
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
              tab === "chat"
                ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)]"
            }`}
            onClick={() => setTab("chat")}
            type="button"
          >
            Чат
          </button>
          <button
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
              tab === "personal"
                ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)]"
            }`}
            onClick={() => setTab("personal")}
            type="button"
          >
            Личное
          </button>
        </div>
      </div>

      {tab === "chat" ? (
        <ChatPanel
          coupleId={coupleId}
          initialMessages={initialMessages}
          onNoteCreated={(note) => setNotes((current) => [note, ...current])}
          onSavedChange={handleSavedChange}
          partnerName={partnerName}
          savedIds={savedIds}
          userId={userId}
        />
      ) : (
        <ChatPersonalPanel
          notes={notes}
          onNotesChange={setNotes}
          onSavedChange={handleSavedChange}
          partnerName={partnerName}
          savedMessages={savedMessages}
          userId={userId}
        />
      )}
    </div>
  );
}
