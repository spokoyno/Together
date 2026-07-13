"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Image,
  ListTodo,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { setAppBadgeCount } from "@/lib/pwa/app-badge";
import { createClient } from "@/lib/supabase/client";

type BottomNavProps = {
  coupleId: string | null;
  userId: string;
  initialUnread: number;
  initialUnreadNotifications: number;
};

const navLinks = [
  { href: "/dashboard", label: "Главная", icon: Home },
  { href: "/plans", label: "Планы", icon: ListTodo },
  { href: "/memories", label: "Лента", icon: Image },
  { href: "/profile", label: "Профиль", icon: UserRound },
] as const;

export function BottomNav({ coupleId, userId, initialUnread, initialUnreadNotifications }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [liveUnread, setLiveUnread] = useState(0);

  const isChatActive = pathname === "/chat";
  const visibleUnread = isChatActive ? 0 : initialUnread + liveUnread;
  const activePath = pendingPath !== null && pendingPath !== pathname ? pendingPath : pathname;
  const isNavigating = pendingPath !== null && pendingPath !== pathname;

  useEffect(() => {
    const prefetchMainTabs = () => {
      for (const link of navLinks) {
        router.prefetch(link.href);
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(prefetchMainTabs);
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(prefetchMainTabs, 1500);
    return () => globalThis.clearTimeout(timeoutId);
  }, [router]);

  useEffect(() => {
    setAppBadgeCount(visibleUnread);
  }, [visibleUnread]);

  useEffect(() => {
    if (!coupleId || isChatActive) {
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
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as { sender_id: string };
          if (row.sender_id === userId) {
            return;
          }

          setLiveUnread((current) => current + 1);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, isChatActive, userId]);

  function navigate(href: string) {
    if (pathname === href) {
      return;
    }

    setPendingPath(href);
    startTransition(() => {
      router.push(href);
    });
  }

  function isActive(href: string) {
    if (href === "/memories") {
      return activePath === href || activePath.startsWith("/memories/");
    }
    return activePath === href;
  }

  return (
    <>
      {isNavigating ? (
        <div
          aria-hidden
          className="nav-progress fixed left-0 right-0 top-0 z-50 h-0.5 origin-left bg-[var(--accent)]"
        />
      ) : null}

      <nav className="nav-shell fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-end justify-between rounded-[28px] px-2 py-2 shadow-lg">
        {navLinks.slice(0, 2).map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);

          return (
            <button
              aria-current={active ? "page" : undefined}
              aria-label={link.label}
              className={`grid min-h-12 min-w-12 flex-1 place-items-center rounded-2xl transition-all duration-200 ${
                active ? "scale-105 text-[var(--accent)]" : "text-[var(--muted)]"
              }`}
              key={link.href}
              onClick={() => navigate(link.href)}
              type="button"
            >
              <Icon aria-hidden className="size-6" strokeWidth={active ? 2.4 : 2} />
            </button>
          );
        })}

        <button
          aria-current={isActive("/chat") ? "page" : undefined}
          aria-label="Чат"
          className={`relative grid size-14 -translate-y-4 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg transition-all duration-200 active:scale-95 ${
            isActive("/chat") ? "ring-4 ring-[var(--accent-soft)]" : ""
          }`}
          onClick={() => navigate("/chat")}
          type="button"
        >
          <MessageCircle aria-hidden className="size-7" strokeWidth={2.2} />
          {visibleUnread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-[var(--badge-bg)] px-1.5 py-0.5 text-[11px] font-bold leading-none text-[var(--badge-text)]">
              {visibleUnread > 99 ? "99+" : visibleUnread}
            </span>
          ) : null}
        </button>

        {navLinks.slice(2).map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          const showNotificationBadge = link.href === "/profile" && initialUnreadNotifications > 0;

          return (
            <button
              aria-current={active ? "page" : undefined}
              aria-label={link.label}
              className={`relative grid min-h-12 min-w-12 flex-1 place-items-center rounded-2xl transition-all duration-200 ${
                active ? "scale-105 text-[var(--accent)]" : "text-[var(--muted)]"
              }`}
              key={link.href}
              onClick={() => navigate(link.href)}
              type="button"
            >
              <Icon aria-hidden className="size-6" strokeWidth={active ? 2.4 : 2} />
              {showNotificationBadge ? (
                <span className="absolute right-2 top-1 grid min-w-4 place-items-center rounded-full bg-[var(--badge-bg)] px-1 py-0.5 text-[10px] font-bold leading-none text-[var(--badge-text)]">
                  {initialUnreadNotifications > 9 ? "9+" : initialUnreadNotifications}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </>
  );
}
