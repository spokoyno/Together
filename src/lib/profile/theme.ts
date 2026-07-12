"use server";

import { getSessionUser } from "@/lib/auth/session";
import { themePreferenceSchema } from "@/lib/validation/theme";
import type { ThemePreference } from "@/types/domain";

export async function getThemePreference(): Promise<ThemePreference | null> {
  const { supabase, user } = await getSessionUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("theme_preference")
    .eq("id", user.id)
    .maybeSingle();

  const parsed = themePreferenceSchema.safeParse(data?.theme_preference);
  return parsed.success ? parsed.data : null;
}

export async function saveThemePreference(theme: ThemePreference): Promise<void> {
  const parsed = themePreferenceSchema.safeParse(theme);
  if (!parsed.success) {
    return;
  }

  const { supabase, user } = await getSessionUser();
  if (!user) {
    return;
  }

  await supabase
    .from("profiles")
    .update({
      theme_preference: parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
}
