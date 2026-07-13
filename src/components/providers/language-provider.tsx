"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type Locale,
  localeCookieValue,
  normalizeLocale,
} from "@/lib/i18n/constants";
import { translate, type Messages } from "@/lib/i18n/messages";
import { saveLocalePreference } from "@/lib/profile/locale";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof Messages, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function persistLocaleLocally(locale: Locale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = localeCookieValue(locale);
  document.documentElement.lang = locale;
}

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale | null;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => normalizeLocale(initialLocale ?? DEFAULT_LOCALE));

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocaleLocally(next);
    void saveLocalePreference(next);
  }, []);

  const t = useCallback(
    (key: keyof Messages, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
