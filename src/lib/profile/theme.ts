"use server";

import { getSessionUser } from "@/lib/auth/session";
import { themePreferenceSchema } from "@/lib/validation/theme";
import type { ColorPalette } from "@/lib/theme/constants";
import { normalizeColorPalette } from "@/lib/theme/constants";

export async function getThemePreference(): Promise<ColorPalette | null> {
  const { supabase, user } = await getSessionUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("theme_preference")
    .eq("id", user.id)
    .maybeSingle();

  if (!data?.theme_preference) {
    return null;
  }

  const parsed = themePreferenceSchema.safeParse(data.theme_preference);
  return parsed.success ? parsed.data : normalizeColorPalette(data.theme_preference);
}

export async function saveThemePreference(palette: ColorPalette): Promise<void> {
  const parsed = themePreferenceSchema.safeParse(palette);
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
