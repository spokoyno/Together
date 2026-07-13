export const LOCALE_COOKIE_NAME = "together-locale";
export const LOCALE_STORAGE_KEY = "together-locale";

export const LOCALES = [
  "en",
  "uk",
  "es",
  "de",
  "it",
  "zh",
  "hi",
  "pt",
  "ja",
  "tr",
  "fr",
  "ko",
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string | null | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function normalizeLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  uk: "Українська",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  zh: "中文",
  hi: "हिन्दी",
  pt: "Português",
  ja: "日本語",
  tr: "Türkçe",
  fr: "Français",
  ko: "한국어",
};

export function localeCookieValue(locale: Locale): string {
  return `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}
