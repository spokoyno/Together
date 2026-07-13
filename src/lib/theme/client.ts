"use client";

import type { ColorPalette } from "@/lib/theme/constants";
import {
  DEFAULT_COLOR_PALETTE,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
  isColorPalette,
  normalizeColorPalette,
  themeCookieValue,
} from "@/lib/theme/constants";

export function applyThemeToDocument(palette: ColorPalette) {
  document.documentElement.dataset.theme = palette;
  document.documentElement.style.colorScheme = "dark";
}

export function persistThemeLocally(palette: ColorPalette) {
  localStorage.setItem(THEME_STORAGE_KEY, palette);
  document.cookie = themeCookieValue(palette);
  applyThemeToDocument(palette);
}

export function readThemeFromDocument(): ColorPalette | null {
  const fromDom = document.documentElement.dataset.theme;
  return isColorPalette(fromDom) ? fromDom : null;
}

export function readThemeFromStorage(): ColorPalette | null {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isColorPalette(stored) ? stored : null;
}

export function readThemeFromCookie(): ColorPalette | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${THEME_COOKIE_NAME}=(pink|blue|purple|emerald|amber)(?:;|$)`),
  );
  return isColorPalette(match?.[1]) ? match[1] : null;
}

export function resolveClientTheme(): ColorPalette {
  return normalizeColorPalette(
    readThemeFromDocument() ?? readThemeFromStorage() ?? readThemeFromCookie() ?? DEFAULT_COLOR_PALETTE,
  );
}
