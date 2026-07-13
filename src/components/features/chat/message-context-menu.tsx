"use client";

import { Bookmark, BookmarkCheck, ChefHat, Clapperboard, ListTodo, MoreVertical, Sparkles, StickyNote, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import {
  addMessageToCooking,
  addMessageToMemories,
  addMessageToPlan,
  addMessageToWatchlist,
} from "@/lib/chat/message-hub-actions";
import type { ChatMessage } from "@/types/domain";

type MessageContextMenuProps = {
  message: ChatMessage;
  isMine: boolean;
  isSaved: boolean;
  disabled?: boolean;
  onToggleSave: () => void;
  onOpenNote: () => void;
  onError: (message: string) => void;
  onDelete?: () => void;
};

export function MessageContextMenu({
  message,
  isMine,
  isSaved,
  disabled,
  onToggleSave,
  onOpenNote,
  onError,
  onDelete,
}: MessageContextMenuProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [planDate, setPlanDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function runAction(action: () => Promise<{ ok: false; error: string } | { ok: true }>) {
    setOpen(false);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        onError("error" in result ? (result.error ?? t("chatActionError")) : t("chatActionError"));
      }
    });
  }

  const menuItems = [
    {
      id: "plan",
      label: t("chatToPlans"),
      icon: ListTodo,
      onClick: () => {
        setOpen(false);
        setPlanOpen(true);
      },
    },
    {
      id: "memory",
      label: t("chatToMemories"),
      icon: Sparkles,
      onClick: () => runAction(() => addMessageToMemories(message.id)),
    },
    {
      id: "watch",
      label: t("chatToWatch"),
      icon: Clapperboard,
      onClick: () => runAction(() => addMessageToWatchlist(message.id)),
    },
    {
      id: "cook",
      label: t("chatToCook"),
      icon: ChefHat,
      onClick: () => runAction(() => addMessageToCooking(message.id)),
    },
    {
      id: "save",
      label: isSaved ? t("chatUnsave") : t("chatSaveMessage"),
      icon: isSaved ? BookmarkCheck : Bookmark,
      onClick: () => {
        setOpen(false);
        onToggleSave();
      },
    },
    {
      id: "note",
      label: t("chatNoteAction"),
      icon: StickyNote,
      onClick: () => {
        setOpen(false);
        onOpenNote();
      },
    },
    ...(isMine && onDelete
      ? [
          {
            id: "delete",
            label: t("chatDelete"),
            icon: Trash2,
            onClick: () => {
              setOpen(false);
              onDelete();
            },
          } as const,
        ]
      : []),
  ] as const;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={t("chatMessageActions")}
          className={`grid size-8 place-items-center rounded-full transition-colors ${
            isMine ? "hover:bg-white/15" : "hover:bg-[var(--input-bg)]"
          }`}
          disabled={disabled || isPending}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <MoreVertical aria-hidden className="size-4" />
        </button>

        {open ? (
          <div
            className={`absolute bottom-full z-20 mb-1 min-w-44 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg ${
              isMine ? "right-0" : "left-0"
            }`}
            role="menu"
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-[var(--input-bg)]"
                  key={item.id}
                  onClick={item.onClick}
                  role="menuitem"
                  type="button"
                >
                  <Icon aria-hidden className="size-4 shrink-0 text-[var(--muted)]" />
                  {item.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {planOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form
            className="w-full max-w-md rounded-3xl surface-panel p-5 shadow-xl"
            onSubmit={(event) => {
              event.preventDefault();
              if (!planDate) {
                onError(t("chatSelectDate"));
                return;
              }
              runAction(() => addMessageToPlan(message.id, `${planDate}T12:00`));
              setPlanOpen(false);
              setPlanDate("");
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">{t("chatAddToPlans")}</p>
              <button
                aria-label={t("commonClose")}
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={() => setPlanOpen(false)}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-[var(--muted)]">{t("chatWhenPlan")}</p>
            <input
              className="w-full rounded-2xl surface-input px-4 py-3"
              onChange={(event) => setPlanDate(event.target.value)}
              required
              type="date"
              value={planDate}
            />
            <button
              className="mt-4 w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? t("chatScheduling") : t("chatSchedule")}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
