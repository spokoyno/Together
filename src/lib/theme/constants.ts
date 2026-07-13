export const THEME_STORAGE_KEY = "together-theme";
export const THEME_COOKIE_NAME = "together-theme";

export type ThemePreference = "light" | "dark";

export function isTheme(value: string | null | undefined): value is ThemePreference {
  return value === "light" || value === "dark";
}

export function themeCookieValue(theme: ThemePreference): string {
  return `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}
