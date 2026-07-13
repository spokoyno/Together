"use client";

import { Share } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
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
  const { t } = useLanguage();
  const [mode] = useState<InstallMode>(readInstallMode);

  function showBannerAgain() {
    localStorage.removeItem(PWA_INSTALL_DISMISS_KEY);
    window.location.reload();
  }

  if (mode === "installed") {
    return (
      <section className="alert-success mt-5 rounded-3xl p-5">
        <p className="font-semibold">{t("pwaInstalled")}</p>
        <p className="mt-2 text-sm leading-6 opacity-90">{t("pwaInstalledHint")}</p>
      </section>
    );
  }

  if (mode === "desktop") {
    return null;
  }

  return (
    <section className="mt-5 rounded-3xl surface-panel p-5">
      <p className="font-semibold">{t("pwaInstallOnPhone")}</p>
      {isIosDevice() ? (
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-6 text-[var(--muted)]">
          <li>{t("pwaInstallIos1")}</li>
          <li>
            {t("pwaInstallIosShare")}{" "}
            <Share aria-hidden className="inline size-4 align-text-bottom" />
          </li>
          <li>{t("pwaInstallIosAdd")}</li>
        </ol>
      ) : (
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-6 text-[var(--muted)]">
          <li>{t("pwaInstallAndroidChrome")}</li>
          <li>{t("pwaInstallAndroidMenu")}</li>
          <li>{t("pwaInstallAndroidLaunch")}</li>
        </ol>
      )}
      <button
        className="mt-4 text-sm font-semibold text-[var(--accent)]"
        onClick={showBannerAgain}
        type="button"
      >
        {t("pwaShowHintAgain")}
      </button>
    </section>
  );
}
