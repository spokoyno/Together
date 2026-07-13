"use client";

import { Bell, Share, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { setNotificationsEnabled } from "@/lib/partner/actions";
import { getPushStatus, savePushSubscription } from "@/lib/push/actions";
import {
  getPushPermission,
  getServiceWorkerRegistration,
  urlBase64ToUint8Array,
} from "@/lib/push/client";
import {
  isInAppBrowser,
  isIosDevice,
  isMobileDevice,
  isStandaloneMode,
  PWA_INSTALL_DISMISS_KEY,
  PWA_NOTIFICATIONS_DISMISS_KEY,
} from "@/lib/pwa/platform";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type DashboardTopBannersProps = {
  vapidPublicKey: string | null;
  initialSubscriptionCount: number;
  profileNotificationsEnabled: boolean;
};

type ClientBannerState = {
  permission: NotificationPermission | "unsupported";
  installDismissed: boolean;
  notifDismissed: boolean;
  profileNotificationsEnabled: boolean;
  pushActive: boolean;
  pushChecked: boolean;
  standalone: boolean;
  mobile: boolean;
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

function readDismissed(key: string) {
  return localStorage.getItem(key) === "1";
}

async function detectPushActive(initialSubscriptionCount: number) {
  const permission = getPushPermission();
  if (permission !== "granted") {
    return false;
  }

  if (initialSubscriptionCount > 0) {
    return true;
  }

  const registration = await getServiceWorkerRegistration();
  const browserSubscription = await registration?.pushManager.getSubscription();
  if (browserSubscription) {
    return true;
  }

  const status = await getPushStatus();
  return status.subscriptionCount > 0;
}

type BannerShellProps = {
  label: string;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
  actionDisabled?: boolean;
  hint?: React.ReactNode;
};

function BannerShell({
  label,
  actionLabel,
  onAction,
  onDismiss,
  actionDisabled,
  hint,
}: BannerShellProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 px-3 py-2.5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{label}</p>
        <button
          className="shrink-0 rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          disabled={actionDisabled}
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
        <button
          aria-label="Закрыть"
          className="grid size-11 shrink-0 place-items-center rounded-xl surface-input text-[var(--muted)]"
          onClick={onDismiss}
          type="button"
        >
          <X aria-hidden className="size-5" strokeWidth={2.2} />
        </button>
      </div>
      {hint ? <div className="mt-2 border-t border-[var(--border)] pt-2">{hint}</div> : null}
    </div>
  );
}

export function DashboardTopBanners({
  vapidPublicKey,
  initialSubscriptionCount,
  profileNotificationsEnabled,
}: DashboardTopBannersProps) {
  const [clientState, setClientState] = useState<ClientBannerState | null>(null);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [showInstallHint, setShowInstallHint] = useState(false);
  const [notifError, setNotifError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const standalone = isStandaloneMode();
    const mobile = isMobileDevice();
    const permission = getPushPermission();

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setClientState({
        permission,
        installDismissed: readDismissed(PWA_INSTALL_DISMISS_KEY),
        notifDismissed: readDismissed(PWA_NOTIFICATIONS_DISMISS_KEY),
        profileNotificationsEnabled,
        pushActive:
          profileNotificationsEnabled &&
          permission === "granted" &&
          initialSubscriptionCount > 0,
        pushChecked: false,
        standalone,
        mobile,
      });

      if (mobile && !standalone) {
        setShowInstallHint(true);
      }
    });

    void (async () => {
      const pushActive =
        profileNotificationsEnabled && (await detectPushActive(initialSubscriptionCount));
      if (cancelled) {
        return;
      }
      setClientState((current) =>
        current ? { ...current, pushActive, pushChecked: true } : current,
      );
    })();

    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setShowInstallHint(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [initialSubscriptionCount, profileNotificationsEnabled]);

  if (!clientState) {
    return null;
  }

  const showInstall = !clientState.standalone && !clientState.installDismissed;

  const showNotificationsBecauseSettings =
    Boolean(vapidPublicKey) &&
    !clientState.profileNotificationsEnabled &&
    !clientState.notifDismissed;

  const showNotificationsBecausePush =
    Boolean(vapidPublicKey) &&
    clientState.profileNotificationsEnabled &&
    clientState.pushChecked &&
    !clientState.pushActive &&
    !clientState.notifDismissed &&
    clientState.permission !== "unsupported";

  const showNotifications = showNotificationsBecauseSettings || showNotificationsBecausePush;

  if (!showInstall && !showNotifications) {
    return null;
  }

  function dismissInstall() {
    localStorage.setItem(PWA_INSTALL_DISMISS_KEY, "1");
    setClientState((current) => (current ? { ...current, installDismissed: true } : current));
  }

  function dismissNotifications() {
    localStorage.setItem(PWA_NOTIFICATIONS_DISMISS_KEY, "1");
    setClientState((current) => (current ? { ...current, notifDismissed: true } : current));
  }

  async function handleNativeInstall() {
    if (!installEvent) {
      setShowInstallHint(true);
      return;
    }

    setInstalling(true);
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstalling(false);

    if (choice.outcome === "accepted") {
      setClientState((current) => (current ? { ...current, installDismissed: true } : current));
    }
  }

  function handleInstallAction() {
    if (installEvent) {
      void handleNativeInstall();
      return;
    }

    setShowInstallHint((current) => !current);
  }

  function enableNotifications() {
    if (!vapidPublicKey || !clientState) {
      return;
    }

    const settingsWereDisabled = !clientState.profileNotificationsEnabled;

    setNotifError("");
    startTransition(async () => {
      try {
        if (settingsWereDisabled) {
          const settingsResult = await setNotificationsEnabled(true);
          if (!settingsResult.ok) {
            setNotifError(settingsResult.error ?? "Не удалось включить в настройках.");
            return;
          }
        }

        const result = await Notification.requestPermission();
        if (result !== "granted") {
          setNotifError("Разрешите уведомления в настройках браузера.");
          setClientState((current) =>
            current
              ? { ...current, permission: result, profileNotificationsEnabled: true }
              : current,
          );
          return;
        }

        const registration = await getServiceWorkerRegistration();
        if (!registration) {
          setNotifError("Обновите страницу и попробуйте снова.");
          return;
        }

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
        }

        const payload = subscriptionToPayload(subscription);
        if (!payload) {
          setNotifError("Не удалось оформить подписку.");
          return;
        }

        const saveResult = await savePushSubscription(payload);
        if (!saveResult.ok) {
          setNotifError(saveResult.error ?? "Не удалось сохранить подписку.");
          return;
        }

        setClientState((current) =>
          current
            ? {
                ...current,
                pushActive: true,
                pushChecked: true,
                profileNotificationsEnabled: true,
                permission: "granted",
              }
            : current,
        );
      } catch {
        setNotifError("Не удалось включить уведомления.");
      }
    });
  }

  const installActionLabel = installEvent
    ? "Установить"
    : showInstallHint
      ? "Скрыть"
      : "Установить";

  const notificationsLabel = showNotificationsBecauseSettings
    ? "Уведомления выключены в настройках"
    : "Включите уведомления";

  return (
    <div className="sticky top-0 z-30 -mx-5 space-y-2 px-3 pb-3 pt-[max(0.25rem,env(safe-area-inset-top))]">
      {showInstall ? (
        <BannerShell
          actionDisabled={installing}
          actionLabel={installing ? "..." : installActionLabel}
          hint={
            showInstallHint ? (
              isInAppBrowser() ? (
                <p className="text-xs leading-5 text-[var(--muted)]">
                  Откройте сайт во внешнем браузере (Safari или Chrome), затем добавьте на главный
                  экран.
                </p>
              ) : isIosDevice() ? (
                <ol className="list-decimal space-y-1 pl-4 text-xs leading-5 text-[var(--muted)]">
                  <li>Откройте в Safari (не во встроенном браузере).</li>
                  <li>
                    Нажмите{" "}
                    <Share aria-hidden className="inline size-3.5 align-text-bottom" /> «Поделиться»
                  </li>
                  <li>Выберите «На экран Домой» → «Добавить»</li>
                </ol>
              ) : (
                <p className="text-xs leading-5 text-[var(--muted)]">
                  Меню браузера (⋮) → «Установить приложение» или «Добавить на главный экран».
                </p>
              )
            ) : null
          }
          label="Установите приложение на главный экран"
          onAction={handleInstallAction}
          onDismiss={dismissInstall}
        />
      ) : null}

      {showNotifications ? (
        <BannerShell
          actionDisabled={isPending || clientState.permission === "denied"}
          actionLabel={isPending ? "..." : "Включить"}
          hint={
            notifError ? (
              <p className="text-xs text-red-600">{notifError}</p>
            ) : showNotificationsBecauseSettings ? (
              <p className="text-xs leading-5 text-[var(--muted)]">
                Вы отключили уведомления в профиле партнёра. Включите снова, чтобы получать
                сообщения.
              </p>
            ) : clientState.permission === "denied" ? (
              <p className="text-xs leading-5 text-[var(--muted)]">
                Разрешите уведомления в настройках браузера или телефона.
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Bell aria-hidden className="size-3.5 shrink-0" />
                Сообщения и напоминания, когда приложение свёрнуто
              </p>
            )
          }
          label={notificationsLabel}
          onAction={enableNotifications}
          onDismiss={dismissNotifications}
        />
      ) : null}
    </div>
  );
}
