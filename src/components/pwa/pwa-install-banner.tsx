"use client";

import { Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  isAndroidDevice,
  isIosDevice,
  isMobileDevice,
  isStandaloneMode,
  PWA_INSTALL_DISMISS_KEY,
} from "@/lib/pwa/platform";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type BannerState = {
  visible: boolean;
  platform: "ios" | "android" | "other";
};

function readBannerState(): BannerState {
  if (typeof window === "undefined") {
    return { visible: false, platform: "other" };
  }

  if (isStandaloneMode() || localStorage.getItem(PWA_INSTALL_DISMISS_KEY) === "1") {
    return { visible: false, platform: "other" };
  }

  if (!isMobileDevice()) {
    return { visible: false, platform: "other" };
  }

  if (isIosDevice()) {
    return { visible: true, platform: "ios" };
  }

  if (isAndroidDevice()) {
    return { visible: true, platform: "android" };
  }

  return { visible: false, platform: "other" };
}

export function PwaInstallBanner() {
  const [banner, setBanner] = useState<BannerState>(readBannerState);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setBanner({ visible: true, platform: "android" });
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  function dismiss() {
    localStorage.setItem(PWA_INSTALL_DISMISS_KEY, "1");
    setBanner({ visible: false, platform: "other" });
  }

  async function handleAndroidInstall() {
    if (!installEvent) {
      return;
    }

    setInstalling(true);
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstalling(false);

    if (choice.outcome === "accepted") {
      setBanner({ visible: false, platform: "other" });
    }
  }

  if (!banner.visible) {
    return null;
  }

  return (
    <section className="fixed inset-x-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+5.5rem)] z-50 mx-auto max-w-md rounded-3xl surface-panel p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-lg">
          ♥
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold">Установите Together</p>
          {banner.platform === "ios" ? (
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm leading-6 text-[var(--muted)]">
              <li>
                Нажмите <Share aria-hidden className="inline size-4 align-text-bottom" /> «Поделиться» в Safari
              </li>
              <li>Выберите «На экран Домой»</li>
              <li>Нажмите «Добавить»</li>
            </ol>
          ) : (
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Добавьте приложение на главный экран — оно откроется без адресной строки.
            </p>
          )}

          {banner.platform === "android" && installEvent ? (
            <button
              className="mt-3 w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              disabled={installing}
              onClick={handleAndroidInstall}
              type="button"
            >
              {installing ? "Устанавливаем..." : "Установить приложение"}
            </button>
          ) : null}

          {banner.platform === "android" && !installEvent ? (
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              Меню Chrome (⋮) → «Установить приложение» или «Добавить на главный экран».
            </p>
          ) : null}
        </div>

        <button
          aria-label="Закрыть подсказку"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--border)]"
          onClick={dismiss}
          type="button"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </section>
  );
}
