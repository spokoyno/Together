import type { Locale } from "@/lib/i18n/constants";
import { enCatalog } from "@/lib/i18n/en-catalog";
import { localeOverrides } from "@/lib/i18n/locale-overrides";

export type Messages = Record<MessageKey, string>;
export type MessageKey = keyof typeof enCatalog;

function buildLocale(locale: Locale): Messages {
  return { ...enCatalog, ...(localeOverrides[locale] ?? {}) };
}

export const messagesByLocale: Record<Locale, Messages> = {
  en: buildLocale("en"),
  uk: buildLocale("uk"),
  es: buildLocale("es"),
  de: buildLocale("de"),
  it: buildLocale("it"),
  zh: buildLocale("zh"),
  hi: buildLocale("hi"),
  pt: buildLocale("pt"),
  ja: buildLocale("ja"),
  tr: buildLocale("tr"),
  fr: buildLocale("fr"),
  ko: buildLocale("ko"),
};

export function translate(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const template = messagesByLocale[locale]?.[key] ?? messagesByLocale.en[key] ?? String(key);
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce<string>(
    (text, [name, value]) => text.replace(`{${name}}`, String(value)),
    template,
  );
}

// Re-export for convenience
export { enCatalog };
