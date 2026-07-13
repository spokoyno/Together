"use client";

import { Bell, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { useLanguage } from "@/components/providers/language-provider";
import type { NotificationType } from "@/lib/notifications/actions";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications/actions";
import { formatDateRu } from "@/lib/dates";

export type InAppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link_path: string | null;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
};

type NotificationsPanelProps = {
  notifications: InAppNotification[];
};

function notificationIcon(type: NotificationType) {
  switch (type) {
    case "tier_challenge":
      return "🏆";
    case "poll_invite":
      return "📋";
    case "mood_change":
      return "💭";
    case "event_reminder":
      return "📅";
    default:
      return "🔔";
  }
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  function handleMarkRead(notificationId: string) {
    startTransition(async () => {
      await markNotificationRead(notificationId);
      router.refresh();
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  function openNotification(notification: InAppNotification) {
    if (!notification.read_at) {
      handleMarkRead(notification.id);
    }
    if (notification.link_path) {
      router.push(notification.link_path);
    }
  }

  return (
    <section className="grid gap-3">
      {unreadCount > 0 ? (
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-2xl surface-input px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          disabled={isPending}
          onClick={handleMarkAllRead}
          type="button"
        >
          <Check aria-hidden className="size-4" />
          {t("profileMarkAllRead")}
        </button>
      ) : null}

      {notifications.length ? (
        notifications.map((notification) => {
          const unread = !notification.read_at;
          const content = (
            <article
              className={`rounded-3xl surface-panel p-4 transition-opacity ${unread ? "ring-1 ring-[var(--accent-soft)]" : "opacity-80"}`}
            >
              <div className="flex items-start gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-lg">
                  {notificationIcon(notification.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold leading-snug">{notification.title}</p>
                    {unread ? (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--accent)]" />
                    ) : null}
                  </div>
                  {notification.body ? (
                    <p className="mt-1 text-sm text-[var(--muted)]">{notification.body}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[var(--muted)]">{formatDateRu(notification.created_at)}</p>
                  {notification.link_path ? (
                    <p className="mt-2 text-xs font-semibold text-[var(--accent)]">Открыть →</p>
                  ) : null}
                </div>
              </div>
            </article>
          );

          if (notification.link_path) {
            return (
              <Link
                className="block active:scale-[0.99]"
                href={notification.link_path}
                key={notification.id}
                onClick={() => {
                  if (!notification.read_at) {
                    void markNotificationRead(notification.id);
                  }
                }}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              className="block w-full text-left active:scale-[0.99]"
              key={notification.id}
              onClick={() => openNotification(notification)}
              type="button"
            >
              {content}
            </button>
          );
        })
      ) : (
        <EmptyState
          description=""
          title={t("profileNoNotifications")}
        />
      )}

      {!notifications.length ? (
        <div className="mt-2 flex justify-center text-[var(--muted)]">
          <Bell aria-hidden className="size-8 opacity-40" />
        </div>
      ) : null}
    </section>
  );
}
