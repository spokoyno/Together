"use client";

import { Bell, BellOff } from "lucide-react";
import { useState, useTransition } from "react";
import { removePushSubscription, savePushSubscription } from "@/lib/push/actions";
import {
  getPushPermission,
  getServiceWorkerRegistration,
  urlBase64ToUint8Array,
} from "@/lib/push/client";

type PushNotificationsSetupProps = {
  vapidPublicKey: string | null;
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

export function PushNotificationsSetup({ vapidPublicKey }: PushNotificationsSetupProps) {
  const permission = getPushPermission();
  const [enabled, setEnabled] = useState(permission === "granted");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (permission === "unsupported" || !vapidPublicKey) {
    return (
      <section className="rounded-3xl border border-dashed border-[var(--border)] bg-white p-4 text-sm text-[var(--muted)]">
        Уведомления недоступны в этом браузере или не настроены на сервере.
      </section>
    );
  }

  function enableNotifications() {
    if (!vapidPublicKey) {
      return;
    }

    setError("");
    startTransition(async () => {
      const publicKey = vapidPublicKey;
      const result = await Notification.requestPermission();
      if (result !== "granted") {
        setError("Разрешите уведомления в настройках браузера.");
        return;
      }

      const registration = await getServiceWorkerRegistration();
      if (!registration) {
        setError("Service worker не готов. Обновите страницу.");
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const payload = subscriptionToPayload(subscription);
      if (!payload) {
        setError("Не удалось оформить подписку.");
        return;
      }

      const saveResult = await savePushSubscription(payload);
      if (!saveResult.ok) {
        setError(saveResult.error ?? "Не удалось включить уведомления.");
        return;
      }

      setEnabled(true);
    });
  }

  function disableNotifications() {
    setError("");
    startTransition(async () => {
      const registration = await getServiceWorkerRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await removePushSubscription(endpoint);
      }

      setEnabled(false);
    });
  }

  if (permission === "denied") {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-white p-4">
        <p className="font-semibold">Уведомления заблокированы</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Разрешите уведомления для Together в настройках браузера или телефона, затем вернитесь
          сюда.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Уведомления чата</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            Получайте сообщения партнёра, даже когда приложение свёрнуто. На iPhone нужна
            установка PWA на главный экран.
          </p>
        </div>
        {enabled ? (
          <Bell aria-hidden className="size-5 shrink-0 text-[var(--accent)]" />
        ) : (
          <BellOff aria-hidden className="size-5 shrink-0 text-[var(--muted)]" />
        )}
      </div>

      <button
        className="mt-4 w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        onClick={enabled ? disableNotifications : enableNotifications}
        type="button"
      >
        {isPending
          ? "Сохраняем..."
          : enabled
            ? "Отключить уведомления"
            : "Включить уведомления"}
      </button>

      {error ? (
        <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
