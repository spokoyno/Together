"use client";

import { Share } from "lucide-react";
import { useState } from "react";
import {
  isAndroidDevice,
  isIosDevice,
  isStandaloneMode,
  PWA_INSTALL_DISMISS_KEY,
} from "@/lib/pwa/platform";

type InstallMode = "browser" | "installed" | "desktop";

function readInstallMode(): InstallMode {
  if (typeof window === "undefined") {
    return "desktop";
  }

  if (isStandaloneMode()) {
    return "installed";
  }

  if (isIosDevice() || isAndroidDevice()) {
    return "browser";
  }

  return "desktop";
}

export function PwaInstallHelp() {
  const [mode] = useState<InstallMode>(readInstallMode);

  function showBannerAgain() {
    localStorage.removeItem(PWA_INSTALL_DISMISS_KEY);
    window.location.reload();
  }

  if (mode === "installed") {
    return (
      <section className="alert-success mt-5 rounded-3xl p-5">
        <p className="font-semibold">Приложение установлено</p>
        <p className="mt-2 text-sm leading-6 opacity-90">
          Together открыт как PWA с главного экрана.
        </p>
      </section>
    );
  }

  if (mode === "desktop") {
    return null;
  }

  return (
    <section className="mt-5 rounded-3xl surface-panel p-5">
      <p className="font-semibold">Установить на телефон</p>
      {isIosDevice() ? (
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-6 text-[var(--muted)]">
          <li>Откройте сайт в Safari (не во встроенном браузере Telegram или Instagram).</li>
          <li>
            Нажмите <Share aria-hidden className="inline size-4 align-text-bottom" /> «Поделиться».
          </li>
          <li>Выберите «На экран Домой» → «Добавить».</li>
        </ol>
      ) : (
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-6 text-[var(--muted)]">
          <li>Откройте сайт в Chrome.</li>
          <li>Меню (⋮) → «Установить приложение» или «Добавить на главный экран».</li>
          <li>Запускайте Together с иконки на главном экране.</li>
        </ol>
      )}
      <button
        className="mt-4 text-sm font-semibold text-[var(--accent)]"
        onClick={showBannerAgain}
        type="button"
      >
        Показать подсказку снова
      </button>
    </section>
  );
}
