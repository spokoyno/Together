export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorStandalone = (
    window.navigator as Navigator & { standalone?: boolean }
  ).standalone;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorStandalone === true
  );
}

export function isIosDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const ua = window.navigator.userAgent;
  const isClassicIos = /iphone|ipad|ipod/i.test(ua);
  const isIpadDesktopUa =
    window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;

  return isClassicIos || isIpadDesktopUa;
}

export function isAndroidDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return /android/i.test(window.navigator.userAgent);
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return isIosDevice() || isAndroidDevice();
}

export function isInAppBrowser(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return /telegram|instagram|fbav|fban|line\//i.test(window.navigator.userAgent);
}

export const PWA_INSTALL_DISMISS_KEY = "together-pwa-install-dismissed";
export const PWA_NOTIFICATIONS_DISMISS_KEY = "together-notifications-banner-dismissed";
