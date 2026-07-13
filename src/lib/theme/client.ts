"use client";

import type { ThemePreference } from "@/lib/theme/constants";
import { THEME_COOKIE_NAME, THEME_STORAGE_KEY, themeCookieValue } from "@/lib/theme/constants";

export function applyThemeToDocument(theme: ThemePreference) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function persistThemeLocally(theme: ThemePreference) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.cookie = themeCookieValue(theme);
  applyThemeToDocument(theme);
}

export function readThemeFromDocument(): ThemePreference | null {
  const fromDom = document.documentElement.dataset.theme;
  if (fromDom === "light" || fromDom === "dark") {
    return fromDom;
  }
  return null;
}

export function readThemeFromStorage(): ThemePreference | null {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return null;
}

export function readThemeFromCookie(): ThemePreference | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE_NAME}=(dark|light)(?:;|$)`));
  if (match?.[1] === "light" || match?.[1] === "dark") {
    return match[1];
  }
  return null;
}

export function resolveClientTheme(): ThemePreference {
  return (
    readThemeFromDocument() ??
    readThemeFromStorage() ??
    readThemeFromCookie() ??
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
}
