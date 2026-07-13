"use client";

import { Bell } from "lucide-react";
import { useState, useTransition } from "react";
import { savePushSubscription } from "@/lib/push/actions";
import {
  getPushPermission,
  getServiceWorkerRegistration,
  urlBase64ToUint8Array,
} from "@/lib/push/client";

type NotificationsBannerProps = {
  vapidPublicKey: string | null;
  initialSubscriptionCount: number;
};

function subscriptionToPayload(subscription: PushSubscription) {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return null;
  }

  return {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  };
}

export function NotificationsBanner({
  vapidPublicKey,
  initialSubscriptionCount,
}: NotificationsBannerProps) {
  const permission = getPushPermission();
  const initiallyEnabled = permission === "granted" && initialSubscriptionCount > 0;
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!vapidPublicKey || permission === "unsupported" || enabled) {
    return null;
  }

  function enableNotifications() {
    if (!vapidPublicKey) {
      return;
    }

    setError("");
    startTransition(async () => {
      try {
        const result = await Notification.requestPermission();
        if (result !== "granted") {
          setError("Разрешите уведомления в настройках браузера.");
          return;
        }

        const registration = await getServiceWorkerRegistration();
        if (!registration) {
          setError("Обновите страницу и попробуйте снова.");
          return;
        }

        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await existing.unsubscribe();
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        const payload = subscriptionToPayload(subscription);
        if (!payload) {
          setError("Не удалось оформить подписку.");
          return;
        }

        const saveResult = await savePushSubscription(payload);
        if (!saveResult.ok) {
          setError(saveResult.error ?? "Не удалось сохранить подписку.");
          return;
        }

        setEnabled(true);
      } catch {
        setError("Не удалось включить уведомления.");
      }
    });
  }

  return (
    <section className="mt-5 rounded-3xl border border-[var(--accent-soft)] bg-[var(--accent-soft)]/40 p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--accent)] text-white">
          <Bell aria-hidden className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Включите уведомления</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {permission === "denied"
              ? "Разрешите уведомления в настройках браузера, чтобы не пропускать сообщения партнёра."
              : "Получайте сообщения и напоминания, когда приложение свёрнуто."}
          </p>
          {permission !== "denied" ? (
            <button
              className="mt-3 rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              disabled={isPending}
              onClick={enableNotifications}
              type="button"
            >
              {isPending ? "Подключаем..." : "Включить уведомления"}
            </button>
          ) : null}
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
