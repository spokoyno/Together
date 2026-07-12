"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import {
  getPushStatus,
  removePushSubscription,
  savePushSubscription,
  sendTestPushNotification,
} from "@/lib/push/actions";
import {
  getPushPermission,
  getServiceWorkerRegistration,
  urlBase64ToUint8Array,
} from "@/lib/push/client";

type PushNotificationsSetupProps = {
  vapidPublicKey: string | null;
  initialSubscriptionCount: number;
  serverReady: boolean;
  vapidConfigured: boolean;
  serviceRoleConfigured: boolean;
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

async function subscribeToPush(publicKey: string) {
  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    throw new Error("Service worker не готов. Обновите страницу.");
  }

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await existing.unsubscribe();
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const payload = subscriptionToPayload(subscription);
  if (!payload) {
    throw new Error("Не удалось оформить подписку.");
  }

  const saveResult = await savePushSubscription(payload);
  if (!saveResult.ok) {
    throw new Error(saveResult.error ?? "Не удалось сохранить подписку.");
  }

  return payload.endpoint;
}

export function PushNotificationsSetup({
  vapidPublicKey,
  initialSubscriptionCount,
  serverReady,
  vapidConfigured,
  serviceRoleConfigured,
}: PushNotificationsSetupProps) {
  const permission = getPushPermission();
  const [enabled, setEnabled] = useState(
    permission === "granted" && initialSubscriptionCount > 0,
  );
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (permission !== "granted" || !vapidPublicKey) {
      return;
    }

    void (async () => {
      const status = await getPushStatus();
      if (status.subscriptionCount > 0) {
        setEnabled(true);
        return;
      }

      try {
        await subscribeToPush(vapidPublicKey);
        setEnabled(true);
        setInfo("Подписка синхронизирована.");
      } catch {
        // User may need to tap enable manually after changing VAPID keys.
      }
    })();
  }, [permission, vapidPublicKey]);

  if (permission === "unsupported" || !vapidPublicKey) {
    return (
      <section className="rounded-3xl border border-dashed border-[var(--border)] bg-white p-4 text-sm text-[var(--muted)]">
        Уведомления недоступны в этом браузере или VAPID ключ не задан на сервере.
      </section>
    );
  }

  function enableNotifications() {
    if (!vapidPublicKey) {
      return;
    }

    setError("");
    setInfo("");
    startTransition(async () => {
      try {
        const result = await Notification.requestPermission();
        if (result !== "granted") {
          setError("Разрешите уведомления в настройках браузера.");
          return;
        }

        await subscribeToPush(vapidPublicKey);
        setEnabled(true);
        setInfo("Уведомления включены.");
      } catch (subscribeError) {
        setError(
          subscribeError instanceof Error
            ? subscribeError.message
            : "Не удалось включить уведомления.",
        );
      }
    });
  }

  function disableNotifications() {
    setError("");
    setInfo("");
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

  function testNotification() {
    setError("");
    setInfo("");
    startTransition(async () => {
      const result = await sendTestPushNotification();
      if (!result.ok) {
        setError(result.error ?? "Тест не удался.");
        return;
      }

      setInfo("Тест отправлен. Сверните приложение, если уведомление не видно.");
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
            Получайте сообщения партнёра, когда приложение свёрнуто. На iPhone нужен PWA с главного
            экрана и iOS 16.4+.
          </p>
        </div>
        {enabled ? (
          <Bell aria-hidden className="size-5 shrink-0 text-[var(--accent)]" />
        ) : (
          <BellOff aria-hidden className="size-5 shrink-0 text-[var(--muted)]" />
        )}
      </div>

      {!serverReady ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Сервер не готов отправлять push:
          <ul className="mt-2 list-disc pl-5">
            {!vapidConfigured ? <li>Нет VAPID ключей на сервере</li> : null}
            {!serviceRoleConfigured ? (
              <li>Нет SUPABASE_SERVICE_ROLE_KEY (нужен для отправки партнёру)</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        <button
          className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
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

        {enabled ? (
          <button
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold"
            disabled={isPending}
            onClick={testNotification}
            type="button"
          >
            Отправить тестовое уведомление
          </button>
        ) : null}
      </div>

      {info ? (
        <p className="mt-3 rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {info}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
