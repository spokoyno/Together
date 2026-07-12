"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  Image,
  ListTodo,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { markChatRead } from "@/lib/chat/actions";
import { setAppBadgeCount } from "@/lib/pwa/app-badge";
import { createClient } from "@/lib/supabase/client";

type BottomNavProps = {
  coupleId: string | null;
  userId: string;
  initialUnread: number;
};

const navLinks = [
  { href: "/dashboard", label: "Главная", icon: Home },
  { href: "/plans", label: "Планы", icon: ListTodo },
  { href: "/memories", label: "Моменты", icon: Image },
  { href: "/profile", label: "Профиль", icon: UserRound },
] as const;

export function BottomNav({ coupleId, userId, initialUnread }: BottomNavProps) {
  const pathname = usePathname();
  const isChatActive = pathname === "/chat";
  const [liveUnread, setLiveUnread] = useState(0);
  const visibleUnread = isChatActive ? 0 : initialUnread + liveUnread;

  useEffect(() => {
    if (isChatActive) {
      void markChatRead();
    }
  }, [isChatActive]);

  useEffect(() => {
    setAppBadgeCount(visibleUnread);
  }, [visibleUnread]);

  useEffect(() => {
    if (!coupleId) {
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel(`nav-unread:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          const row = payload.new as { sender_id: string };
          if (row.sender_id === userId || pathname === "/chat") {
            return;
          }

          setLiveUnread((current) => current + 1);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, pathname, userId]);

  return (
    <nav className="nav-shell fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-end justify-between rounded-[28px] px-2 py-2 shadow-lg">
      {navLinks.slice(0, 2).map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;

        return (
          <Link
            aria-label={link.label}
            className={`grid min-h-12 min-w-12 flex-1 place-items-center rounded-2xl transition-colors ${
              active ? "text-[var(--accent)]" : "text-[var(--muted)]"
            }`}
            href={link.href}
            key={link.href}
          >
            <Icon aria-hidden className="size-6" strokeWidth={active ? 2.4 : 2} />
          </Link>
        );
      })}

      <Link
        aria-label="Чат"
        className={`relative grid size-14 -translate-y-4 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg transition-transform active:scale-95 ${
          isChatActive ? "ring-4 ring-[var(--accent-soft)]" : ""
        }`}
        href="/chat"
      >
        <MessageCircle aria-hidden className="size-7" strokeWidth={2.2} />
        {visibleUnread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-white px-1.5 py-0.5 text-[11px] font-bold leading-none text-[var(--accent)]">
            {visibleUnread > 99 ? "99+" : visibleUnread}
          </span>
        ) : null}
      </Link>

      {navLinks.slice(2).map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;

        return (
          <Link
            aria-label={link.label}
            className={`grid min-h-12 min-w-12 flex-1 place-items-center rounded-2xl transition-colors ${
              active ? "text-[var(--accent)]" : "text-[var(--muted)]"
            }`}
            href={link.href}
            key={link.href}
          >
            <Icon aria-hidden className="size-6" strokeWidth={active ? 2.4 : 2} />
          </Link>
        );
      })}
    </nav>
  );
}
