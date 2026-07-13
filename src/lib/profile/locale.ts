"use server";

import { getSessionUser } from "@/lib/auth/session";
import { type Locale, normalizeLocale } from "@/lib/i18n/constants";

export async function getLocalePreference(): Promise<Locale | null> {
  const { supabase, user } = await getSessionUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase.from("profiles").select("locale").eq("id", user.id).maybeSingle();

  if (!data?.locale) {
    return null;
  }

  return normalizeLocale(data.locale);
}

export async function saveLocalePreference(locale: Locale): Promise<void> {
  const normalized = normalizeLocale(locale);
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return;
  }

  await supabase
    .from("profiles")
    .update({
      locale: normalized,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
}
