"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n/constants";

export function LanguagePicker() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="rounded-3xl surface-panel p-5">
      <label className="grid gap-2">
        <span className="font-semibold">{t("profileLanguage")}</span>
        <select
          className="rounded-2xl surface-input px-4 py-3"
          onChange={(event) => setLocale(event.target.value as Locale)}
          value={locale}
        >
          {LOCALES.map((code) => (
            <option key={code} value={code}>
              {LOCALE_LABELS[code]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
