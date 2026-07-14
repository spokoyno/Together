"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  getPushStatus,
  removePushSubscription,
  savePushSubscription,
  sendTestPushNotification,
} from "@/lib/push/actions";
import {
  getPushPermission,
  getServiceWorkerRegistration,
  registerServiceWorker,
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

async function subscribeToPush(
  publicKey: string,
  t: (key: MessageKey, params?: Record<string, string | number>) => string,
) {
  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    throw new Error(t("pwaSwNotReady"));
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
    throw new Error(t("pwaNotifErrorSubscribe"));
  }

  const saveResult = await savePushSubscription(payload);
  if (!saveResult.ok) {
    throw new Error(saveResult.error ?? t("pwaNotifErrorSave"));
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
  const { t } = useLanguage();
  const permission = getPushPermission();
  const [enabled, setEnabled] = useState(
    permission === "granted" && initialSubscriptionCount > 0,
  );
  const [swReady, setSwReady] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void (async () => {
      const registration = await registerServiceWorker();
      setSwReady(Boolean(registration?.active));
    })();
  }, []);

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
        await subscribeToPush(vapidPublicKey, t);
        setEnabled(true);
        setInfo(t("pwaNotifSynced"));
      } catch {
        // User may need to tap enable manually after changing VAPID keys.
      }
    })();
  }, [permission, t, vapidPublicKey]);

  if (permission === "unsupported" || !vapidPublicKey) {
    return (
      <section className="rounded-3xl surface-panel border-dashed p-4 text-sm text-[var(--muted)]">
        {t("pwaNotifUnavailable")}
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
          setError(t("pwaNotifErrorPermission"));
          return;
        }

        await subscribeToPush(vapidPublicKey, t);
        setEnabled(true);
        setInfo(t("pwaNotifEnabledMsg"));
      } catch (subscribeError) {
        setError(
          subscribeError instanceof Error
            ? subscribeError.message
            : t("pwaNotifErrorGeneric"),
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
        setError(result.error ?? t("pwaTestFailed"));
        return;
      }

      setInfo(t("pwaTestSent"));
    });
  }

  if (permission === "denied") {
    return (
      <section className="rounded-3xl surface-panel p-4">
        <p className="font-semibold">{t("pwaNotifBlocked")}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t("pwaNotifBlockedHint")}</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl surface-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{t("pwaChatNotif")}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{t("pwaChatNotifHint")}</p>
        </div>
        {enabled ? (
          <Bell aria-hidden className="size-5 shrink-0 text-[var(--accent)]" />
        ) : (
          <BellOff aria-hidden className="size-5 shrink-0 text-[var(--muted)]" />
        )}
      </div>

      {!serverReady ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t("pwaServerNotReady")}
          <ul className="mt-2 list-disc pl-5">
            {!vapidConfigured ? <li>{t("pwaNoVapid")}</li> : null}
            {!serviceRoleConfigured ? <li>{t("pwaNoServiceRole")}</li> : null}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        {!swReady && !enabled ? (
          <p className="text-sm text-[var(--muted)]">{t("pwaSwPreparing")}</p>
        ) : null}

        <button
          className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isPending || (!enabled && !swReady)}
          onClick={enabled ? disableNotifications : enableNotifications}
          type="button"
        >
          {isPending
            ? t("commonSaving")
            : enabled
              ? t("pwaDisableNotif")
              : t("pwaNotifEnable")}
        </button>

        {enabled ? (
          <button
            className="w-full rounded-2xl surface-input px-4 py-3 text-sm font-semibold"
            disabled={isPending}
            onClick={testNotification}
            type="button"
          >
            {t("pwaTestNotif")}
          </button>
        ) : null}
      </div>

      {info ? (
        <p className="mt-3 alert-success rounded-2xl px-3 py-2 text-sm">
          {info}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 alert-error rounded-xl px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}
    </section>
  );
}
